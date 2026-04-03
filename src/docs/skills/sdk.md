# Zama Relayer SDK & Hardhat Testing

Use this skill when building frontend TypeScript apps that interact with fhEVM contracts, or when writing Hardhat tests for confidential contracts.

---

## Relayer SDK — Installation & Setup

```bash
npm install @zama-fhe/relayer-sdk
```

```typescript
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";

const instance = await createInstance(SepoliaConfig);
```

Available configs: `SepoliaConfig`, `MainnetConfig`.

---

## Encrypt User Input

```typescript
const encrypted = await instance
  .createEncryptedInput(contractAddress, userAddress)
  .add64(transferAmount)   // match Solidity type: add8 / add16 / add32 / add64 / add128 / add256
  .encrypt();

// Pass to contract:
await contract.myFunction(encrypted.handles[0], encrypted.inputProof);
```

**Multiple values in one input:**
```typescript
const enc = await instance
  .createEncryptedInput(contractAddress, userAddress)
  .add64(amount)
  .addBool(isActive)
  .encrypt();

// enc.handles[0] → amount handle
// enc.handles[1] → isActive handle
await contract.myFunction(enc.handles[0], enc.handles[1], enc.inputProof);
```

**Type mapping (Solidity → SDK method):**
| Solidity type | SDK method |
|---|---|
| `externalEuint8` | `.add8(value)` |
| `externalEuint16` | `.add16(value)` |
| `externalEuint32` | `.add32(value)` |
| `externalEuint64` | `.add64(value)` |
| `externalEuint128` | `.add128(value)` |
| `externalEuint256` | `.add256(value)` |
| `externalEbool` | `.addBool(value)` |
| `externalEaddress` | `.addAddress(value)` |

---

## User Decrypt

The user signs a decryption request — only they can see the result.

```typescript
// Get handle from contract
const handle = await contract.getBalance(userAddress);

// Decrypt — requires user's ethers.js signer
const clearValue = await instance.userDecrypt(
  handle,
  contractAddress,
  signer         // ethers.js Signer
);
console.log("Balance:", clearValue); // bigint
```

---

## Public Decrypt (after makePubliclyDecryptable)

Used for auction resolution, voting reveals, etc.

```typescript
const results = await instance.publicDecrypt([encryptedHandle]);
// results.abiEncodedClearValues — pass to resolveAuction() etc.
// results.decryptionProof       — verification proof

await contract.resolveAuction(results.abiEncodedClearValues, results.decryptionProof);
```

---

## Hardhat Testing

```typescript
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

it("test encrypted counter", async function () {
  const [alice] = await ethers.getSigners();
  const contract = await ethers.deployContract("FHECounter");
  const address = await contract.getAddress();

  // Encrypt input
  const enc = await fhevm
    .createEncryptedInput(address, alice.address)
    .add32(5)
    .encrypt();

  await contract.connect(alice).increment(enc.handles[0], enc.inputProof);

  // Decrypt and verify
  const handle = await contract.getCount();
  const value = await fhevm.userDecryptEuint(FhevmType.euint32, handle, address, alice);
  expect(value).to.equal(5n);
});
```

**`userDecryptEuint` type mapping:**
| Solidity type | FhevmType |
|---|---|
| `euint8` | `FhevmType.euint8` |
| `euint16` | `FhevmType.euint16` |
| `euint32` | `FhevmType.euint32` |
| `euint64` | `FhevmType.euint64` |
| `euint128` | `FhevmType.euint128` |
| `euint256` | `FhevmType.euint256` |

**Public decrypt in tests:**
```typescript
const results = await fhevm.publicDecrypt([encryptedHandle]);
await contract.resolveAuction(results.abiEncodedClearValues, results.decryptionProof);
```

**Hardhat config (`hardhat.config.ts`):**
```typescript
import "@fhevm/hardhat-plugin";

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
};
```
