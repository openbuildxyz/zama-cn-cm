# 快速入门教程

本教程将带你快速上手 Zama 的**全同态加密（FHE）**技术，从零开始构建保密智能合约。

## 你将学到什么

大约 **30 分钟**内，你将从一个基础 Solidity 合约出发，逐步将其改造为使用 **FHEVM** 的完整保密合约。具体步骤如下：

1. 搭建开发环境
2. 编写一个简单的 Solidity 智能合约
3. 将其改造为 FHEVM 兼容的保密合约
4. 测试你的 FHEVM 保密合约

## 前置条件

- 具备 **Solidity** 和 **Ethereum** 的基本知识
- 了解 **Hardhat** 的基本用法

> **关于 Hardhat**
>
> [Hardhat](https://hardhat.org/) 是以太坊智能合约的编译、部署、测试和调试开发环境，在以太坊生态中广泛使用。本教程将使用 FHEVM Hardhat 模板来简化开发流程。

---

## 第一步：搭建 Hardhat 环境

### 安装 Node.js LTS 版本

确保已在本地安装 Node.js：

- 从 [官网](https://nodejs.org/en) 下载并安装推荐的 LTS（长期支持）版本
- 使用**偶数版本**（如 `v18.x`、`v20.x`）

> **注意**：Hardhat 不支持奇数版本的 Node.js（如 v21.x、v23.x），否则会出现警告或异常行为。

验证安装：

```sh
node -v
npm -v
```

### 从 FHEVM Hardhat 模板创建仓库

1. 打开 [FHEVM Hardhat 模板](https://github.com/zama-ai/fhevm-hardhat-template) 仓库
2. 点击绿色的 **Use this template** 按钮
3. 按提示创建你自己的新仓库

### 克隆仓库到本地

```sh
cd <你希望存放的目录>
git clone <你的新仓库地址>
cd <你的新仓库名>
```

### 安装依赖

```sh
npm install
```

### 配置 Hardhat 变量（可选，部署到 Sepolia 测试网时需要）

**MNEMONIC**（12 词助记词）：

```sh
npx hardhat vars set MNEMONIC
```

**INFURA_API_KEY**（连接 Sepolia 测试网）：

```sh
npx hardhat vars set INFURA_API_KEY
```

> 若跳过此步，Hardhat 会使用默认测试值，**不适用于真实部署**。

---

## 第二步：编写简单合约

### 创建 `Counter.sol`

进入 `contracts` 目录，创建 `Counter.sol`：

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

/// @title 一个简单的计数器合约
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

### 编译合约

```sh
npx hardhat compile
```

---

## 第三步：编写测试

### 创建 `test/Counter.ts`

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
  let counterContractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async () => {
    ({ counterContract, counterContractAddress } = await deployFixture());
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

### 运行测试

```sh
npx hardhat test
```

预期输出：

```
  Counter
    ✔ 部署后计数应为 0
    ✔ increment 计数器加 1
    ✔ decrement 计数器减 1

  3 passing (12ms)
```

---

## 下一步

你已经完成了基础 Solidity 合约的编写与测试。接下来，请阅读 [将合约改造为 FHEVM 保密合约](./fhevm-contract) 教程，学习如何用 FHE 加密变量，实现真正的链上隐私保护。
