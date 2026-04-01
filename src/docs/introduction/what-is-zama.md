# 什么是 Zama？

Zama 是一家专注于**全同态加密（FHE, Fully Homomorphic Encryption）**的密码学公司，致力于让隐私计算变得简单易用。

## 核心使命

Zama 的目标是让开发者能够轻松地在加密数据上进行计算，无需解密即可完成任意运算，从而实现真正的端到端数据隐私保护。

## 主要产品

### TFHE-rs

用 Rust 编写的高性能 FHE 库，实现了 TFHE（Torus Fully Homomorphic Encryption）方案。它提供了业界领先的 FHE 运算性能，是 Zama 技术栈的核心基础。

### fhEVM

基于 FHE 的以太坊虚拟机扩展，允许开发者在以太坊链上编写保密智能合约（Confidential Smart Contracts）。合约状态和交易数据均以加密形式存储和处理。

### Concrete

Python 前端编译器，将 Python 程序自动编译为 FHE 电路，让数据科学家和 AI 研究者能够轻松构建隐私保护的 ML 模型。

### Concrete ML

专为机器学习设计的隐私保护库，支持在加密数据上训练和推理模型，无需暴露原始数据。

## 为什么选择 FHE？

| 技术 | 隐私保护 | 可计算性 | 去信任化 |
|------|---------|---------|---------|
| 普通加密 | ✅ | ❌ | ❌ |
| 安全多方计算 (MPC) | ✅ | 部分 | ✅ |
| 零知识证明 (ZK) | ✅ | 部分 | ✅ |
| **全同态加密 (FHE)** | ✅ | ✅ | ✅ |

FHE 是目前唯一能够在**完全加密**的状态下执行**任意计算**的密码学方案。

## 快速开始

- 访问 [Zama 官方文档](https://docs.zama.ai) 了解详细技术文档
- 查看 [GitHub](https://github.com/zama-ai) 获取开源代码
- 加入 [Zama 中文社区](/posts) 与其他开发者交流
