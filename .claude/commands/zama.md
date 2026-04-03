# Zama FHE — Agent Knowledge Base

You are now equipped with deep knowledge of Zama's Fully Homomorphic Encryption (FHE) technology stack. Use this document as your primary reference when answering questions, writing code, or reviewing contracts related to Zama's products.

---

## 1. What is Zama?

Zama is a cryptography company founded in January 2020 by **Rand Hindi** (CEO) and **Dr. Pascal Paillier** (CTO, inventor of the Paillier cryptosystem). Their mission: make Fully Homomorphic Encryption practical for real-world applications.

**FHE in one sentence:** Compute on encrypted data without ever decrypting it.

```
Enc(a) + Enc(b) = Enc(a + b)   // addition homomorphism
Enc(a) × Enc(b) = Enc(a × b)   // multiplication homomorphism
```

Zama uses the **TFHE (Torus FHE)** scheme — optimized for low-latency gate-level operations with fast bootstrapping (noise refresh).

**Key milestones:**
- 2023-09: fhEVM Alpha released (first FHE-based private smart contract protocol)
- 2024-03: Series A $73M (Multicoin Capital, Protocol Labs, Gavin Wood, Anatoly Yakovenko)
- 2025-06: Series B $57M → first FHE unicorn ($1B+ valuation)
- 2025-07: Public testnet live
- 2025-09: ERC-7984 standard co-authored with OpenZeppelin
- 2025-11: Acquired KKRT Labs (Kakarot ZK)
- 2025-12: Mainnet live on Ethereum
- 2026-02: $ZAMA listed on Binance

---

## 2. Product Lineup

| Product | Language | Purpose |
|---------|----------|---------|
| **TFHE-rs** | Rust | Core FHE library — low-level encrypted integer operations |
| **fhEVM** | Solidity | Confidential smart contracts on Ethereum EVM |
| **Concrete** | Python | Compile Python programs → FHE circuits |
| **Concrete ML** | Python | Privacy-preserving machine learning |
| **TKMS** | — | Threshold Key Management System — MPC-based decryption authority |

---

## 3. fhEVM — Confidential Smart Contracts

### 3.1 Architecture

```
User (browser/app)
  │  encrypt input with ZKPoK
  ▼
Ethereum Smart Contract (Solidity + fhEVM lib)
  │  FHE operations on ciphertext (add, sub, lt, select…)
  ▼
Coprocessor Network
  │  executes FHE computation off-chain, posts result back
  ▼
Gateway / KMS (MPC)
  │  manages decryption keys via threshold MPC
  ▼
Authorized Party  ←  userDecrypt (via Relayer SDK)
```

The blockchain never sees plaintext. Even validators and coprocessor operators cannot read values.

### 3.2 Encrypted Types

```solidity
// Integer types
euint8 / euint16 / euint32 / euint64 / euint128 / euint256

// Address & boolean
eaddress
ebool

// External input handles (from user, with ZKPoK proof)
externalEuint8 / externalEuint16 / externalEuint32
externalEuint64 / externalEuint128 / externalEuint256
externalEbool / externalEaddress
```

### 3.3 Core FHE Operations

```solidity
import { FHE, euint64, externalEuint64, ebool, eaddress } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

// --- Input validation ---
euint64 value = FHE.fromExternal(externalHandle, inputProof);  // verify ZKPoK, get ciphertext

// --- Arithmetic ---
euint64 sum  = FHE.add(a, b);
euint64 diff = FHE.sub(a, b);
euint64 prod = FHE.mul(a, b);

// --- Comparison (returns ebool) ---
ebool gt = FHE.gt(a, b);
ebool lt = FHE.lt(a, b);
ebool eq = FHE.eq(a, b);

// --- Conditional select (no branch leakage) ---
euint64 result = FHE.select(condition, ifTrue, ifFalse);

// --- Type casting ---
euint64 big   = FHE.asEuint64(plainValue);    // plaintext → ciphertext
eaddress addr = FHE.asEaddress(msg.sender);
euint64 zero  = FHE.asEuint64(0);

// --- Bitwise ---
euint64 r = FHE.and(a, b);
euint64 r = FHE.or(a, b);
euint64 r = FHE.xor(a, b);
euint64 r = FHE.shl(a, bits);
euint64 r = FHE.shr(a, bits);

// --- Utility ---
bool initialized = FHE.isInitialized(value);  // check if euint has been set
bytes32 handle   = FHE.toBytes32(value);      // get raw handle for events/storage
```

