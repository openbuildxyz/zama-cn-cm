# 什么是 Zama 保密区块链协议？

**Zama Confidential Blockchain Protocol** 是 Zama 开发的全套工具和库，用于在任意链上构建**保密智能合约**和**保密 DApp**，核心基于全同态加密（FHE）技术。

> 官方文档：[docs.zama.ai/protocol](https://docs.zama.ai/protocol) | 白皮书：[Zama Protocol Litepaper](https://docs.zama.ai/protocol/zama-protocol-litepaper)

## 核心价值

传统区块链上的所有数据都是公开透明的——任何人都可以读取合约状态和交易数据。通过 FHE 技术，这一切彻底改变：

- **链上数据加密**：合约状态以密文形式存储，链上无法读取明文
- **加密计算**：智能合约可以在不解密的情况下对加密数据进行运算（符号执行模型）
- **可编程隐私**：开发者通过 ACL 精确控制谁可以解密哪些数据
- **EVM 兼容**：与现有 Solidity 工具链（Hardhat、Foundry 等）完全兼容

## 核心组件

### 1. FHEVM Solidity 库

为 Solidity 开发者提供加密数据类型和运算，语法与普通 Solidity 一致：

```solidity
// 普通合约
uint32 balance = 100;
balance += amount;

// 保密合约
euint32 balance = FHE.asEuint32(encryptedValue);
balance = FHE.add(balance, encryptedAmount);
```

### 2. Relayer（中继器）

处理前端与链上保密合约之间的交互：

- 管理加密输入的验证和转发
- 提供客户端 SDK（Relayer SDK）用于前端集成

### 3. 访问控制列表（ACL）

部署在链上的智能合约，管理密文的访问权限：

- 追踪"谁可以解密哪个密文"
- 支持永久授权（`FHE.allow`）和临时授权（`FHE.allowTransient`）
- 公开解密：`FHE.makePubliclyDecryptable`

## 加密数据类型

FHEVM 扩展了 Solidity 的类型系统：

### 链上加密类型

| 类型 | 说明 |
|------|------|
| `ebool` | 加密布尔值 |
| `euint8` ~ `euint256` | 加密无符号整数（8~256 位） |
| `eaddress` | 加密地址 |

### 用户输入类型（外部加密输入）

| 类型 | 说明 |
|------|------|
| `externalEbool` | 用户提供的加密布尔输入 |
| `externalEuint8` ~ `externalEuint256` | 用户提供的加密整数输入 |
| `externalEaddress` | 用户提供的加密地址输入 |

## 支持的运算

### 算术运算
```solidity
FHE.add(a, b)   // 加法
FHE.sub(a, b)   // 减法
FHE.mul(a, b)   // 乘法
FHE.div(a, b)   // 除法（b 必须为明文）
FHE.rem(a, b)   // 取余（b 必须为明文）
FHE.min(a, b)   // 最小值
FHE.max(a, b)   // 最大值
FHE.neg(a)      // 取反
```

### 位运算
```solidity
FHE.and(a, b)   // 按位与
FHE.or(a, b)    // 按位或
FHE.xor(a, b)   // 按位异或
FHE.not(a)      // 按位非
FHE.shl(a, b)   // 左移
FHE.shr(a, b)   // 右移
FHE.rotl(a, b)  // 循环左移
FHE.rotr(a, b)  // 循环右移
```

### 比较运算（返回 `ebool`）
```solidity
FHE.eq(a, b)    // 等于
FHE.ne(a, b)    // 不等于
FHE.lt(a, b)    // 小于
FHE.le(a, b)    // 小于等于
FHE.gt(a, b)    // 大于
FHE.ge(a, b)    // 大于等于
```

### 高级运算
```solidity
// 条件选择（替代 if-else）
FHE.select(condition, a, b)   // condition ? a : b

// 链上随机数（加密）
FHE.randEuint32()
```

## 访问控制

```solidity
// 永久授权合约自身持续操作此密文
FHE.allowThis(encryptedValue);

// 永久授权特定地址可解密此密文
FHE.allow(encryptedValue, userAddress);

// 临时授权（仅在当前交易中有效）
FHE.allowTransient(encryptedValue, contractAddress);

// 设为公开可解密
FHE.makePubliclyDecryptable(encryptedValue);

// 验证发送者是否有权限
FHE.isSenderAllowed(encryptedValue);
```

## 典型应用场景

- **保密代币（Confidential ERC-20）**：余额和转账金额对外不可见
- **私密投票**：投票内容加密，只有最终统计结果可见
- **链上隐私游戏**：游戏状态（手牌、位置等）对其他玩家不可见
- **保密 DeFi**：订单薄、仓位等敏感数据加密处理
- **隐私身份验证**：在不暴露个人信息的情况下证明资质

## 参考资料

- [官方文档](https://docs.zama.ai/protocol)
- [Solidity 开发指南](https://docs.zama.ai/protocol/solidity-guides)
- [Relayer SDK 指南](https://docs.zama.ai/protocol/relayer-sdk-guides)
- [示例代码](https://docs.zama.ai/protocol/examples)
- [社区论坛](https://community.zama.ai/c/fhevm/15)
