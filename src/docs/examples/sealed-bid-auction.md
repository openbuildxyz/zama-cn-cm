# 密封竞价拍卖

本示例实现了一个完整的链上 NFT 保密拍卖合约。所有出价在拍卖期间全程加密，拍卖结束后通过公开解密揭晓胜者，非胜者可全额退款。

> 完整代码来源：[github.com/zama-ai/fhevm](https://github.com/zama-ai/fhevm/tree/main/docs/examples)

---

## 合约设计

### 核心状态

| 变量 | 类型 | 说明 |
|------|------|------|
| `highestBid` | `euint64` | 当前最高出价（加密） |
| `winningAddress` | `eaddress` | 当前胜者地址（加密） |
| `bids` | `mapping(address => euint64)` | 每位竞拍者的出价（加密） |
| `winnerAddress` | `address` | 公开解密后的胜者地址 |

### 流程概述

```
竞拍期间:   bid() → 加密出价 → FHE 比较更新最高价
拍卖结束后: decryptWinningAddress() → 公开解密请求
           resolveAuction()         → 验证解密证明，记录胜者
胜者:       winnerClaimPrize()      → 领取 NFT，支付最高价
非胜者:     withdraw()              → 全额退款
```

---

## `BlindAuction.sol`

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {FHE, externalEuint64, euint64, eaddress, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";

/// @title 密封竞价 NFT 拍卖合约
/// @notice 出价全程加密，拍卖结束后通过公开解密揭晓胜者
contract BlindAuction is ZamaEthereumConfig, ReentrancyGuard, IERC721Receiver {

    address public beneficiary;           // 拍卖受益人
    IERC7984 public confidentialToken;    // 竞价代币（ERC7984 保密代币）
    IERC721 public nftContract;           // NFT 奖品合约
    uint256 public tokenId;               // NFT Token ID

    uint256 public auctionStartTime;
    uint256 public auctionEndTime;

    euint64 private highestBid;           // 最高出价（加密）
    eaddress private winningAddress;      // 胜者地址（加密）
    address public winnerAddress;         // 解密后的胜者地址
    bool public isNftClaimed;
    bool public decryptionRequested;

    mapping(address => euint64) private bids; // 各竞拍者出价

    error TooEarlyError(uint256 time);
    error TooLateError(uint256 time);
    error WinnerNotYetRevealed();

    event AuctionDecryptionRequested(eaddress encryptedWinningAddress);

    modifier onlyDuringAuction() {
        if (block.timestamp < auctionStartTime) revert TooEarlyError(auctionStartTime);
        if (block.timestamp >= auctionEndTime) revert TooLateError(auctionEndTime);
        _;
    }

    modifier onlyAfterEnd() {
        if (block.timestamp < auctionEndTime) revert TooEarlyError(auctionEndTime);
        _;
    }

    modifier onlyAfterWinnerRevealed() {
        if (winnerAddress == address(0)) revert WinnerNotYetRevealed();
        _;
    }

    constructor(
        address _nftContractAddress,
        address _confidentialTokenAddress,
        uint256 _tokenId,
        uint256 _auctionStartTime,
        uint256 _auctionEndTime
    ) {
        beneficiary = msg.sender;
        confidentialToken = IERC7984(_confidentialTokenAddress);
        nftContract = IERC721(_nftContractAddress);
        tokenId = _tokenId;
        nftContract.safeTransferFrom(msg.sender, address(this), _tokenId);
        require(_auctionStartTime < _auctionEndTime, "INVALID_TIME");
        auctionStartTime = _auctionStartTime;
        auctionEndTime = _auctionEndTime;
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /// @notice 提交加密出价
    function bid(externalEuint64 encryptedAmount, bytes calldata inputProof) public onlyDuringAuction nonReentrant {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        // 从用户转入代币，通过差值计算实际到账（防止转账滑点）
        euint64 balanceBefore = confidentialToken.confidentialBalanceOf(address(this));
        FHE.allowTransient(amount, address(confidentialToken));
        confidentialToken.confidentialTransferFrom(msg.sender, address(this), amount);
        euint64 balanceAfter = confidentialToken.confidentialBalanceOf(address(this));
        euint64 sentBalance = FHE.sub(balanceAfter, balanceBefore);

        // 累加出价（支持多次追加出价）
        euint64 previousBid = bids[msg.sender];
        if (FHE.isInitialized(previousBid)) {
            bids[msg.sender] = FHE.add(previousBid, sentBalance);
        } else {
            bids[msg.sender] = sentBalance;
        }

        euint64 currentBid = bids[msg.sender];
        FHE.allowThis(currentBid);
        FHE.allow(currentBid, msg.sender);

        // FHE 比较：更新最高出价和胜者地址
        if (FHE.isInitialized(highestBid)) {
            ebool isNewWinner = FHE.lt(highestBid, currentBid);
            highestBid = FHE.select(isNewWinner, currentBid, highestBid);
            winningAddress = FHE.select(isNewWinner, FHE.asEaddress(msg.sender), winningAddress);
        } else {
            highestBid = currentBid;
            winningAddress = FHE.asEaddress(msg.sender);
        }
        FHE.allowThis(highestBid);
        FHE.allowThis(winningAddress);
    }

    /// @notice 拍卖结束后请求公开解密胜者地址
    function decryptWinningAddress() public onlyAfterEnd {
        require(!decryptionRequested, "Decryption already requested");
        decryptionRequested = true;
        FHE.makePubliclyDecryptable(winningAddress);
        emit AuctionDecryptionRequested(winningAddress);
    }

    /// @notice 验证解密证明，记录胜者地址
    function resolveAuction(bytes memory abiEncodedClearResult, bytes memory decryptionProof) public {
        require(decryptionRequested, "Decryption not requested");
        require(winnerAddress == address(0), "Winner already resolved");
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(winningAddress);
        FHE.checkSignatures(cts, abiEncodedClearResult, decryptionProof);
        winnerAddress = abi.decode(abiEncodedClearResult, (address));
    }

    /// @notice 胜者领取 NFT，并将最高出价转给受益人
    function winnerClaimPrize() public onlyAfterWinnerRevealed {
        require(winnerAddress == msg.sender, "Only winner can claim item");
        require(!isNftClaimed, "NFT has already been claimed");
        isNftClaimed = true;
        bids[msg.sender] = FHE.asEuint64(0);
        FHE.allowThis(bids[msg.sender]);
        FHE.allow(bids[msg.sender], msg.sender);
        FHE.allowTransient(highestBid, address(confidentialToken));
        confidentialToken.confidentialTransfer(beneficiary, highestBid);
        nftContract.safeTransferFrom(address(this), msg.sender, tokenId);
    }

    /// @notice 非胜者撤回出价
    function withdraw(address bidder) public onlyAfterWinnerRevealed {
        if (bidder == winnerAddress) revert TooLateError(auctionEndTime);
        euint64 amount = bids[bidder];
        FHE.allowTransient(amount, address(confidentialToken));
        bids[bidder] = FHE.asEuint64(0);
        FHE.allowThis(bids[bidder]);
        FHE.allow(bids[bidder], bidder);
        confidentialToken.confidentialTransfer(bidder, amount);
    }

    // 查询函数
    function getEncryptedBid(address account) external view returns (euint64) { return bids[account]; }
    function getEncryptedWinningAddress() external view returns (eaddress) { return winningAddress; }
    function getWinnerAddress() external view returns (address) {
        require(winnerAddress != address(0), "Winner not yet decided");
        return winnerAddress;
    }
}
```

---

## `BlindAuction.ts`（测试核心片段）

```typescript
import { FhevmType } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

// 辅助：加密出价
async function encryptBid(contractAddress: string, userAddress: string, amount: number) {
  const input = fhevm.createEncryptedInput(contractAddress, userAddress);
  input.add64(amount);
  return await input.encrypt();
}

// 辅助：解密 USDCc 余额
async function getUSDCcBalance(instance: any, signer: HardhatEthersSigner): Promise<bigint> {
  const handle = await USDCc.confidentialBalanceOf(signer.address);
  return await fhevm.userDecryptEuint(FhevmType.euint64, handle, USDCcAddress, signer);
}

// 辅助：通过公开解密揭晓胜者
async function resolveAuction(blindAuction: any) {
  const tx = await blindAuction.decryptWinningAddress();
  const receipt = await tx.wait();
  let encryptedWinningAddress: string | undefined;
  for (const log of receipt!.logs) {
    const parsed = blindAuction.interface.parseLog(log);
    if (parsed?.name === "AuctionDecryptionRequested") {
      encryptedWinningAddress = parsed.args.encryptedWinningAddress;
      break;
    }
  }
  const publicDecryptResults = await fhevm.publicDecrypt([encryptedWinningAddress!]);
  await blindAuction.resolveAuction(
    publicDecryptResults.abiEncodedClearValues,
    publicDecryptResults.decryptionProof,
  );
}

it("Bob 出价最高，应赢得拍卖", async function () {
  // Alice 出价 10,000
  await approve(aliceSigner);
  await placeBid(aliceSigner, 10_000);

  // Bob 出价 15,000
  await approve(bobSigner);
  await placeBid(bobSigner, 15_000);

  // 等待拍卖结束
  await time.increase(3600);

  // 公开解密揭晓胜者
  await resolveAuction(blindAuction);

  // 验证 Bob 是胜者
  expect(await blindAuction.getWinnerAddress()).to.equal(bobSigner.address);

  // Bob 领取 NFT
  await blindAuction.connect(bobSigner).winnerClaimPrize();
  expect(await prizeItem.ownerOf(tokenId)).to.equal(bobSigner.address);

  // Alice 退款
  const aliceBefore = await getUSDCcBalance(USDCc, aliceSigner);
  await blindAuction.withdraw(aliceSigner.address);
  const aliceAfter = await getUSDCcBalance(USDCc, aliceSigner);
  expect(aliceAfter).to.equal(aliceBefore + 10_000n);
});
```

---

## 技术要点

| 技术 | 用途 |
|------|------|
| `euint64` + `eaddress` | 加密出价金额与胜者地址 |
| `FHE.lt()` + `FHE.select()` | 密文比较与条件更新（不解密即可判断大小） |
| `FHE.makePubliclyDecryptable()` | 将密文标记为可公开解密，触发链下解密流程 |
| `FHE.checkSignatures()` | 链上验证解密证明，防止伪造 |
| `FHE.allowTransient()` | 临时授权代币合约操作密文，用于加密转账 |
| ERC7984 | 保密代币标准，余额和转账金额全程加密 |
