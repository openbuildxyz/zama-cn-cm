# Zama TFHE-rs — Rust FHE Library

Use this skill when writing Rust programs that perform FHE computation using Zama's TFHE-rs library.

---

## Installation

```toml
# Cargo.toml
[dependencies]
tfhe = { version = "0.10", features = ["integer", "x86_64-unix"] }
```

Available feature flags:
- `integer` — FheUint/FheInt integer types (required for most use cases)
- `x86_64-unix` — optimized for x86-64 Linux/macOS
- `aarch64-unix` — optimized for Apple Silicon / ARM64
- `boolean` — FheBool operations
- `shortint` — low-level shortint primitives

---

## Quick Start

```rust
use tfhe::{ConfigBuilder, generate_keys, set_server_key, FheUint32};
use tfhe::prelude::*;

fn main() {
    // 1. Generate keys
    let config = ConfigBuilder::default().build();
    let (client_key, server_key) = generate_keys(config);

    // 2. Set server key (needed for FHE ops on this thread)
    set_server_key(server_key);

    // 3. Encrypt
    let a = FheUint32::encrypt(10u32, &client_key);
    let b = FheUint32::encrypt(20u32, &client_key);

    // 4. Compute on ciphertexts — no decryption needed
    let sum = a + b;

    // 5. Decrypt result
    let result: u32 = sum.decrypt(&client_key);
    assert_eq!(result, 30);
}
```

---

## Supported Types

| Type | Plaintext equivalent | Notes |
|------|---------------------|-------|
| `FheBool` | `bool` | Encrypted boolean |
| `FheUint8` | `u8` | |
| `FheUint16` | `u16` | |
| `FheUint32` | `u32` | |
| `FheUint64` | `u64` | |
| `FheUint128` | `u128` | |
| `FheUint256` | `U256` | |
| `FheInt8` | `i8` | Signed |
| `FheInt16` | `i16` | Signed |
| `FheInt32` | `i32` | Signed |
| `FheInt64` | `i64` | Signed |
| `FheString` | `String` | Experimental |

---

## Arithmetic & Comparison

```rust
use tfhe::prelude::*;

// Arithmetic (works like native operators)
let sum  = &a + &b;
let diff = &a - &b;
let prod = &a * &b;
let div  = &a / &b;
let rem  = &a % &b;

// Comparison (returns FheBool)
let gt: FheBool = a.gt(&b);
let lt: FheBool = a.lt(&b);
let eq: FheBool = a.eq(&b);
let ge: FheBool = a.ge(&b);
let le: FheBool = a.le(&b);

// Bitwise
let and = &a & &b;
let or  = &a | &b;
let xor = &a ^ &b;
let shl = &a << 3u32;
let shr = &a >> 3u32;

// Conditional select (if_then_else)
let result = condition.if_then_else(&a, &b);
```

---

## Key Management

```rust
use tfhe::{ConfigBuilder, generate_keys, CompressedServerKey};
use tfhe::prelude::*;

// Generate keys
let config = ConfigBuilder::default().build();
let (client_key, server_key) = generate_keys(config);

// Serialize server key for sending to compute server
let compressed = CompressedServerKey::new(&client_key);
let bytes = bincode::serialize(&compressed).unwrap();

// On compute server: deserialize and set
let server_key: ServerKey = bincode::deserialize(&bytes).unwrap()
    .decompress();
set_server_key(server_key);
```

---

## Client/Server Split Pattern

TFHE-rs is designed for a client-server model:

1. **Client**: holds `client_key`, encrypts inputs, decrypts outputs
2. **Server**: holds `server_key` only, performs all FHE operations on ciphertexts without ever seeing plaintext

```rust
// CLIENT SIDE
let encrypted_input = FheUint32::encrypt(secret_value, &client_key);
let serialized = bincode::serialize(&encrypted_input).unwrap();
// → send serialized bytes to server

// SERVER SIDE
set_server_key(server_key);
let input: FheUint32 = bincode::deserialize(&received_bytes).unwrap();
let result = input + FheUint32::encrypt_trivial(42u32); // trivial = known constant
let result_bytes = bincode::serialize(&result).unwrap();
// → send result_bytes back to client

// CLIENT SIDE
let result: FheUint32 = bincode::deserialize(&result_bytes).unwrap();
let plaintext: u32 = result.decrypt(&client_key);
```

---

## Parallel / Multi-threaded Computation

```rust
use tfhe::set_server_key;
use rayon::prelude::*;

// Set server key per thread when using rayon
rayon::broadcast(|_| set_server_key(server_key.clone()));

let results: Vec<FheUint32> = inputs
    .par_iter()
    .map(|x| x + &constant)
    .collect();
```
