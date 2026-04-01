# 什么是 Concrete ML？

**Concrete ML** 是 Zama 开发的开源隐私机器学习框架，让开发者无需深入了解 FHE 密码学，就能将标准 ML 模型转换为可在加密数据上运行的隐私保护版本。

> 官方文档：[docs.zama.org/concrete-ml](https://docs.zama.org/concrete-ml) | GitHub：[zama-ai/concrete-ml](https://github.com/zama-ai/concrete-ml)

## 核心理念

传统 ML 模型在推理时需要访问明文数据，这在隐私敏感场景下是不可接受的。Concrete ML 解决了这一问题：

```
scikit-learn/PyTorch 模型 → Concrete ML 转换 → FHE 推理 → 在加密数据上预测
```

用户的数据始终保持加密状态，即使在模型推理过程中也不会暴露。

## 安装

```bash
pip install concrete-ml
```

> 注意：需要 Python 3.8-3.11，建议使用虚拟环境。

## 支持的模型框架

Concrete ML 支持以下主流 ML 框架的模型：

### scikit-learn 模型

| 模型类型 | 支持的算法 |
|---------|-----------|
| 线性模型 | LogisticRegression, LinearSVC, LinearSVR, Ridge, Lasso |
| 树模型 | DecisionTree, RandomForest, XGBoost, LightGBM |
| 聚类 | KMeans |

### PyTorch / Torch 模型

- 任意架构的神经网络（通过量化支持）
- 使用 `brevitas` 量化训练的模型
- 标准 `torch.nn` 模块组合

## 基础示例

### scikit-learn 分类器

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from concrete.ml.sklearn import LogisticRegression

# 加载数据
X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# 创建并训练 Concrete ML 模型（API 与 sklearn 兼容）
model = LogisticRegression(n_bits=8)
model.fit(X_train, y_train)

# 编译为 FHE 电路
model.compile(X_train)

# 在加密数据上进行推理
# fhe="execute" 表示使用完整 FHE 执行
predictions = model.predict(X_test, fhe="execute")
print(f"准确率：{(predictions == y_test).mean():.2%}")
```

### 随机森林

```python
from concrete.ml.sklearn import RandomForestClassifier

model = RandomForestClassifier(
    n_estimators=10,
    n_bits=6,        # 量化位宽，影响精度和性能
    max_depth=4,
)

model.fit(X_train, y_train)
model.compile(X_train)

# 三种执行模式：
# fhe="disable"  - 明文执行（最快，用于调试）
# fhe="simulate" - 模拟 FHE（快速验证）
# fhe="execute"  - 真正的 FHE 执行（最慢，最安全）
result = model.predict(X_test, fhe="simulate")
```

### PyTorch 神经网络

```python
import torch
import torch.nn as nn
from concrete.ml.torch.compile import compile_torch_model

# 定义标准 PyTorch 模型
class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(30, 64)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(64, 2)

    def forward(self, x):
        return self.fc2(self.relu(self.fc1(x)))

model = SimpleNet()
# ... 训练模型 ...

# 转换为 FHE 模型
from torch.utils.data import DataLoader
import numpy as np

# 准备代表性输入集
representative_inputs = torch.FloatTensor(X_train[:100])

fhe_circuit = compile_torch_model(
    model,
    representative_inputs,
    n_bits=8,
)
```

## 量化：浮点转整数

FHE 原生只支持整数运算，Concrete ML 通过**量化**将浮点数转换为整数：

```
浮点权重/激活值 → 量化（n_bits 位精度）→ 整数表示 → FHE 计算
```

| `n_bits` | 精度 | 速度 | 用途 |
|---------|------|------|------|
| 4 | 低 | 最快 | 原型验证 |
| 6 | 中 | 较快 | 常规应用 |
| 8 | 高 | 较慢 | 高精度需求 |
| 16 | 很高 | 慢 | 研究场景 |

## 执行模式对比

```python
# 1. 禁用 FHE（明文，最快，用于开发调试）
result = model.predict(X, fhe="disable")

# 2. 模拟模式（不加密，但模拟 FHE 行为）
result = model.predict(X, fhe="simulate")

# 3. 完整 FHE（真正加密，生产使用）
result = model.predict(X, fhe="execute")
```

## 客户端-服务端分离

Concrete ML 支持实际部署场景中的客户端-服务端分离：

```python
# === 服务端 ===
# 编译并保存 FHE 电路
model.compile(X_train)
model.fhe_circuit.server.save("./server_files")

# === 客户端 ===
from concrete.ml.deployment import FHEModelClient

client = FHEModelClient("./server_files")
client.generate_private_and_evaluation_keys()

# 加密数据
encrypted_input = client.quantize_encrypt_serialize(X_test[:1])

# === 服务端执行 ===
from concrete.ml.deployment import FHEModelServer

server = FHEModelServer("./server_files")
encrypted_result = server.run(encrypted_input, client.get_serialized_evaluation_keys())

# === 客户端解密 ===
result = client.deserialize_decrypt_dequantize(encrypted_result)
```

## 与 Concrete 的关系

- **Concrete ML**：高层框架，专为 ML 模型设计，封装了 FHE 细节
- **Concrete**：底层编译器，Concrete ML 基于它构建，适合自定义 FHE 程序

## 参考资料

- [官方文档](https://docs.zama.org/concrete-ml)
- [GitHub 仓库](https://github.com/zama-ai/concrete-ml)
- [示例 Notebooks](https://github.com/zama-ai/concrete-ml/tree/main/use_case_examples)
- [Zama 博客：隐私 ML](https://www.zama.ai/post)
