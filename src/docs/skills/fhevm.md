# Zama fhEVM — Solidity Confidential Contract Development

Use this skill when writing, reviewing, or debugging Solidity contracts that use Zama's fhEVM library.

---

## Architecture

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

---

## Encrypted Types

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

---

## Core FHE Operations

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

---

## Access Control — CRITICAL

Every ciphertext handle must be explicitly authorized before another address can use it. **Forgetting this is the most common bug.**

```solidity
FHE.allowThis(value);               // allow this contract to use the ciphertext in future txs
FHE.allow(value, address);          // allow a specific address to decrypt / use
FHE.allowTransient(value, address); // temporary (single-tx) allow — used before confidentialTransfer

// Public decryption (for auctions, voting reveals)
FHE.makePubliclyDecryptable(value);                      // marks ciphertext for public decryption
FHE.checkSignatures(handles, clearResult, proof);        // verify decryption proof on-chain
```

---

## Contract Setup Pattern

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

## Pattern: FHE Counter (simplest example)

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

| | Plain Counter | FHE Counter |
|---|---|---|
| State type | `uint32` | `euint32` |
| Input | `uint32` | `externalEuint32 + inputProof` |
| Arithmetic | `+=` | `FHE.add()` |
| Visibility | Public | Authorized parties only |

---

## Pattern: Sealed-Bid Auction

Compare bids without revealing them, then public-decrypt winner after auction ends.

```solidity
// During auction — update highest bid with FHE comparison
euint64 currentBid = bids[msg.sender];
ebool isNewWinner = FHE.lt(highestBid, currentBid);
highestBid  = FHE.select(isNewWinner, currentBid, highestBid);
winningAddr = FHE.select(isNewWinner, FHE.asEaddress(msg.sender), winningAddr);
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

---

## Pattern: ERC-7984 Confidential Token

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

## Security Checklist

When reviewing or writing fhEVM contracts:

- [ ] **`FHE.allowThis()`** called after every state update to an encrypted variable
- [ ] **`FHE.allow(value, msg.sender)`** called so the caller can decrypt their own values
- [ ] **`FHE.allowTransient()`** used before `confidentialTransferFrom` (not `FHE.allow`)
- [ ] **`ZamaEthereumConfig`** inherited (not just imported)
- [ ] Input validated with **`FHE.fromExternal(handle, proof)`** — never trust raw handles
- [ ] Re-entrancy guard (`ReentrancyGuard`) added to functions that call external token contracts
- [ ] No comparison of ciphertext with `==` operator in Solidity — use `FHE.eq()` instead
- [ ] `FHE.checkSignatures()` called before trusting any public decryption result