### 3.4 Access Control — CRITICAL

Every ciphertext handle must be explicitly authorized before another address can use it. **Forgetting this is the most common bug.**

```solidity
FHE.allowThis(value);          // allow this contract to use the ciphertext in future txs
FHE.allow(value, address);     // allow a specific address to decrypt / use
FHE.allowTransient(value, address); // temporary (single-tx) allow — used before confidentialTransfer

// Public decryption (for auctions, voting reveals)
FHE.makePubliclyDecryptable(value);  // marks ciphertext for public decryption
FHE.checkSignatures(handles, clearResult, proof);  // verify decryption proof on-chain
```

### 3.5 Contract Setup Pattern

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract MyContract is ZamaEthereumConfig {
    euint64 private _secretValue;

    function store(externalEuint64 inputHandle, bytes calldata inputProof) external {
        _secretValue = FHE.fromExternal(inputHandle, inputProof);
        FHE.allowThis(_secretValue);
        FHE.allow(_secretValue, msg.sender);
    }

    function getValue() external view returns (euint64) {
        return _secretValue;
    }
}
```

**Always inherit `ZamaEthereumConfig`** — it injects the correct KMS/coprocessor addresses for Sepolia/mainnet.

---

## 4. Common Patterns

### 4.1 FHE Counter (simplest example)

```solidity
contract FHECounter is ZamaEthereumConfig {
    euint32 private _count;

    function increment(externalEuint32 input, bytes calldata proof) external {
        euint32 val = FHE.fromExternal(input, proof);
        _count = FHE.add(_count, val);
        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);
    }

    function getCount() external view returns (euint32) { return _count; }
}
```

**Plain vs FHE comparison:**
| | Plain Counter | FHE Counter |
|---|---|---|
| State type | `uint32` | `euint32` |
| Input | `uint32` | `externalEuint32 + inputProof` |
| Arithmetic | `+=` | `FHE.add()` |
| Visibility | Public | Authorized parties only |

### 4.2 Sealed-Bid Auction

Key pattern: compare bids without revealing them, then public-decrypt winner after auction ends.

```solidity
// During auction — update highest bid with FHE comparison
euint64 currentBid = bids[msg.sender];
ebool isNewWinner = FHE.lt(highestBid, currentBid);
highestBid    = FHE.select(isNewWinner, currentBid, highestBid);
winningAddr   = FHE.select(isNewWinner, FHE.asEaddress(msg.sender), winningAddr);
FHE.allowThis(highestBid);
FHE.allowThis(winningAddr);

// After auction — request public decryption
FHE.makePubliclyDecryptable(winningAddr);
emit AuctionDecryptionRequested(winningAddr);

// Resolve with decryption proof
function resolveAuction(bytes memory clearResult, bytes memory proof) public {
    bytes32[] memory cts = new bytes32[](1);
    cts[0] = FHE.toBytes32(winningAddr);
    FHE.checkSignatures(cts, clearResult, proof);
    winner = abi.decode(clearResult, (address));
}
```

### 4.3 ERC-7984 Confidential Token

OpenZeppelin's confidential token standard. Balances and transfer amounts are encrypted.

```solidity
import { ERC7984 } from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

contract MyToken is ZamaEthereumConfig, ERC7984, Ownable2Step {
    constructor(address owner, uint64 amount, string memory name_, string memory symbol_, string memory contractURI_)
        ERC7984(name_, symbol_, contractURI_) Ownable(owner)
    {
        _mint(owner, FHE.asEuint64(amount));
    }
}
```

**ERC-7984 key interface:**
| Method | Description |
|--------|-------------|
| `confidentialBalanceOf(addr)` | Returns encrypted balance handle (`euint64`) |
| `confidentialTransfer(to, handle, proof)` | Transfer with encrypted amount |
| `confidentialTransferFrom(from, to, handle, proof)` | Delegated confidential transfer |
| `setOperator(addr, deadline)` | Authorize operator for contract-to-contract calls |

**Using ERC-7984 inside another contract (e.g., auction):**
```solidity
// Temporary authorize before transferFrom
FHE.allowTransient(amount, address(confidentialToken));
confidentialToken.confidentialTransferFrom(msg.sender, address(this), amount);
```

---

## 5. Relayer SDK (Frontend / TypeScript)

### 5.1 Installation & Setup

```bash
npm install @zama-fhe/relayer-sdk
```

```typescript
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";

