# 保密代币 ERC7984

本示例基于 OpenZeppelin 保密合约库，实现 ERC7984 标准的保密代币。余额和转账金额全程加密，同时保留标准代币接口的可组合性。

> 完整代码来源：[github.com/zama-ai/fhevm](https://github.com/zama-ai/fhevm/tree/main/docs/examples/openzeppelin)

---

## 为什么需要保密代币？

| 场景 | 说明 |
|------|------|
| 个人隐私 | 用户持仓和交易金额对外不可见 |
| 机构隐私 | 企业链上资产不暴露给竞争对手 |
| DeFi 隐私 | 在不使用混币器的情况下实现保密转账 |
| RWA 代币化 | 现实资产上链时保护金额敏感性 |
| 合规场景 | 链上数据加密，按需向监管方选择性披露 |

---

## 项目搭建

```bash
# 使用 FHEVM Hardhat 模板
git clone https://github.com/zama-ai/fhevm-hardhat-template conf-token
cd conf-token
npm ci

# 安装 OpenZeppelin 保密合约库
npm i @openzeppelin/confidential-contracts

npm run compile
```

---

## `ERC7984Example.sol`

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

/// @title 保密代币示例（ERC7984 标准）
/// @notice 余额和转账金额全程加密
contract ERC7984Example is ZamaEthereumConfig, ERC7984, Ownable2Step {
    constructor(
        address owner,
        uint64 amount,          // 初始铸造量（明文，仅部署时使用一次）
        string memory name_,
        string memory symbol_,
        string memory contractURI_
    ) ERC7984(name_, symbol_, contractURI_) Ownable(owner) {
        // 将明文金额转为加密值并铸造给 owner
        euint64 encryptedAmount = FHE.asEuint64(amount);
        _mint(owner, encryptedAmount);
    }
}
```

**继承关系说明：**

- `ERC7984`：OpenZeppelin 保密代币基类，提供 `confidentialTransfer`、`confidentialBalanceOf` 等接口
- `Ownable2Step`：两步转移所有权的访问控制，用于铸造和管理
- `ZamaEthereumConfig`：注入 FHEVM 的 Sepolia/主网配置

---

## `confToken.test.ts`（测试）

```typescript
import { expect } from 'chai';
import { ethers, fhevm } from 'hardhat';
import { FhevmType } from "@fhevm/hardhat-plugin";

describe('ERC7984Example', function () {
  let token: any;
  let owner: any, recipient: any, other: any;
  let tokenAddress: string;

  const INITIAL_AMOUNT = 1000;
  const TRANSFER_AMOUNT = 100;

  beforeEach(async function () {
    [owner, recipient, other] = await ethers.getSigners();
    token = await ethers.deployContract('ERC7984Example', [
      owner.address,
      INITIAL_AMOUNT,
      'Confidential Token',
      'CTKN',
      'https://example.com/token'
    ]);
    tokenAddress = await token.getAddress();
  });

  it('代币名称、符号、URI 应正确初始化', async function () {
    expect(await token.name()).to.equal('Confidential Token');
    expect(await token.symbol()).to.equal('CTKN');
    expect(await token.contractURI()).to.equal('https://example.com/token');
  });

  it('owner 应持有初始铸造量', async function () {
    const balanceHandle = await token.confidentialBalanceOf(owner.address);
    // 解密 owner 余额
    const balance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      balanceHandle,
      tokenAddress,
      owner
    );
    expect(balance).to.equal(BigInt(INITIAL_AMOUNT));
  });

  it('保密转账：owner 向 recipient 转 100', async function () {
    // 链下加密转账金额
    const encryptedInput = await fhevm
      .createEncryptedInput(tokenAddress, owner.address)
      .add64(TRANSFER_AMOUNT)
      .encrypt();

    // 执行保密转账
    await token
      .connect(owner)
      ['confidentialTransfer(address,bytes32,bytes)'](
        recipient.address,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

    // 验证 owner 余额减少
    const ownerHandle = await token.confidentialBalanceOf(owner.address);
    const ownerBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64, ownerHandle, tokenAddress, owner
    );
    expect(ownerBalance).to.equal(BigInt(INITIAL_AMOUNT - TRANSFER_AMOUNT));

    // 验证 recipient 余额增加
    const recipientHandle = await token.confidentialBalanceOf(recipient.address);
    const recipientBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64, recipientHandle, tokenAddress, recipient
    );
    expect(recipientBalance).to.equal(BigInt(TRANSFER_AMOUNT));
  });

  it('非授权方无法解密他人余额', async function () {
    const balanceHandle = await token.confidentialBalanceOf(owner.address);
    // other 没有被授权，userDecrypt 应抛出错误
    await expect(
      fhevm.userDecryptEuint(FhevmType.euint64, balanceHandle, tokenAddress, other)
    ).to.be.rejected;
  });
});
```

---

## ERC7984 核心接口

| 接口 | 说明 |
|------|------|
| `confidentialBalanceOf(address)` | 返回加密余额句柄（`euint64`） |
| `confidentialTransfer(to, handle, proof)` | 保密转账，接受链下加密金额 |
| `confidentialTransferFrom(from, to, handle, proof)` | 授权保密转账 |
| `setOperator(address, deadline)` | 授权操作者（用于合约间调用） |

---

## 与标准 ERC20 的对比

| 特性 | ERC20 | ERC7984 |
|------|-------|---------|
| 余额可见性 | 链上公开 | 加密，仅授权方可见 |
| 转账金额 | 公开 | 加密 |
| 合约可组合性 | 高 | 需通过 `allowTransient` 授权 |
| 链上索引 | 标准事件 | 加密事件（金额不可见） |
| 监管披露 | 全公开 | 按需 `FHE.allow()` 选择性披露 |
