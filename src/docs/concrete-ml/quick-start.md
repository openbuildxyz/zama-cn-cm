# Concrete ML 快速入门

本文通过完整示例，带你快速上手 Concrete ML，实现第一个在加密数据上运行的机器学习模型。

> 官方文档：[docs.zama.org/concrete-ml/tutorials/ml_examples](https://docs.zama.org/concrete-ml/tutorials/ml_examples)

## 环境准备

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate    # Windows

# 安装依赖
pip install concrete-ml scikit-learn numpy
```

## 第一个 FHE 分类器

以下示例使用乳腺癌数据集训练一个隐私保护的逻辑回归分类器：

```python
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from concrete.ml.sklearn import LogisticRegression

# ── 1. 准备数据 ────────────────────────────────────────
X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 标准化（推荐）
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# ── 2. 训练模型（与 sklearn API 完全兼容）────────────────
model = LogisticRegression(n_bits=8)
model.fit(X_train, y_train)

# 验证明文精度
clear_preds = model.predict(X_test, fhe="disable")
print(f"明文精度：{(clear_preds == y_test).mean():.2%}")

# ── 3. 编译为 FHE 电路 ──────────────────────────────────
print("编译中...")
model.compile(X_train)
print("编译完成！")

# ── 4. 模拟 FHE 推理（快速验证，不实际加密）──────────────
sim_preds = model.predict(X_test, fhe="simulate")
print(f"FHE 模拟精度：{(sim_preds == y_test).mean():.2%}")

# ── 5. 真正的 FHE 推理（加密执行，生产环境）──────────────
# 注意：对大数据集较慢，这里只预测前 3 个样本
fhe_preds = model.predict(X_test[:3], fhe="execute")
print(f"FHE 加密预测结果：{fhe_preds}")
print(f"真实标签：{y_test[:3]}")
```

## 使用决策树

```python
from concrete.ml.sklearn import DecisionTreeClassifier

model = DecisionTreeClassifier(
    n_bits=6,
    max_depth=4,
    random_state=42,
)

model.fit(X_train, y_train)
model.compile(X_train)

# 比较三种模式的精度
modes = ["disable", "simulate"]
for mode in modes:
    preds = model.predict(X_test, fhe=mode)
    acc = (preds == y_test).mean()
    print(f"[{mode:8s}] 精度：{acc:.2%}")
```

## XGBoost / LightGBM 集成

```python
from concrete.ml.sklearn import XGBClassifier

model = XGBClassifier(
    n_estimators=20,
    n_bits=6,
    max_depth=4,
    learning_rate=0.1,
)

model.fit(X_train, y_train)
model.compile(X_train)

sim_preds = model.predict(X_test, fhe="simulate")
print(f"XGBoost FHE 精度：{(sim_preds == y_test).mean():.2%}")
```

## PyTorch 神经网络

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from concrete.ml.torch.compile import compile_torch_model

# 定义网络
class MLP(nn.Module):
    def __init__(self, input_dim=30):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 2),
        )

    def forward(self, x):
        return self.net(x)

# 训练
model = MLP()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
criterion = nn.CrossEntropyLoss()

X_tensor = torch.FloatTensor(X_train)
y_tensor = torch.LongTensor(y_train)
dataset = TensorDataset(X_tensor, y_tensor)
loader = DataLoader(dataset, batch_size=32, shuffle=True)

for epoch in range(20):
    for X_batch, y_batch in loader:
        optimizer.zero_grad()
        loss = criterion(model(X_batch), y_batch)
        loss.backward()
        optimizer.step()

# 编译为 FHE
representative_data = torch.FloatTensor(X_train[:100])
fhe_circuit = compile_torch_model(
    model,
    representative_data,
    n_bits=8,
)

# 推理
model.eval()
with torch.no_grad():
    X_test_tensor = torch.FloatTensor(X_test)
    # 模拟模式
    sim_result = fhe_circuit.forward(X_test_tensor.numpy(), fhe="simulate")
    preds = sim_result.argmax(axis=1)
    print(f"神经网络 FHE 精度：{(preds == y_test).mean():.2%}")
```

## 模型保存与加载

```python
import os

# 保存模型文件（用于部署）
model.compile(X_train)
model.fhe_circuit.server.save("./fhe_server")
model.fhe_circuit.client.save("./fhe_client")

print("已保存服务端文件：", os.listdir("./fhe_server"))
print("已保存客户端文件：", os.listdir("./fhe_client"))
```

## 性能参考

在标准硬件上（Intel Core i7），不同模型的单次 FHE 预测时间（近似）：

| 模型 | n_bits | 近似延迟 |
|------|--------|---------|
| LogisticRegression | 8 | ~0.5 秒 |
| DecisionTree (depth=4) | 6 | ~1-5 秒 |
| RandomForest (10棵) | 6 | ~10-30 秒 |
| 小型 MLP (2层) | 8 | ~5-20 秒 |

> 注意：FHE 延迟取决于模型复杂度、n_bits 值和硬件性能。生产部署建议使用高性能服务器。

## 常见问题

**Q: 为什么 FHE 模拟和真正 FHE 执行的精度一样？**

A: `simulate` 模式在数值上与 `execute` 完全一致，但不实际加密数据，速度更快。开发时建议先用 `simulate` 验证精度。

**Q: `n_bits` 越大越好吗？**

A: 不一定。`n_bits` 越大精度越高，但 FHE 延迟也越长。通常 6-8 位已经足够大多数分类任务。

**Q: 能处理回归问题吗？**

A: 可以，使用 `concrete.ml.sklearn.LinearRegression`、`DecisionTreeRegressor` 等对应的回归器即可。

## 下一步

- 阅读 [Concrete ML 概述](./overview) 了解支持的完整模型列表
- 查看[部署指南](https://docs.zama.org/concrete-ml/guides/client_server)了解客户端-服务端分离方案
- 参考 [Notebook 示例](https://github.com/zama-ai/concrete-ml/tree/main/use_case_examples) 获取更多用例
