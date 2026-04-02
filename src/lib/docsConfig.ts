export interface DocItem {
  slug: string;
  title: string;
}

export interface DocGroup {
  type: 'group';
  title: string;
  children: (DocItem | DocGroup)[];
}

export interface DocCategory {
  id: string;
  title: string;
  docs?: DocItem[];
  groups?: DocGroup[];
}

const docsCategories: DocCategory[] = [
  {
    id: 'protocol',
    title: 'Protocol 开发指南',
    docs: [
      { slug: 'protocol/quick-start', title: '快速入门教程' },
      { slug: 'protocol/fhevm-contract', title: '改造为 FHEVM 合约' },
      { slug: 'protocol/relayer-sdk', title: 'Relayer SDK 使用指南' },
    ],
  },
  {
    id: 'introduction',
    title: '入门介绍',
    docs: [
      { slug: 'introduction/what-is-zama', title: '什么是 Zama？' },
      { slug: 'introduction/fhe-basics', title: 'FHE 基础概念' },
    ],
  },
  {
    id: 'tfhe-rs',
    title: 'TFHE-rs',
    docs: [
      { slug: 'tfhe-rs/overview', title: '概述' },
      { slug: 'tfhe-rs/quick-start', title: '快速入门' },
      { slug: 'tfhe-rs/security', title: '安全性与密码学' },
    ],
  },
  {
    id: 'fhevm',
    title: 'fhEVM',
    docs: [
      { slug: 'fhevm/overview', title: '概述' },
      { slug: 'fhevm/solidity-guide', title: 'Solidity 开发指南' },
    ],
  },
  {
    id: 'concrete',
    title: 'Concrete',
    docs: [
      { slug: 'concrete/overview', title: '概述' },
    ],
  },
  {
    id: 'concrete-ml',
    title: 'Concrete ML',
    docs: [
      { slug: 'concrete-ml/overview', title: '概述' },
      { slug: 'concrete-ml/quick-start', title: '快速入门' },
    ],
  },
  {
    id: 'examples',
    title: '实战示例',
    docs: [
      { slug: 'examples/overview', title: '示例概览' },
      { slug: 'examples/fhe-counter', title: 'FHE 计数器' },
      { slug: 'examples/sealed-bid-auction', title: '密封竞价拍卖' },
      { slug: 'examples/confidential-token', title: '保密代币 ERC7984' },
    ],
  },
];

export function getDocsByCategory(): DocCategory[] {
  return docsCategories;
}

export function findDocCategory(slug: string): { category: DocCategory; doc: DocItem } | undefined {
  for (const category of docsCategories) {
    if (category.docs) {
      const doc = category.docs.find(d => d.slug === slug);
      if (doc) return { category, doc };
    }
    if (category.groups) {
      const result = searchGroups(category, category.groups, slug);
      if (result) return result;
    }
  }
  return undefined;
}

function searchGroups(
  category: DocCategory,
  groups: DocGroup[],
  slug: string
): { category: DocCategory; doc: DocItem } | undefined {
  for (const group of groups) {
    for (const child of group.children) {
      if ('slug' in child && child.slug === slug) {
        return { category, doc: child };
      }
      if ('type' in child && child.type === 'group') {
        const result = searchGroups(category, [child], slug);
        if (result) return result;
      }
    }
  }
  return undefined;
}