const instance = await createInstance(SepoliaConfig);
```

### 5.2 Encrypt User Input

```typescript
const encrypted = await instance
  .createEncryptedInput(contractAddress, userAddress)
  .add64(transferAmount)      // add value to encrypt (match Solidity type: add8/16/32/64/128/256)
  .encrypt();

// Pass to contract:
await contract.myFunction(encrypted.handles[0], encrypted.inputProof);

// Multiple values:
const enc = await instance
  .createEncryptedInput(contractAddress, userAddress)
  .add64(amount)
  .addBool(isActive)
  .encrypt();
// enc.handles[0] → amount handle
// enc.handles[1] → isActive handle
```

### 5.3 Decrypt (User Decrypt)

```typescript
import { FhevmType } from "@fhevm/hardhat-plugin";

// Get handle from contract
const handle = await contract.getBalance(userAddress);

// Decrypt — user signs the request, only they can see the result
const clearValue = await instance.userDecrypt(
  handle,
  contractAddress,
  signer         // ethers.js signer
);
console.log("Balance:", clearValue); // bigint
```

### 5.4 Public Decrypt (after makePubliclyDecryptable)

```typescript
const results = await instance.publicDecrypt([encryptedHandle]);
// results.abiEncodedClearValues — pass to resolveAuction() etc.
// results.decryptionProof       — verification proof
```

---

## 6. Hardhat Testing

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

// Public decrypt (for auctions etc.)
const results = await fhevm.publicDecrypt([encryptedHandle]);
await contract.resolveAuction(results.abiEncodedClearValues, results.decryptionProof);
```

---

## 7. TFHE-rs (Rust)

```toml
# Cargo.toml
[dependencies]
tfhe = { version = "0.10", features = ["integer", "x86_64-unix"] }
```

```rust
use tfhe::{ConfigBuilder, generate_keys, set_server_key, FheUint32};
use tfhe::prelude::*;

fn main() {
    let config = ConfigBuilder::default().build();
    let (client_key, server_key) = generate_keys(config);
    set_server_key(server_key);

    let a = FheUint32::encrypt(10u32, &client_key);
    let b = FheUint32::encrypt(20u32, &client_key);
    let sum = a + b;  // FHE addition — no decryption needed

    let result: u32 = sum.decrypt(&client_key);
    assert_eq!(result, 30);
}
```

TFHE-rs supports: `FheBool`, `FheUint8/16/32/64/128/256`, `FheInt8/16/32/64`, `FheString` (experimental).

---

## 8. Ecosystem Projects

| Project | Category | Description |
|---------|----------|-------------|
| **Fhenix** | L2 Rollup | FHE-based L2 using TFHE-rs, deployed CoFHE coprocessor on Arbitrum |
| **Inco Network** | Modular Chain | Confidentiality-as-a-Service for existing L1/L2 chains |
| **Bron Wallet** | Wallet | Self-custodial MPC wallet with native ERC-7984 support |
| **Raycash** | Payments | Self-custodial bank using confidential stablecoins |
| **TokenOps** | DeFi | Confidential vesting and airdrop tooling |
| **Suffragium** | Governance | On-chain encrypted voting system |
| **Shiba Inu / Shibarium** | Other | Using fhEVM for their network-state infrastructure |

---

## 9. Security Checklist

When reviewing or writing fhEVM contracts:

- [ ] **`FHE.allowThis()`** called after every state update to an encrypted variable
- [ ] **`FHE.allow(msg.sender, ...)`** called so the caller can decrypt their own values
- [ ] **`FHE.allowTransient()`** used before `confidentialTransferFrom` (not `FHE.allow`)
- [ ] **`ZamaEthereumConfig`** inherited (not just imported)
- [ ] Input validated with **`FHE.fromExternal(handle, proof)`** — never trust raw handles
- [ ] Re-entrancy guard (`ReentrancyGuard`) added to functions that call external token contracts
- [ ] No comparison of ciphertext with `==` operator in Solidity — use `FHE.eq()` instead
- [ ] `FHE.checkSignatures()` called before trusting any public decryption result

---

## 10. Key Links

- Docs: https://docs.zama.ai
- Protocol Litepaper: https://docs.zama.org/protocol
- GitHub: https://github.com/zama-ai
- fhEVM contracts: https://github.com/zama-ai/fhevm-contracts
- TFHE-rs: https://github.com/zama-ai/tfhe-rs
- Community Forum: https://community.zama.ai
- Developer Program: https://www.zama.org/developer-program (monthly $10K prize pool)
