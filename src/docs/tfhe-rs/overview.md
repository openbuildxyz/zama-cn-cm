# 什么是 TFHE-rs？

**TFHE-rs** 是 Zama 开发的纯 Rust 实现的全同态加密库，基于 TFHE（Torus Fully Homomorphic Encryption）方案，支持在加密数据上进行布尔运算和整数算术。

> 官方文档：[docs.zama.org/tfhe-rs](https://docs.zama.org/tfhe-rs) | GitHub：[zama-ai/tfhe-rs](https://github.com/zama-ai/tfhe-rs)

## 设计目标

TFHE-rs 专为开发者和研究人员设计，提供对 TFHE 的精细控制，同时无需深入了解底层实现细节。其核心目标是：

- **稳定性**：生产就绪的 API，版本间保持兼容
- **简洁性**：高层 API 屏蔽复杂的密码学细节
- **高性能**：经过深度优化的 Rust 实现，业界领先的 FHE 运算速度
- **完整性**：覆盖 TFHE 所有高级特性

## 支持的 API

| API | 说明 |
|-----|------|
| **Rust API** | 主要接口，适用于 Rust 项目 |
| **C API** | 适用于 C/C++ 开发者 |
| **WASM API** | 客户端 WebAssembly 集成 |
| **GPU 加速后端** | 利用 GPU 大幅提升计算性能 |
| **HPU 加速后端** | 专用硬件处理单元加速 |

## 核心工作流程

使用 TFHE-rs 进行同态计算的基本步骤：

```
1. 生成密钥对（客户端密钥 + 服务端密钥）
2. 使用客户端密钥加密数据
3. 使用服务端密钥在密文上执行计算
4. 使用客户端密钥解密结果
```

客户端密钥（`ClientKey`）用于加密和解密，**必须严格保密**，不能暴露给服务端。服务端密钥（`ServerKey`）可以公开，用于在加密数据上执行计算。

## 支持的数据类型

- **布尔类型**（`FheBool`）：加密的布尔值，支持与/或/非等逻辑运算
- **短整数**（`FheUint4` ~ `FheUint8`）：加密的小位宽无符号整数
- **整数**（`FheUint16` ~ `FheUint256`）：加密的大位宽整数，支持完整算术运算

## 为什么选择 TFHE-rs？

相比其他 FHE 库，TFHE-rs 具有以下优势：

- **最快的自举（Bootstrapping）速度**：TFHE 的自举操作延迟极低，可支持任意深度计算
- **可编程自举**：自举过程中可同时执行任意函数查找表（LUT），效率远超其他方案
- **成熟的生态**：被 Zama fhEVM、Concrete 等上层工具链所采用
- **开源免费**：BSD 许可证，可商用
