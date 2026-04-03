# Zama FHE — Overview & Ecosystem

Use this as a general reference for Zama's company background, product lineup, ecosystem, and key links.
For deeper technical usage, see the specialized skills:
- `/zama-fhevm` — Solidity confidential contract development
- `/zama-sdk` — Relayer SDK (frontend) + Hardhat testing
- `/zama-tfhers` — TFHE-rs Rust library

---

## What is Zama?

Zama is a cryptography company founded in January 2020 by **Rand Hindi** (CEO) and **Dr. Pascal Paillier** (CTO, inventor of the Paillier cryptosystem). Their mission: make Fully Homomorphic Encryption practical for real-world applications.

**FHE in one sentence:** Compute on encrypted data without ever decrypting it.

```
Enc(a) + Enc(b) = Enc(a + b)   // addition homomorphism
Enc(a) × Enc(b) = Enc(a × b)   // multiplication homomorphism
```

Zama uses the **TFHE (Torus FHE)** scheme — optimized for low-latency gate-level operations with fast bootstrapping (noise refresh).

**Key milestones:**
- 2020-01: Founded by Rand Hindi & Pascal Paillier
- 2022-01: Strategic partnership with Protocol Labs
- 2023-09: fhEVM Alpha released (first FHE-based private smart contract protocol)
- 2024-03: Series A $73M (Multicoin Capital, Protocol Labs, Gavin Wood, Anatoly Yakovenko)
- 2025-06: Series B $57M → first FHE unicorn ($1B+ valuation)
- 2025-07: Public testnet live
- 2025-09: ERC-7984 standard co-authored with OpenZeppelin
- 2025-11: Acquired KKRT Labs (Kakarot ZK)
- 2025-12: Mainnet live on Ethereum
- 2026-02: $ZAMA listed on Binance

---

## Product Lineup

| Product | Language | Purpose |
|---------|----------|---------|
| **TFHE-rs** | Rust | Core FHE library — low-level encrypted integer operations |
| **fhEVM** | Solidity | Confidential smart contracts on Ethereum EVM |
| **Concrete** | Python | Compile Python programs → FHE circuits |
| **Concrete ML** | Python | Privacy-preserving machine learning |
| **TKMS** | — | Threshold Key Management System — MPC-based decryption authority |

---

## Ecosystem Projects

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

## Key Links

- Docs: https://docs.zama.ai
- Protocol Litepaper: https://docs.zama.org/protocol
- GitHub: https://github.com/zama-ai
- fhEVM contracts: https://github.com/zama-ai/fhevm-contracts
- TFHE-rs: https://github.com/zama-ai/tfhe-rs
- Community Forum: https://community.zama.ai
- Developer Program: https://www.zama.org/developer-program (monthly $10K prize pool)
