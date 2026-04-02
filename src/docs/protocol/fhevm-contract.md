# 将合约改造为 FHEVM 保密合约

本教程将带你把普通的 `Counter.sol` 合约逐步改造为支持全同态加密的 `FHECounter.sol`，实现链上加密计算。

## 前置条件

- 已完成 [快速入门教程](./quick-start) 中的环境搭建和 `Counter.sol` 编写

## 你将学到什么

- 用加密类型替换标准 Solidity 类型
- 集成零知识证明（ZKPoK）验证
- 启用链上加密计算
- 授予 FHE 权限，支持链下安全解密

---

## 第一步：初始化 FHECounter 合约

### 创建 `FHECounter.sol`

在 `contracts` 目录下创建 `FHECounter.sol`，内容与 `Counter.sol` 相同（作为改造起点）。

### 引入 FHEVM 库

将文件头部替换为：

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
```

导入说明：

- **FHE** — 核心库，提供 FHEVM 加密类型的所有操作
- **euint32** — 链上加密的 32 位无符号整数类型
- **externalEuint32** — 链下加密、传入合约的 32 位整数类型
- **ZamaEthereumConfig** — 提供以太坊主网和 Sepolia 测试网的 FHEVM 配置

### 修改合约声明

```solidity
/// @title 一个简单的 FHE 计数器合约
contract FHECounter is ZamaEthereumConfig {
```

> **注意**：合约必须继承 `ZamaEthereumConfig`，否则无法在 Sepolia 或 Hardhat 上执行任何 FHEVM 相关功能。

编译验证：

```sh
npx hardhat compile
```

---

## 第二步：替换类型与函数

### 用 `euint32` 替换 `uint32`

```solidity
// 替换状态变量
euint32 private _count;

// 替换返回类型
function getCount() external view returns (euint32) {
    return _count;
}
```

### 改造 `increment()` 函数

原来接受明文 `uint32`，现在改为接受链下加密的 `externalEuint32`，并附带零知识证明 `inputProof`：

```solidity
/// @notice 将计数器增加指定（加密）值
function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    // 第一步：验证 ZKPoK 并转换为可操作的 euint32
    euint32 evalue = FHE.fromExternal(inputEuint32, inputProof);
    // 第二步：执行 FHE 加法
    _count = FHE.add(_count, evalue);
    // 第三步：授予 FHE 权限
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
}
```

**关键点说明：**

| 步骤 | 方法 | 作用 |
|------|------|------|
| 验证并转换 | `FHE.fromExternal()` | 验证零知识证明，返回可用的 `euint32` |
| 加密加法 | `FHE.add()` | 在不解密的情况下对密文执行加法 |
| 合约权限 | `FHE.allowThis()` | 允许合约本身访问加密值 |
| 调用者权限 | `FHE.allow()` | 允许调用者在链下解密结果 |

> **为什么要授予两个权限？**
> - `FHE.allowThis(_count)`：允许合约在后续操作中继续使用该加密值
> - `FHE.allow(_count, msg.sender)`：允许前端（调用者）在链下请求解密，查看明文结果

### 改造 `decrement()` 函数

```solidity
/// @notice 将计数器减少指定（加密）值
/// @dev 示例代码省略了溢出/下溢检查，生产合约中应加入范围验证
function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);
    _count = FHE.sub(_count, encryptedValue);
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
}
```

---

## 完整合约代码

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title 一个简单的 FHE 计数器合约
contract FHECounter is ZamaEthereumConfig {
    euint32 private _count;

    /// @notice 返回当前加密计数值
    function getCount() external view returns (euint32) {
        return _count;
    }

    /// @notice 将计数器增加指定（加密）值
    function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 evalue = FHE.fromExternal(inputEuint32, inputProof);
        _count = FHE.add(_count, evalue);
        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);
    }

    /// @notice 将计数器减少指定（加密）值
    function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);
        _count = FHE.sub(_count, encryptedValue);
        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);
    }
}
```

编译合约：

```sh
npx hardhat compile
```

---

## FHEVM 常用操作符

| 操作 | FHEVM 方法 | 说明 |
|------|-----------|------|
| 加法 | `FHE.add(a, b)` | 加密加法 |
| 减法 | `FHE.sub(a, b)` | 加密减法 |
| 乘法 | `FHE.mul(a, b)` | 加密乘法 |
| 比较 | `FHE.lt(a, b)` / `FHE.gt(a, b)` | 加密比较，返回 `ebool` |
| 相等 | `FHE.eq(a, b)` | 加密相等判断 |
| 条件 | `FHE.select(cond, a, b)` | 加密三元运算 |

---

## 下一步

合约改造完成后，你需要在前端使用 Relayer SDK 与其交互。请阅读 [Relayer SDK 使用指南](./relayer-sdk)，了解如何从前端加密输入、发送交易，并解密链上返回的加密结果。
