# Relayer SDK 使用指南

**欢迎使用 Relayer SDK 文档。**

Relayer SDK 是 Zama 提供的 JavaScript SDK，让你无需直接与 Gateway Chain 交互，就能调用 FHEVM 智能合约。

通过 Relayer，前端只需要一个 FHEVM 主链上的钱包，所有与 Gateway Chain 的交互都由 Zama Relayer 代为处理。

---

## 第一步：初始化 SDK

安装依赖：

```sh
npm install @zama-fhe/relayer-sdk
```

### 创建 FhevmInstance

```ts
import { createInstance } from "@zama-fhe/relayer-sdk";

const instance = await createInstance({
  // ACL 合约地址（FHEVM 主链）
  aclContractAddress: "0x687820221192C5B662b25367F70076A37bc79b6c",
  // KMS 验证合约地址（FHEVM 主链）
  kmsContractAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
  // 输入验证合约地址（FHEVM 主链）
  inputVerifierContractAddress: "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
  // 解密验证地址（Gateway 链）
  verifyingContractAddressDecryption: "0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1",
  // 输入验证地址（Gateway 链）
  verifyingContractAddressInputVerification: "0x7048C39f048125eDa9d678AEbaDfB22F7900a29F",
  // FHEVM 主链 Chain ID
  chainId: 11155111,
  // Gateway 链 Chain ID
  gatewayChainId: 55815,
  // 主链 RPC（可选）
  network: "https://eth-sepolia.public.blastapi.io",
  // Relayer 地址
  relayerUrl: "https://relayer.testnet.zama.cloud",
});
```

### 使用 Sepolia 预设配置（更简便）

```ts
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";

const instance = await createInstance(SepoliaConfig);
```

> `SepoliaConfig` 已内置了 Sepolia 测试网的所有合约地址和配置，推荐在测试阶段使用。

---

## 第二步：加密输入并注册密文

在调用合约前，需要先将明文加密，并通过 Relayer 注册到 FHEVM。

```ts
// 创建加密输入缓冲区
const buffer = instance.createEncryptedInput(
  contractAddress,  // 允许使用该密文的合约地址
  userAddress,      // 允许将密文导入合约的用户地址
);

// 添加要加密的值（选择对应的数据类型方法）
buffer.add32(BigInt(42));      // uint32
// buffer.add8(BigInt(10));    // uint8
// buffer.add16(BigInt(100));  // uint16
// buffer.add64(BigInt(1000)); // uint64
// buffer.addBool(true);       // bool
// buffer.addAddress("0x...");  // address

// 加密、生成 ZKPoK 并上传密文，返回密文句柄列表
const ciphertexts = await buffer.encrypt();
```

### 调用合约

以调用 `FHECounter.increment()` 为例：

```ts
// ciphertexts.handles[0] 是加密后的 externalEuint32 值
// ciphertexts.inputProof 是对应的零知识证明
await fheCounterContract.increment(
  ciphertexts.handles[0],
  ciphertexts.inputProof
);
```

---

## 第三步：用户解密（User Decryption）

用户解密允许用户在不暴露数据到链上的前提下，安全地读取自己的私有加密数据（如余额、计数器等）。

> **前提**：合约中必须使用 `FHE.allow(ciphertext, userAddress)` 为该用户授予权限。

### 完整解密流程

```ts
// 1. 从合约读取加密值句柄（handle）
const ciphertextHandle = await fheCounterContract.getCount();

// 2. 生成临时密钥对
const keypair = instance.generateKeypair();

// 3. 构造 EIP-712 签名请求
const startTimeStamp = Math.floor(Date.now() / 1000).toString();
const durationDays = "10";
const contractAddresses = [contractAddress];

const eip712 = instance.createEIP712(
  keypair.publicKey,
  contractAddresses,
  startTimeStamp,
  durationDays
);

// 4. 用户签名（使用 ethers Signer）
const signature = await signer.signTypedData(
  eip712.domain,
  { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
  eip712.message,
);

// 5. 执行用户解密
const result = await instance.userDecrypt(
  [{ handle: ciphertextHandle, contractAddress }],
  keypair.privateKey,
  keypair.publicKey,
  signature.replace("0x", ""),
  contractAddresses,
  signer.address,
  startTimeStamp,
  durationDays,
);

// 6. 获取明文结果
const decryptedValue = result[ciphertextHandle];
console.log("解密结果：", decryptedValue);
```

---

## 核心 API 速查

| 方法 | 说明 |
|------|------|
| `createInstance(config)` | 初始化 FhevmInstance |
| `instance.createEncryptedInput(contract, user)` | 创建加密输入缓冲区 |
| `buffer.add32(value)` / `addBool()` 等 | 添加待加密的值 |
| `buffer.encrypt()` | 加密并上传，返回句柄和证明 |
| `instance.generateKeypair()` | 生成临时密钥对（用于解密） |
| `instance.createEIP712(...)` | 构造解密签名请求 |
| `instance.userDecrypt(...)` | 执行用户解密 |

---

## 帮助与支持

- [Community Forum](https://community.zama.ai/c/zama-protocol/15)
- [Discord](https://discord.com/invite/zama)
- [官方 SDK 文档](https://docs.zama.ai/protocol/relayer-sdk-guides)
