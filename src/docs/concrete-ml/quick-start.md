# Concrete ML 快速入门

本文通过完整示例，带你快速上手 Concrete ML，实现第一个在加密数据上运行的机器学习模型。

> 官方文档：[docs.zama.ai/concrete-ml/tutorials](https://docs.zama.ai/concrete-ml/tutorials)

## 环境准备

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate    # Windows

# 安装依赖
pip install concrete-ml scikit-learn numpy
```

## 完整流程示例

以下示例使用分类数据集训练一个隐私保护的逻辑回归分类器：

```python
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from concrete.ml.sklearn import LogisticRegression

# ── 1. 准备数据 ────────────────────────────────────────
X, y = make_classification(
    n_samples=1000, n_features=10,
    n_informative=5, random_state=42
)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── 2. 训练模型（与 sklearn API 完全兼容）────────────────
model = LogisticRegression(n_bits=8)
model.fit(X_train, y_train)

# ── 3. 编译为 FHE 电路 ──────────────────────────────────
print("编译中...")
model.compile(X_train)
print("编译完成！")

# ── 4. 对比三种模式的结果 ──────────────────────────────
y_pred_clear    = model.predict(X_test, fhe="disable")   # 明文
y_pred_simulate = model.predict(X_test, fhe="simulate")  # 模拟
y_pred_fhe      = model.predict(X_test, fhe="execute")   # 真实 FHE

print(f"明文精度：    {(y_pred_clear == y_test).mean():.2%}")
print(f"模拟精度：    {(y_pred_simulate == y_test).mean():.2%}")
print(f"FHE 精度：   {(y_pred_fhe == y_test).mean():.2%}")
print(f"FHE vs 明文一致率：{(y_pred_fhe == y_pred_clear).mean():.1%}")
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

result = model.predict(X_test, fhe="simulate")
print(f"决策树 FHE 精度：{(result == y_test).mean():.2%}")
```

## XGBoost 集成

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

result = model.predict(X_test, fhe="simulate")
print(f"XGBoost FHE 精度：{(result == y_test).mean():.2%}")
```

## PyTorch 神经网络

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from concrete.ml.torch.compile import compile_torch_model

# 定义网络
class MLP(nn.Module):
    def __init__(self, input_dim=10):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 2),
        )

    def forward(self, x):
        return self.net(x)

# 训练
model = MLP()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
criterion = nn.CrossEntropyLoss()

X_tensor = torch.FloatTensor(X_train)
y_tensor = torch.LongTensor(y_train)
loader = DataLoader(TensorDataset(X_tensor, y_tensor), batch_size=32, shuffle=True)

for epoch in range(20):
    for X_batch, y_batch in loader:
        optimizer.zero_grad()
        criterion(model(X_batch), y_batch).backward()
        optimizer.step()

# 编译为 FHE
representative_data = torch.FloatTensor(X_train[:100])
fhe_circuit = compile_torch_model(model, representative_data, n_bits=8)

# 推理
model.eval()
with torch.no_grad():
    result = fhe_circuit.forward(
        torch.FloatTensor(X_test).numpy(), fhe="simulate"
    )
    preds = result.argmax(axis=1)
    print(f"神经网络 FHE 精度：{(preds == y_test).mean():.2%}")
```

## 客户端-服务端部署

Concrete ML 支持实际部署场景中的客户端-服务端分离：

```python
# === 服务端：保存编译好的 FHE 电路 ===
model.compile(X_train)
model.fhe_circuit.server.save("./server_files")
model.fhe_circuit.client.save("./client_files")

# === 客户端：生成密钥并加密数据 ===
from concrete.ml.deployment import FHEModelClient

client = FHEModelClient("./client_files")
client.generate_private_and_evaluation_keys()

# 量化并加密输入
encrypted_input = client.quantize_encrypt_serialize(X_test[:1])
eval_keys = client.get_serialized_evaluation_keys()

# === 服务端：在密文上执行推理 ===
from concrete.ml.deployment import FHEModelServer

server = FHEModelServer("./server_files")
encrypted_result = server.run(encrypted_input, eval_keys)

# === 客户端：解密结果 ===
result = client.deserialize_decrypt_dequantize(encrypted_result)
print(f"预测结果：{result}")
```

## 执行模式对比

| 模式 | 说明 | 速度 | 用途 |
|------|------|------|------|
| `fhe="disable"` | 明文执行，不加密 | 最快 | 开发调试 |
| `fhe="simulate"` | 模拟 FHE 行为，不加密 | 较快 | 验证精度 |
| `fhe="execute"` | 真正 FHE 加密执行 | 最慢 | 生产环境 |

> `simulate` 与 `execute` 数值结果完全一致，建议先用 `simulate` 验证精度再切换到 `execute`。

## 常见问题

**Q: `n_bits` 越大越好吗？**

A: 不一定。`n_bits` 越大精度越高，但 FHE 延迟也越长。通常 6-8 位已经足够大多数分类任务。上限为 16 位。

**Q: 能处理回归问题吗？**

A: 可以，使用 `concrete.ml.sklearn.LinearRegression`、`DecisionTreeRegressor` 等回归器即可。

**Q: 为什么 `simulate` 和 `execute` 精度一样？**

A: FHE 计算在数值上是精确的（无精度损失），精度差异来自量化而非加密本身。

## 下一步

- 阅读 [Concrete ML 概述](./overview) 了解完整功能和限制
- 查看[部署指南](https://docs.zama.ai/concrete-ml/guides/production-deployment) 了解生产部署方案
- 参考 [Notebook 示例](https://docs.zama.ai/concrete-ml/tutorials) 获取更多用例
