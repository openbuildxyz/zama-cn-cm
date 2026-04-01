# 什么是 Concrete ML？

**Concrete ML** 是 Zama 开发的开源隐私机器学习框架，基于 FHE，让数据科学家**无需密码学知识**即可将标准 ML 模型转换为可在加密数据上运行的隐私保护版本。

> 官方文档：[docs.zama.ai/concrete-ml](https://docs.zama.ai/concrete-ml) | GitHub：[zama-ai/concrete-ml](https://github.com/zama-ai/concrete-ml)

## 核心功能

### 自动模型转换
将主流框架的模型自动转换为 FHE 等价版本：
- **scikit-learn 模型**：线性模型、树模型、集成模型
- **PyTorch 神经网络**：任意架构
- **大语言模型（LLM）**：支持在加密数据上微调

### 加密数据推理
模型推理全程在加密数据上执行，服务端无法获知原始数据。

### 加密数据训练
支持在加密数据上训练线性模型，实现隐私保护训练（Federated Learning 场景）。

### 加密数据预处理
支持在加密 DataFrame 上进行数据预处理操作。

## 安装

```bash
pip install concrete-ml
```

> 需要 Python 3.8-3.11，建议使用虚拟环境。

## 支持的模型

### scikit-learn 模型

| 类别 | 支持的算法 |
|------|-----------|
| 线性模型 | `LogisticRegression`, `LinearSVC`, `LinearSVR`, `Ridge`, `Lasso` |
| 树模型 | `DecisionTreeClassifier`, `DecisionTreeRegressor` |
| 集成模型 | `RandomForestClassifier`, `RandomForestRegressor` |
| 梯度提升 | `XGBClassifier`, `XGBRegressor`, `LGBMClassifier` |
| 聚类 | `KMeans` |

### PyTorch / 神经网络

- 标准 `torch.nn` 模块组合
- 使用 `brevitas` 量化感知训练的模型
- 支持自定义网络架构

## 快速示例

### scikit-learn 分类器（逻辑回归）

```python
from sklearn.datasets import make_classification
from concrete.ml.sklearn import LogisticRegression

X, y = make_classification(n_samples=1000, n_features=10, random_state=42)
X_train, X_test = X[:800], X[800:]
y_train, y_test = y[:800], y[800:]

# 1. 训练（与 sklearn API 完全兼容）
model = LogisticRegression(n_bits=8)
model.fit(X_train, y_train)

# 2. 编译为 FHE 电路
model.compile(X_train)

# 3. 在加密数据上推理
y_pred_fhe = model.predict(X_test, fhe="execute")

# 对比精度
y_pred_clear = model.predict(X_test, fhe="disable")
similarity = (y_pred_fhe == y_pred_clear).mean()
print(f"FHE vs 明文一致率：{similarity:.1%}")  # 通常 100.0%
```

## 量化：浮点转整数

FHE 原生只支持整数运算，Concrete ML 通过**量化**将浮点数转换为整数：

```
浮点权重/激活值 → 量化（n_bits 位精度）→ 整数表示 → FHE 计算
```

| `n_bits` | 精度 | 速度 | 适用场景 |
|---------|------|------|---------|
| 4 | 低 | 最快 | 原型验证 |
| 6 | 中 | 较快 | 常规应用 |
| 8 | 高 | 较慢 | 生产使用 |
| 16 | 很高 | 慢 | 高精度需求 |

## 执行模式

```python
# 明文执行（最快，用于开发调试）
result = model.predict(X, fhe="disable")

# 模拟模式（数值结果与真实 FHE 完全一致，但不加密，速度较快）
result = model.predict(X, fhe="simulate")

# 完整 FHE 执行（真正加密，生产使用）
result = model.predict(X, fhe="execute")
```

## 当前限制

| 限制 | 说明 |
|------|------|
| 精度上限 | 最高支持 16 位整数，量化可能略降低精度 |
| 加密训练 | 仅部分模型支持在加密数据上训练 |
| 预处理 | 不支持：文本数值化、降维、KNN、标准化等操作 |
| 速度 | FHE 推理比明文慢数百倍（取决于模型和 n_bits） |

## 技术栈

```
Concrete ML（机器学习框架）
    ↓ 调用
Concrete（FHE Python 编译器）
    ↓ 调用
TFHE-rs（底层 Rust FHE 库）
```

## 与 Concrete 的关系

- **Concrete ML**：高层框架，专为 ML 模型设计，封装了 FHE 细节，数据科学家可直接使用
- **Concrete**：底层编译器，Concrete ML 基于它构建，适合需要自定义 FHE 程序的开发者

## 参考资料

- [官方文档](https://docs.zama.ai/concrete-ml)
- [API 参考](https://docs.zama.org/concrete-ml/references/api)
- [GitHub 仓库](https://github.com/zama-ai/concrete-ml)
- [示例 Notebooks](https://docs.zama.ai/concrete-ml/tutorials)
- [客户端/服务端部署指南](https://docs.zama.ai/concrete-ml/guides/production-deployment)
- [社区论坛](https://community.zama.ai/)
