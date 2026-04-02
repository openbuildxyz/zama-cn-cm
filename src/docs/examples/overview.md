# 实战示例概览

本节提供基于 Zama FHEVM 的完整实战代码示例，涵盖从基础操作到复杂 DeFi 场景的完整实现。所有示例均可直接在 [FHEVM Hardhat 模板](https://github.com/zama-ai/fhevm-hardhat-template) 中运行。

## 基础示例

### [FHE 计数器](./fhe-counter)

最基础的 FHEVM 入门示例。对比普通计数器与 FHE 加密计数器的实现，展示如何使用 `euint32`、`FHE.add()`、`FHE.fromExternal()` 以及 FHE 权限授予。

**适合**：FHEVM 初学者，理解加密类型与明文类型的差异。

---

## 进阶示例

### [密封竞价拍卖](./sealed-bid-auction)

完整的链上 NFT 保密拍卖合约。出价全程加密，拍卖结束后通过公开解密揭晓胜者，非胜者可退款。

**技术点**：`euint64`、`eaddress`、`FHE.select()`、`FHE.makePubliclyDecryptable()`、ERC7984 保密代币支付、ReentrancyGuard。

**适合**：DeFi 开发者，构建链上隐私竞价、暗标投票等场景。

---

### [保密代币 ERC7984](./confidential-token)

基于 OpenZeppelin 保密合约库的 ERC7984 标准实现。余额与转账金额全程加密，同时保持标准 ERC20 接口兼容性。

**技术点**：`ERC7984`、加密 `mint`、`confidentialTransfer`、`confidentialBalanceOf`。

**适合**：需要构建隐私支付、保密稳定币、私密 RWA 代币化的开发者。

---

## 快速开始

所有示例均基于同一套开发环境：

```bash
# 克隆 FHEVM Hardhat 模板
git clone https://github.com/zama-ai/fhevm-hardhat-template my-project
cd my-project
npm install

# 将示例的 .sol 文件放入 contracts/
# 将示例的 .ts 文件放入 test/

# 编译
npx hardhat compile

# 测试
npx hardhat test
```

> 更多示例持续更新中，欢迎加入 [Discord](https://discord.com/invite/zama) 或 [Community Forum](https://community.zama.ai) 交流。
