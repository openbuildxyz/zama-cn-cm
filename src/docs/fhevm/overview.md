# 什么是 fhEVM？

**fhEVM** 是 Zama 开发的全同态加密以太坊虚拟机扩展框架，允许开发者在 EVM 兼容区块链上编写**保密智能合约（Confidential Smart Contracts）**。

> 官方文档：[docs.zama.org/protocol](https://docs.zama.org/protocol) | GitHub：[zama-ai/fhevm](https://github.com/zama-ai/fhevm)

## 核心价值

传统区块链上的所有数据都是公开透明的——任何人都可以读取合约状态和交易数据。fhEVM 通过 FHE 技术彻底改变了这一点：

- **链上数据加密**：合约状态以密文形式存储，链上无法读取明文
- **加密计算**：智能合约可以在不解密的情况下对加密数据进行运算
- **可编程隐私**：开发者精确控制谁可以解密哪些数据
- **EVM 兼容**：与现有 Solidity 工具链（Hardhat、Foundry 等）完全兼容

## 架构概览

fhEVM 的整体架构由三个核心组件构成：

### 1. fhEVM 库（Solidity 库）

为 Solidity 开发者提供加密数据类型和运算符，写法与普通 Solidity 一致：

```solidity
// 普通合约
uint32 balance = 100;
balance += amount;

// fhEVM 保密合约
euint32 balance = FHE.asEuint32(encryptedValue);
balance = FHE.add(balance, encryptedAmount);
```

### 2. fhEVM Executor（链上执行器）

部署在宿主链（Ethereum、Arbitrum、Polygon 等）上的智能合约，负责：

- 接收密文运算请求
- 通知 Zama 协处理器网络执行 FHE 计算
- 采用**符号执行模型**：链上只处理轻量级句柄，实际 FHE 计算异步进行

### 3. 访问控制列表（ACL）

部署在每条宿主链上的智能合约，管理密文的访问权限：

- 追踪"谁可以解密哪个密文"
- 验证合约是否有权对某个加密值进行计算
- 支持永久授权（`FHE.allow`）和临时授权（`FHE.allowTransient`）

## 加密数据类型

fhEVM 扩展了 Solidity 的类型系统：

| 类型 | 说明 | 对应明文类型 |
|------|------|-------------|
| `ebool` | 加密布尔值 | `bool` |
| `euint8` | 加密 8 位无符号整数 | `uint8` |
| `euint16` | 加密 16 位无符号整数 | `uint16` |
| `euint32` | 加密 32 位无符号整数 | `uint32` |
| `euint64` | 加密 64 位无符号整数 | `uint64` |
| `euint128` | 加密 128 位无符号整数 | `uint128` |
| `euint256` | 加密 256 位无符号整数 | `uint256` |
| `eaddress` | 加密地址 | `address` |

## 典型应用场景

- **保密代币（Confidential ERC-20）**：余额和转账金额对外不可见
- **私密投票**：投票内容加密，只有最终统计结果可见
- **链上隐私游戏**：游戏状态（手牌、位置等）对其他玩家不可见
- **保密 DeFi**：订单薄、仓位等敏感数据加密处理
- **隐私身份验证**：在不暴露个人信息的情况下证明资质

## 安全性

- FHE 底层基于 LWE 问题，**抗量子攻击**
- 解密由密钥管理系统（KMS）通过**多方计算（MPC）** 管理，即使部分参与方被攻破也能保证安全
- 访问控制由 ACL 合约链上强制执行，无法绕过
