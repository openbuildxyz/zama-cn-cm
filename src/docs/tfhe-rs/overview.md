# 什么是 TFHE-rs？

**TFHE-rs** 是 Zama 开发的纯 Rust 实现的全同态加密库，支持对加密数据进行布尔运算和整数算术运算。

> 官方文档：[docs.zama.ai/tfhe-rs](https://docs.zama.ai/tfhe-rs) | GitHub：[zama-ai/tfhe-rs](https://github.com/zama-ai/tfhe-rs)

## 核心特性

- **Rust API**：主要接口，性能最优
- **C API**：便于与其他语言集成
- **WASM API**：客户端浏览器环境使用
- **GPU / HPU 加速**：支持硬件加速后端

## 密码学基础

TFHE 基于 **Learning With Errors（LWE，带错误学习）** 问题，具备后量子安全特性。

Zama 实现了 TFHE 的改进变体，以固定精度整数作为消息，支持：

- **同态加法**：`E[x] + E[y] = E[x+y]`
- **同态乘法**：`E[x] × E[y] = E[x×y]`
- **同态函数求值**：`f(E[x]) = E[f(x)]`（通过可编程自举实现）

> 技术白皮书：[whitepaper.zama.ai](https://whitepaper.zama.ai/)

## 基本概念

| 概念 | 说明 |
|-----|------|
| 明文（Cleartext） | 加密前的原始值 |
| 编码明文（Plaintext） | 经过编码的消息 |
| 密文（Ciphertext） | 加密后的消息 |

## 典型工作流

```
客户端                           服务端
  │                               │
  ├─ 1. 生成密钥对                 │
  │   (client_key + server_key)   │
  │                               │
  ├─ 2. 加密数据 ──────────────►  │
  │   (使用 client_key)           │
  │                               ├─ 3. 设置 server_key
  │                               ├─ 4. 在密文上执行运算
  │                               │   (全程加密，不解密)
  │                               │
  ◄────────────────────────────── ┤ 5. 返回加密结果
  │                               │
  └─ 6. 解密结果
      (使用 client_key)
```

## 支持的数据类型

| 类型 | 描述 |
|-----|------|
| `FheBool` | 加密布尔值 |
| `FheUint8` ~ `FheUint256` | 加密无符号整数（8~256 位） |
| `FheInt8` ~ `FheInt256` | 加密有符号整数（8~256 位） |

## API 参考

- [Rust API 文档](https://docs.rs/tfhe/latest/tfhe/)
- [C API 参考](https://docs.zama.ai/tfhe-rs)
- [TFHE 深度解析](https://docs.zama.ai/tfhe-rs)
- [TFHE-rs Handbook](https://github.com/zama-ai/tfhe-rs-handbook)

## 学习资源

- [同态奇偶校验位教程](https://docs.zama.ai/tfhe-rs)
- [ASCII 字符串大小写转换](https://docs.zama.ai/tfhe-rs)
- [Boolean API 实现 SHA256](https://docs.zama.ai/tfhe-rs)

## 参考资料

- [官方文档](https://docs.zama.ai/tfhe-rs)
- [GitHub 仓库](https://github.com/zama-ai/tfhe-rs)
- [最新版本发布](https://github.com/zama-ai/tfhe-rs/releases)
- [社区论坛](https://community.zama.ai/)
