# TFHE-rs 快速入门

本文介绍如何在 Rust 项目中集成 TFHE-rs，完成从密钥生成到同态计算的完整流程。

> 官方文档：[docs.zama.ai/tfhe-rs/get-started/quick-start](https://docs.zama.ai/tfhe-rs/get-started/quick-start)

## 安装

首先确保已安装 Rust（通过 [rustup.rs](https://rustup.rs/)），然后创建新项目：

```bash
cargo new tfhe-example
cd tfhe-example
```

在 `Cargo.toml` 中添加依赖：

```toml
[dependencies]
tfhe = { version = "~1.5.4", features = ["integer"] }

[profile.release]
lto = "fat"
```

> 注意：务必使用 `--release` 模式编译运行，否则性能会非常低。

## 基础示例：加密整数运算

以下示例加密两个 `u8` 整数，在密文上执行加法，然后解密结果：

```rust
use tfhe::{ConfigBuilder, generate_keys, set_server_key, FheUint8};
use tfhe::prelude::*;

fn main() {
    // 1. 配置并生成密钥
    let config = ConfigBuilder::default().build();
    let (client_key, server_key) = generate_keys(config);

    let clear_a = 27u8;
    let clear_b = 128u8;

    // 2. 客户端：加密数据
    let a = FheUint8::encrypt(clear_a, &client_key);
    let b = FheUint8::encrypt(clear_b, &client_key);

    // 3. 服务端：设置运算密钥
    set_server_key(server_key);

    // 4. 在密文上执行加法（数据全程加密）
    let result = a + b;

    // 5. 客户端：解密结果
    let decrypted_result: u8 = result.decrypt(&client_key);
    let clear_result = clear_a.wrapping_add(clear_b);

    assert_eq!(decrypted_result, clear_result);
    println!("{} + {} = {}", clear_a, clear_b, decrypted_result);
}
```

编译运行：

```bash
# 务必使用 --release，否则极慢
cargo run --release

# 启用本机 CPU 优化（不可移植，但性能更好）
RUSTFLAGS="-C target-cpu=native" cargo run --release
```

## 布尔运算示例

```rust
use tfhe::prelude::*;
use tfhe::{generate_keys, set_server_key, ConfigBuilder, FheBool};

fn main() {
    let config = ConfigBuilder::default().build();
    let (client_key, server_key) = generate_keys(config);
    set_server_key(server_key);

    let a = FheBool::encrypt(true, &client_key);
    let b = FheBool::encrypt(false, &client_key);

    // 在加密数据上执行逻辑运算
    let and_result = a.clone() & b.clone();
    let or_result  = a.clone() | b.clone();

    let and_val: bool = and_result.decrypt(&client_key);
    let or_val: bool  = or_result.decrypt(&client_key);

    println!("true AND false = {}", and_val); // false
    println!("true OR false  = {}", or_val);  // true
}
```

## 密钥类型说明

| 密钥类型 | 用途 | 保密要求 |
|---------|------|---------|
| `ClientKey` | 加密 / 解密 | **必须保密**，不可分享 |
| `ServerKey` | 密文上的同态运算 | 可公开分享给服务端 |
| `PublicKey` | 允许第三方加密（无需 ClientKey） | 可公开 |
| `CompressedServerKey` | 压缩存储的 ServerKey | 可公开 |

## 支持的运算

### 整数类型（FheUint / FheInt）

| 运算 | 符号 | 说明 |
|------|------|------|
| 加法 | `+` | 密文 + 密文，密文 + 明文 |
| 减法 | `-` | 密文 - 密文，密文 - 明文 |
| 乘法 | `*` | 密文 × 密文，密文 × 明文 |
| 除法 | `/` | 密文 ÷ 明文 |
| 位运算 | `&` `\|` `^` `!` | 按位与/或/异或/非 |
| 比较 | `eq` `lt` `gt` `le` `ge` | 返回加密布尔值 |
| 移位 | `<<` `>>` | 左移/右移 |
| 循环移位 | `rotate_left` `rotate_right` | 循环移位 |

## 性能优化建议

1. **始终使用 `--release` 模式**：调试模式比 release 模式慢数百倍
2. **启用 LTO**：在 `Cargo.toml` 的 `[profile.release]` 中设置 `lto = "fat"`
3. **本机 CPU 优化**：使用 `RUSTFLAGS="-C target-cpu=native"` 启用 AVX2/AVX512 指令集

## 下一步

- 查看 [安全与密码学](./security) 了解参数选择和安全级别
- 阅读 [官方 API 文档](https://docs.rs/tfhe/latest/tfhe/) 了解完整接口
- 参考 [GitHub 示例](https://github.com/zama-ai/tfhe-rs/tree/main/tfhe/examples) 获取更多代码
