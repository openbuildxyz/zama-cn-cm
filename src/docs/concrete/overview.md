# 什么是 Concrete？

**Concrete** 是 Zama 开发的开源 FHE 编译器框架，基于 LLVM，能将 Python 程序自动编译为等价的 FHE 电路，让开发者无需了解密码学细节即可实现同态计算。

> 官方文档：[docs.zama.ai/concrete](https://docs.zama.ai/concrete) | GitHub：[zama-ai/concrete](https://github.com/zama-ai/concrete)

## 核心理念

使用 FHE 的传统方式需要开发者手动设计加密电路，这需要深厚的密码学知识。Concrete 彻底改变了这一点：

```
Python 函数 → Concrete 编译器（基于 LLVM）→ FHE 电路 → 在加密数据上执行
```

你只需要写普通的 Python 代码，Concrete 负责将其转换为可在密文上运行的 FHE 程序。

## 安装

```bash
pip install concrete-python
```

> 支持 Python 3.8-3.11，建议使用虚拟环境。

## 基础示例

### 编写并编译一个 FHE 函数

```python
from concrete import fhe

# 定义一个普通 Python 函数
@fhe.compiler({"x": "encrypted"})
def add_one(x):
    return x + 1

# 提供输入集合用于编译（帮助编译器确定参数范围）
inputset = range(0, 100)

# 编译为 FHE 电路
circuit = add_one.compile(inputset)

# 生成密钥
circuit.keygen()

# 加密输入并执行
encrypted_input = circuit.encrypt(42)
encrypted_output = circuit.run(encrypted_input)
result = circuit.decrypt(encrypted_output)

print(result)  # 输出：43
```

### 多参数函数

```python
from concrete import fhe
import numpy as np

@fhe.compiler({"x": "encrypted", "y": "encrypted"})
def compute(x, y):
    # 支持算术运算、比较、位运算等
    return (x * y) + (x - y)

inputset = [(i, j) for i in range(10) for j in range(10)]
circuit = compute.compile(inputset)
circuit.keygen()

enc_x, enc_y = circuit.encrypt(5, 3)
enc_result = circuit.run(enc_x, enc_y)
result = circuit.decrypt(enc_result)

print(result)  # (5 * 3) + (5 - 3) = 17
```

## 工作原理

### 1. 追踪与分析

Concrete 使用追踪技术分析函数的计算图，确定：
- 每个变量所需的整数精度
- 需要哪些 FHE 操作（加法、乘法、查找表等）

### 2. 参数优化

根据输入集合和函数特性，Concrete 自动选择最优的 FHE 参数：
- 最小化噪声
- 平衡性能与精度
- 确保 128 位安全强度

### 3. 电路生成

将 Python 计算图转换为 TFHE 电路：
- 线性操作（加法、标量乘法）：直接执行
- 非线性操作（比较、查找表）：通过可编程自举（PBS）实现

## 支持的操作

| 操作类型 | 支持情况 |
|---------|---------|
| 整数加减法 | ✅ 原生支持 |
| 整数乘法 | ✅ 支持（有精度限制） |
| 整数比较 | ✅ 通过 PBS |
| 位运算 | ✅ 支持 |
| 查找表（LUT） | ✅ 通过 PBS |
| 浮点数 | ⚠️ 需量化为整数 |
| 循环（动态） | ❌ 不支持（需展开） |

## 高级功能

- **前端融合（Frontend Fusing）**：将多个操作融合为单个 PBS，提升性能
- **编译器后端**：基于 LLVM 的优化管道
- **优化器**：自动选择最佳 FHE 参数集
- **部署支持**：客户端/服务端分离部署

## 技术栈

```
Concrete ML（机器学习框架）
    ↓
Concrete（FHE 编译器）
    ↓
TFHE-rs（底层 Rust FHE 库）
```

## 与 Concrete ML 的关系

- **Concrete**：底层编译器，适合自定义 FHE 程序，需要手动设计计算逻辑
- **Concrete ML**：基于 Concrete 的机器学习框架，专为 ML 模型设计，提供更高层的 API

如果你的目标是将 scikit-learn/PyTorch 模型转换为 FHE，建议直接使用 [Concrete ML](../concrete-ml/overview)。

## 参考资料

- [官方文档](https://docs.zama.ai/concrete)
- [API 参考](https://docs.zama.org/concrete/references/api)
- [GitHub 仓库](https://github.com/zama-ai/concrete)
- [示例集合](https://docs.zama.org/concrete/tutorials)
- [最新版本发布](https://github.com/zama-ai/concrete/releases)
- [社区论坛](https://community.zama.ai/c/concrete/)
