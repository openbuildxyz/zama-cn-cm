# Solidity 开发指南

本文介绍如何使用 FHEVM Solidity 库编写保密智能合约。

> 官方文档：[docs.zama.ai/protocol/solidity-guides](https://docs.zama.ai/protocol/solidity-guides) | 快速入门教程：[Quick Start Tutorial](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)

## 安装

```bash
npm install fhevm
```

或使用 yarn：

```bash
yarn add fhevm
```

## 环境配置

在 Solidity 合约中引入 FHEVM 库：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/FHE.sol";

contract MyConfidentialContract {
    euint32 private encryptedValue;

    function store(externalEuint32 encryptedInput, bytes calldata inputProof) external {
        // 将用户输入的密文转换为链上加密值
        encryptedValue = FHE.fromExternal(encryptedInput, inputProof);
        // 授权合约自身可以操作这个密文
        FHE.allowThis(encryptedValue);
    }
}
```

## 保密 ERC-20 示例

以下是一个余额完全加密的 ERC-20 代币合约：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/FHE.sol";

contract ConfidentialERC20 {
    mapping(address => euint64) private _balances;
    euint64 private _totalSupply;
    string public name;

    constructor(string memory _name) {
        name = _name;
    }

    // 铸造代币
    function mint(address to, uint64 amount) external {
        euint64 mintAmount = FHE.asEuint64(amount);
        _balances[to] = FHE.add(_balances[to], mintAmount);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
    }

    // 加密转账：金额对外不可见
    function transfer(
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        // 检查余额是否充足（返回加密布尔值）
        ebool canTransfer = FHE.le(amount, _balances[msg.sender]);

        // 根据加密条件更新余额（全程加密，不暴露任何信息）
        _balances[msg.sender] = FHE.select(
            canTransfer,
            FHE.sub(_balances[msg.sender], amount),
            _balances[msg.sender]
        );
        _balances[to] = FHE.select(
            canTransfer,
            FHE.add(_balances[to], amount),
            _balances[to]
        );

        // 授权双方查看各自余额
        FHE.allow(_balances[to], to);
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_balances[to]);
        FHE.allowThis(_balances[msg.sender]);
    }

    // 查询余额（只有授权地址可解密）
    function balanceOf(address account) external view returns (euint64) {
        return _balances[account];
    }
}
```

## 类型转换

```solidity
// 明文 → 加密类型
euint32 enc = FHE.asEuint32(100);
ebool encBool = FHE.asEbool(true);
eaddress encAddr = FHE.asEaddress(msg.sender);

// 加密整数 → 加密布尔
ebool b = FHE.asEbool(encUint);

// 不同位宽之间的转换（需显式转换）
euint64 big = FHE.asEuint64(smallEuint32);
```

## 访问控制

FHEVM 通过 ACL 合约管理密文访问权限：

```solidity
// 永久授权合约自身持续操作此密文
FHE.allowThis(encryptedValue);

// 永久授权特定地址可解密此密文
FHE.allow(encryptedValue, userAddress);

// 临时授权（仅在当前交易中有效，适合跨合约调用）
FHE.allowTransient(encryptedValue, contractAddress);

// 设为公开可解密（任何人都可查看）
FHE.makePubliclyDecryptable(encryptedValue);

// 验证发送者是否有权访问此密文
require(FHE.isSenderAllowed(encryptedValue));
```

## 常用运算

### 算术运算

```solidity
euint32 a = FHE.fromExternal(encA, proofA);
euint32 b = FHE.fromExternal(encB, proofB);

euint32 sum  = FHE.add(a, b);    // a + b
euint32 diff = FHE.sub(a, b);    // a - b
euint32 prod = FHE.mul(a, b);    // a * b
euint32 div  = FHE.div(a, 10);   // a / 10（除数必须为明文）
euint32 mn   = FHE.min(a, b);    // min(a, b)
euint32 mx   = FHE.max(a, b);    // max(a, b)
```

### 比较运算（返回 `ebool`）

```solidity
ebool isEqual = FHE.eq(a, b);    // a == b
ebool isNe    = FHE.ne(a, b);    // a != b
ebool isLess  = FHE.lt(a, b);    // a < b
ebool isGreat = FHE.gt(a, b);    // a > b
ebool isLeq   = FHE.le(a, b);    // a <= b
ebool isGeq   = FHE.ge(a, b);    // a >= b
```

### 条件选择（替代 if-else）

```solidity
// 根据加密条件选择加密值，等价于：result = condition ? a : b
// 注意：两个分支都会"执行"，但只有符合条件的结果有效
euint32 result = FHE.select(condition, a, b);
```

### 链上随机数

```solidity
// 生成加密随机数（对链上其他合约不可见）
euint32 rand = FHE.randEuint32();
euint64 rand64 = FHE.randEuint64();
```

## 注意事项

1. **Gas 成本**：FHE 运算的 gas 消耗远高于普通运算，设计合约时需要优化调用次数
2. **符号执行**：链上只处理轻量级密文句柄，实际 FHE 计算由协处理器异步完成
3. **输入证明**：所有用户输入的密文都需要附带有效性证明（`inputProof`）
4. **除法限制**：`FHE.div` 和 `FHE.rem` 的除数必须是明文（plaintext），不支持密文除以密文
5. **ACL 管理**：务必在操作密文后调用 `FHE.allowThis` 或 `FHE.allow`，否则后续无法使用该密文

## 开发环境

推荐使用 FHEVM Hardhat 模板快速启动：

```bash
git clone https://github.com/zama-ai/fhevm-hardhat-template
cd fhevm-hardhat-template
npm install
```

## 参考资料

- [官方文档](https://docs.zama.ai/protocol/solidity-guides)
- [快速入门教程（30分钟）](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)
- [Hardhat 环境配置](https://docs.zama.ai/protocol/solidity-guides)
- [迁移指南（升级到 v0.7）](https://docs.zama.ai/protocol/solidity-guides)
