# TFHE-rs 快速入门

本文介绍如何在 Rust 项目中集成 TFHE-rs，完成从密钥生成到同态计算的完整流程。

> 官方文档：[docs.zama.org/tfhe-rs/get-started/getting-started](https://docs.zama.org/tfhe-rs/get-started/getting-started)

## 安装

在 `Cargo.toml` 中添加依赖：

```toml
[dependencies]
tfhe = { version = "0.10", features = ["integer", "x86_64-unix"] }
```

根据你的平台选择对应 feature：
- `x86_64-unix`：Linux/macOS (x86_64)
- `x86_64`：Windows (x86_64)
- `aarch64-unix`：ARM64 (Apple Silicon / Linux ARM)

## 基础示例：加密整数运算

以下示例展示如何加密两个整数，在密文上进行加法，然后解密结果：

```rust
use tfhe::prelude::*;
use tfhe::{generate_keys, set_server_key, ConfigBuilder, FheUint32};

fn main() {
    // 1. 生成密钥
    let config = ConfigBuilder::default().build();
    let (client_key, server_key) = generate_keys(config);

    // 2. 设置服务端密钥（用于密文计算）
    set_server_key(server_key);

    // 3. 加密数据
    let a = FheUint32::encrypt(10u32, &client_key);
    let b = FheUint32::encrypt(20u32, &client_key);

    // 4. 在密文上执行加法（数据全程加密）
    let result = a + b;

    // 5. 解密结果
    let decrypted: u32 = result.decrypt(&client_key);
    println!("10 + 20 = {}", decrypted); // 输出：10 + 20 = 30
}
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
| 比较 | `eq` `lt` `gt` | 返回加密布尔值 |
| 移位 | `<<` `>>` | 左移/右移 |

## 下一步

- 查看 [安全与密码学](./security) 了解参数选择和安全级别
- 阅读 [官方 API 文档](https://docs.zama.org/tfhe-rs) 了解更多高级用法
- 参考 [GitHub 示例](https://github.com/zama-ai/tfhe-rs/tree/main/tfhe/examples) 获取完整代码
