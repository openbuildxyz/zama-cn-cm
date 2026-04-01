# Solidity 开发指南

本文介绍如何使用 fhEVM Solidity 库编写保密智能合约。

> 官方文档：[docs.zama.org/protocol/solidity-guides](https://docs.zama.org/protocol/solidity-guides/getting-started/overview) | GitHub：[zama-ai/fhevm-solidity](https://github.com/zama-ai/fhevm-solidity)

## 安装

```bash
npm install fhevm
```

或使用 yarn：

```bash
yarn add fhevm
```

## 基础用法

在 Solidity 合约中引入 fhEVM 库：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

contract MyConfidentialContract {
    euint32 private encryptedValue;

    function store(einput encryptedInput, bytes calldata inputProof) external {
        // 将用户输入的密文转换为链上加密值
        encryptedValue = TFHE.asEuint32(encryptedInput, inputProof);
        // 授权合约自身可以操作这个密文
        TFHE.allowThis(encryptedValue);
    }
}
```

## 保密 ERC-20 示例

以下是一个余额完全加密的 ERC-20 代币合约：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

contract ConfidentialERC20 {
    mapping(address => euint64) private _balances;
    euint64 private _totalSupply;
    string public name;

    constructor(string memory _name) {
        name = _name;
    }

    // 铸造代币（仅限所有者）
    function mint(address to, uint64 amount) external {
        euint64 mintAmount = TFHE.asEuint64(amount);
        _balances[to] = TFHE.add(_balances[to], mintAmount);
        TFHE.allowThis(_balances[to]);
        TFHE.allow(_balances[to], to);
    }

    // 加密转账：金额对外不可见
    function transfer(
        address to,
        einput encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = TFHE.asEuint64(encryptedAmount, inputProof);

        // 检查余额是否充足（返回加密布尔值）
        ebool canTransfer = TFHE.le(amount, _balances[msg.sender]);

        // 根据加密条件更新余额（全程加密）
        _balances[msg.sender] = TFHE.select(
            canTransfer,
            TFHE.sub(_balances[msg.sender], amount),
            _balances[msg.sender]
        );
        _balances[to] = TFHE.select(
            canTransfer,
            TFHE.add(_balances[to], amount),
            _balances[to]
        );

        // 授权接收方查看自己的余额
        TFHE.allow(_balances[to], to);
        TFHE.allow(_balances[msg.sender], msg.sender);
        TFHE.allowThis(_balances[to]);
        TFHE.allowThis(_balances[msg.sender]);
    }

    // 查询余额（只有授权地址可解密）
    function balanceOf(address account) external view returns (euint64) {
        return _balances[account];
    }
}
```

## 访问控制

fhEVM 通过 ACL 合约管理密文访问权限：

```solidity
// 授权合约自身可持续操作此密文
TFHE.allowThis(encryptedValue);

// 授权特定地址可解密此密文
TFHE.allow(encryptedValue, userAddress);

// 临时授权（仅在当前交易中有效）
TFHE.allowTransient(encryptedValue, contractAddress);

// 设为公开可解密
TFHE.makePubliclyDecryptable(encryptedValue);
```

## 常用运算

### 算术运算

```solidity
euint32 a = TFHE.asEuint32(encA, proofA);
euint32 b = TFHE.asEuint32(encB, proofB);

euint32 sum  = TFHE.add(a, b);   // a + b
euint32 diff = TFHE.sub(a, b);   // a - b
euint32 prod = TFHE.mul(a, b);   // a * b
euint32 div  = TFHE.div(a, 10);  // a / 10（明文除数）
```

### 比较运算（返回 ebool）

```solidity
ebool isEqual = TFHE.eq(a, b);   // a == b
ebool isLess  = TFHE.lt(a, b);   // a < b
ebool isGreat = TFHE.gt(a, b);   // a > b
ebool isLeq   = TFHE.le(a, b);   // a <= b
ebool isGeq   = TFHE.ge(a, b);   // a >= b
```

### 条件选择（替代 if-else）

```solidity
// 根据加密条件选择加密值，等价于：result = condition ? a : b
euint32 result = TFHE.select(condition, a, b);
```

## 客户端 SDK

前端使用 `fhevmjs` 处理加密和解密：

```typescript
import { createInstance } from 'fhevmjs';

const instance = await createInstance({
  chainId: 1,   // 链 ID
  networkUrl: 'https://rpc.example.com',
  gatewayUrl: 'https://gateway.zama.ai',
});

// 加密一个值并生成证明
const { handles, inputProof } = instance.createEncryptedInput(
  contractAddress,
  userAddress
);
handles.add32(100n);  // 加密数值 100

const encryptedInput = handles.encrypt();

// 调用合约
await contract.transfer(recipient, encryptedInput, inputProof);
```

## 注意事项

1. **Gas 成本**：FHE 运算的 gas 消耗高于普通运算，设计合约时需要优化
2. **异步解密**：链上解密是异步的，需要通过回调或事件处理
3. **输入证明**：所有用户输入的密文都需要附带有效性证明（`inputProof`）
4. **密文句柄**：链上存储的是密文的句柄（32 字节），实际 FHE 计算由协处理器完成
