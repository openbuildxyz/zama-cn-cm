# FHE 计数器

本示例通过对比普通计数器与 FHE 加密计数器，展示 FHEVM 的核心用法。

> 完整代码来源：[github.com/zama-ai/fhevm](https://github.com/zama-ai/fhevm/tree/main/docs/examples)

---

## 普通计数器

### `Counter.sol`

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

/// @title 普通计数器合约
contract Counter {
  uint32 private _count;

  /// @notice 返回当前计数值
  function getCount() external view returns (uint32) {
    return _count;
  }

  /// @notice 将计数器增加指定值
  function increment(uint32 value) external {
    _count += value;
  }

  /// @notice 将计数器减少指定值
  function decrement(uint32 value) external {
    require(_count >= value, "Counter: cannot decrement below zero");
    _count -= value;
  }
}
```

### `Counter.ts`（测试）

```ts
import { Counter, Counter__factory } from "../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("Counter")) as Counter__factory;
  const counterContract = (await factory.deploy()) as Counter;
  const counterContractAddress = await counterContract.getAddress();
  return { counterContract, counterContractAddress };
}

describe("Counter", function () {
  let signers: Signers;
  let counterContract: Counter;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async () => {
    ({ counterContract } = await deployFixture());
  });

  it("部署后计数应为 0", async function () {
    const count = await counterContract.getCount();
    expect(count).to.eq(0);
  });

  it("increment 计数器加 1", async function () {
    const before = await counterContract.getCount();
    const tx = await counterContract.connect(signers.alice).increment(1);
    await tx.wait();
    const after = await counterContract.getCount();
    expect(after).to.eq(before + 1n);
  });

  it("decrement 计数器减 1", async function () {
    let tx = await counterContract.connect(signers.alice).increment(1);
    await tx.wait();
    tx = await counterContract.connect(signers.alice).decrement(1);
    await tx.wait();
    const count = await counterContract.getCount();
    expect(count).to.eq(0);
  });
});
```

---

## FHE 加密计数器

与普通计数器的核心差异：

| 对比项 | 普通计数器 | FHE 计数器 |
|--------|-----------|-----------|
| 状态类型 | `uint32` | `euint32` |
| 输入类型 | `uint32` | `externalEuint32 + inputProof` |
| 计算方式 | 明文 `+=` | `FHE.add()` |
| 链上可见性 | 所有人可读 | 仅授权方可解密 |

### `FHECounter.sol`

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE 加密计数器合约
contract FHECounter is ZamaEthereumConfig {
  euint32 private _count;

  /// @notice 返回当前加密计数值（需授权方才能解密）
  function getCount() external view returns (euint32) {
    return _count;
  }

  /// @notice 将计数器增加指定加密值
  /// @dev 生产环境中应加入溢出检查
  function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);
    _count = FHE.add(_count, encryptedValue);
    FHE.allowThis(_count);       // 允许合约本身访问
    FHE.allow(_count, msg.sender); // 允许调用者解密
  }

  /// @notice 将计数器减少指定加密值
  /// @dev 生产环境中应加入下溢检查
  function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);
    _count = FHE.sub(_count, encryptedValue);
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
  }
}
```

### `FHECounter.ts`（测试）

```ts
import { FHECounter, FHECounter__factory } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("FHECounter")) as FHECounter__factory;
  const fheCounterContract = (await factory.deploy()) as FHECounter;
  const fheCounterContractAddress = await fheCounterContract.getAddress();
  return { fheCounterContract, fheCounterContractAddress };
}

describe("FHECounter", function () {
  let signers: Signers;
  let fheCounterContract: FHECounter;
  let fheCounterContractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async () => {
    ({ fheCounterContract, fheCounterContractAddress } = await deployFixture());
  });

  it("部署后加密计数应未初始化（bytes32(0)）", async function () {
    const encryptedCount = await fheCounterContract.getCount();
    expect(encryptedCount).to.eq(ethers.ZeroHash);
  });

  it("increment 加密计数器加 1，并通过用户解密验证", async function () {
    // 链下加密数值 1
    const encryptedOne = await fhevm
      .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    const tx = await fheCounterContract
      .connect(signers.alice)
      .increment(encryptedOne.handles[0], encryptedOne.inputProof);
    await tx.wait();

    // 用户解密验证结果
    const encryptedCount = await fheCounterContract.getCount();
    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      fheCounterContractAddress,
      signers.alice,
    );
    expect(clearCount).to.eq(1);
  });

  it("increment 后 decrement，计数回到 0", async function () {
    const encryptedOne = await fhevm
      .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    let tx = await fheCounterContract
      .connect(signers.alice)
      .increment(encryptedOne.handles[0], encryptedOne.inputProof);
    await tx.wait();

    tx = await fheCounterContract
      .connect(signers.alice)
      .decrement(encryptedOne.handles[0], encryptedOne.inputProof);
    await tx.wait();

    const encryptedCount = await fheCounterContract.getCount();
    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      fheCounterContractAddress,
      signers.alice,
    );
    expect(clearCount).to.eq(0);
  });
});
```

---

## 关键概念小结

- **`FHE.fromExternal(handle, proof)`**：验证零知识证明，将链下加密值转换为链上可操作的 `euint` 类型
- **`FHE.allowThis(value)`**：授予合约自身对该密文的访问权限，确保后续函数调用可以使用它
- **`FHE.allow(value, addr)`**：授予指定地址（如 `msg.sender`）解密权限，前端才能通过 Relayer SDK 查看明文
- **`fhevm.userDecryptEuint()`**：Hardhat 测试中的用户解密 API，生产环境对应 Relayer SDK 的 `instance.userDecrypt()`
