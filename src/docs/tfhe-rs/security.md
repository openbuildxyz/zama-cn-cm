# 安全性与密码学

TFHE-rs 基于严谨的密码学基础，默认提供至少 **128 位安全强度**，可抵御量子计算机攻击。

> 官方文档：[docs.zama.ai/tfhe-rs/get-started/security-and-cryptography](https://docs.zama.ai/tfhe-rs/get-started/security-and-cryptography)

## 密码学基础

### LWE 问题

TFHE 的安全性基于 **Learning With Errors（LWE，带错误学习）** 问题。LWE 是一种被广泛研究的密码学困难问题，具有以下特性：

- **后量子安全**：目前没有已知的量子算法能高效求解 LWE
- **最坏情况安全归约**：LWE 的困难性可归约到格上的最坏情况困难问题
- **广泛认可**：NIST 后量子密码标准化候选方案中多个入选方案基于 LWE

### TFHE 方案

TFHE-rs 实现了 Zama 改进版的 TFHE 方案，主要包含：

- **LWE 密文**：标准的 LWE 加密
- **GLWE 密文**：基于多项式环的 LWE 变体，提供更高效的加密
- **GGSW 密文**：用于自举操作的特殊密文格式
- **TFHE 自举**：在 Torus（环面）上的可编程自举操作

## 噪声管理

### 噪声的来源

FHE 密文中包含**随机噪声**，这是安全性的基础——噪声使攻击者无法从密文中提取有用信息。密文的结构如下：

```
密文 = 消息 × 2^(位宽-精度) + 噪声
       ↑ 高位存储消息        ↑ 低位存储噪声
```

### 噪声增长

每次同态运算都会导致噪声增大：

| 运算类型 | 噪声增长 |
|---------|---------|
| 加法 | 线性增长（较小） |
| 乘法 | 指数增长（较大） |
| 自举 | 重置为初始噪声水平 |

当噪声增长超过阈值，会"溢出"到消息位，导致解密结果错误。

### 自举（Bootstrapping）

自举操作是 FHE 的关键技术，可以**刷新密文**，将噪声降低到安全水平，从而支持任意深度的计算。

TFHE 的**可编程自举（PBS）** 特性更为强大：

- 在刷新噪声的同时，可以同时对密文应用任意函数（通过查找表实现）
- 这使得 TFHE 能高效实现非线性函数（如激活函数、比较操作等）

## 安全参数

TFHE-rs 提供了预设的安全参数集，默认确保至少 **128 位经典安全强度**：

```rust
use tfhe::ConfigBuilder;

// 默认参数：128 位安全强度，平衡性能与安全
let config = ConfigBuilder::default().build();

// 高安全参数：更高安全强度，性能略低
// let config = ConfigBuilder::with_custom_parameters(...).build();
```

### 参数的含义

| 参数 | 含义 | 影响 |
|-----|------|------|
| `lwe_dimension` | LWE 密文维度 | 安全性 ↑，速度 ↓ |
| `glwe_dimension` | GLWE 密文维度 | 安全性 ↑，密文大小 ↑ |
| `polynomial_size` | 多项式大小 | 性能 ↑，内存 ↑ |
| `pbs_base_log` | 自举基数对数 | 速度与噪声权衡 |
| `pbs_level` | 自举层数 | 速度与噪声权衡 |

## 安全建议

1. **不要自定义参数**（除非你是密码学专家）：使用默认参数集是最安全的选择
2. **保护客户端密钥**：`ClientKey` 泄露意味着所有加密数据可被解密
3. **密文不可复用于不同参数集**：不同参数生成的密文不可混用
4. **定期更新依赖**：关注 TFHE-rs 的安全公告，及时升级

## 参考资料

- [TFHE 原论文](https://eprint.iacr.org/2018/421.pdf)（Chillotti et al., 2020）
- [TFHE-rs 性能基准](https://docs.zama.org/tfhe-rs/get-started/benchmarks)
- [Zama 安全白皮书](https://github.com/zama-ai/tfhe-rs/blob/main/SECURITY.md)
