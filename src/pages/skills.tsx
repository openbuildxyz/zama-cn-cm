import { useState, useEffect } from 'react';
import { message } from 'antd';
import styles from './skills.module.css';

const skills = [
  {
    name: 'zama.md',
    title: 'Zama Overview & Ecosystem',
    desc: '公司概览、产品矩阵、生态项目、关键链接',
    url: '/skills/zama.md',
  },
  {
    name: 'zama-fhevm.md',
    title: 'fhEVM — Solidity Contract Dev',
    desc: '加密类型、FHE 操作、访问控制、合约模式、安全 Checklist',
    url: '/skills/zama-fhevm.md',
  },
  {
    name: 'zama-sdk.md',
    title: 'Relayer SDK & Hardhat Testing',
    desc: '前端加密输入、userDecrypt、publicDecrypt、Hardhat 测试',
    url: '/skills/zama-sdk.md',
  },
  {
    name: 'zama-tfhers.md',
    title: 'TFHE-rs — Rust Library',
    desc: 'Rust FHE 类型、运算、密钥管理、客户端/服务端模式',
    url: '/skills/zama-tfhers.md',
  },
];

export default function SkillsPage() {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(`${origin}${url}`);
    message.success('链接已复制');
  };

  return (
    <div className={`${styles.page} nav-t-top`}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.badge}>🤖 AI Agent Skills</div>
          <h1 className={styles.title}>Zama FHE Knowledge Base</h1>
          <p className={styles.subtitle}>
            将以下 Markdown 链接提供给 AI Agent，让 Agent 快速掌握 Zama FHE 技术栈
          </p>
        </div>

        <div className={styles.list}>
          {skills.map((skill) => (
            <div key={skill.name} className={styles.item}>
              <div className={styles.itemInfo}>
                <div className={styles.itemName}>{skill.title}</div>
                <div className={styles.itemDesc}>{skill.desc}</div>
                <code className={styles.itemUrl}>{origin}{skill.url}</code>
              </div>
              <div className={styles.itemActions}>
                <a
                  href={skill.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnSecondary}
                >
                  预览
                </a>
                <button
                  className={styles.btnPrimary}
                  onClick={() => copyUrl(skill.url)}
                >
                  复制链接
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
