import { ChevronDown, Menu as MenuIcon } from 'lucide-react';
import { Image, Drawer } from 'antd';
import styles from '../styles/Header.module.css';
import Link from 'next/link';
import { Dropdown } from 'antd';
import Auth from './Auth';
import { useState, useMemo, useEffect } from 'react';
// import { SiWechat, SiX } from 'react-icons/si';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 使用 useMemo 确保 Auth 组件只创建一次，避免重复渲染
  const authComponent = useMemo(() => <Auth />, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 控制页面滚动锁定 - 仅在客户端执行
  useEffect(() => {
    if (!mounted) return;
    
    if (mobileMenuOpen) {
      // 保存当前滚动位置
      const scrollY = window.scrollY;

      // 锁定背景滚动
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      // 防止触摸滚动穿透，但允许菜单内滚动
      const preventTouchMove = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        // 检查是否在抽屉内部
        const drawerBody = document.querySelector('.ant-drawer-body');
        if (drawerBody && !drawerBody.contains(target)) {
          e.preventDefault();
        }
      };

      document.addEventListener('touchmove', preventTouchMove, { passive: false });

      return () => {
        document.removeEventListener('touchmove', preventTouchMove);
      };
    } else {
      // 恢复背景滚动
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';

      // 恢复滚动位置
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }, [mobileMenuOpen, mounted]);

  // const [showNewsBanner, setShowNewsBanner] = useState(true);
  // useEffect(() => {
  //   const handleScroll = () => {
  //     const scrollY = window.scrollY
  //     setShowNewsBanner(scrollY < 50) // 滚动超过50px时隐藏新闻栏
  //   }

  //   window.addEventListener("scroll", handleScroll)

  //   return () => {
  //     window.removeEventListener("scroll", handleScroll)
  //   }
  // }, [])

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerContent}>
          <Link href="/" passHref>
            <div className={styles.logoInfo} style={{ cursor: 'pointer' }}>
              <Image preview={false} width={120} src="/logo.svg" className={styles.logo} />
            </div>
          </Link>
          <nav className={styles.nav}>
            <Dropdown
              menu={{
                items: [
                  { key: 'dapps', label: <Link href="/ecosystem/dapps">Dapps 列表</Link> },
                ],
              }}
              placement="bottom"
              trigger={['hover']}
            >
              <div className={styles.navItem}>
                <span>生态系统</span>
                <ChevronDown className={styles.navIcon} />
              </div>
            </Dropdown>
            <Dropdown
              menu={{
                items: [
                  { key: 'docs', label: <Link href="/docs">中文开发文档</Link> },
                  { type: 'divider' },
                  { key: 'quickstart', label: <Link href="/docs/protocol/quick-start">Protocol 快速入门</Link> },
                  { key: 'solidity', label: <Link href="/docs/protocol/fhevm-contract">FHEVM 合约开发</Link> },
                  { key: 'relayer', label: <Link href="/docs/protocol/relayer-sdk">Relayer SDK 指引</Link> },
                  { type: 'divider' },
                  { key: 'examples', label: <Link href="/docs/examples/overview">实战示例</Link> },
                  { key: 'guides', label: <Link href="https://docs.zama.ai" target="_blank">Zama 官方文档</Link> },
                ],
              }}
              placement="bottom"
              trigger={['hover']}
            >
              <div className={styles.navItem}>
                <span>开发者支持</span>
                <ChevronDown className={styles.navIcon} />
              </div>
            </Dropdown>
            <Dropdown
              menu={{
                items: [
                  { key: 'hackathon', label: <Link href="/events?type=hackathon">黑客松</Link> },
                  { key: 'workshop', label: <Link href="/events?type=workshop">Workshop</Link> },
                  { key: 'ama', label: <Link href="/events?type=ama">AMA</Link> },
                  { key: 'meetup', label: <Link href="/events?type=meetup">社区聚会</Link> },
                  { key: 'posts', label: <Link href="/posts">社区帖子</Link> },
                ],
              }}
              placement="bottom"
              trigger={['hover']}
            >
              <div className={styles.navItem}>
                <span>社区活动</span>
                <ChevronDown className={styles.navIcon} />
              </div>
            </Dropdown>
            <Dropdown
              menu={{
                items: [
                  { key: 'blog', label: <Link href="/blogs">博客</Link> },
                  { key: 'litepaper', label: <Link href="https://docs.zama.ai/protocol" target="_blank">Protocol Litepaper</Link> },
                  { type: 'divider' },
                  { key: 'forum', label: <Link href="https://community.zama.ai" target="_blank">Community Forum</Link> },
                  { key: 'discord', label: <Link href="https://discord.com/invite/zama" target="_blank">Discord</Link> },
                ],
              }}
              placement="bottom"
              trigger={['hover']}
            >
              <div className={styles.navItem}>
                <span>官方资源</span>
                <ChevronDown className={styles.navIcon} />
              </div>
            </Dropdown>
            {authComponent}
          </nav>

          {/* 移动端导航 */}
          <div className={styles.mobileNav}>
            {authComponent}
            <button
              className={styles.mobileMenuButton}
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon className={styles.mobileMenuIcon} />
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单抽屉 */}
      <Drawer
        title={
          <div style={{
            background: 'linear-gradient(135deg, #1f2937, #FFCE44)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}>
            导航菜单
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        styles={{
          body: { padding: '1.5rem 1rem' },
          header: { borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }
        }}
      >
        <div className={styles.mobileMenuContent}>
          <div className={styles.mobileMenuSection}>
            <h3 className={styles.mobileMenuSectionTitle}>生态系统</h3>
            <div className={styles.mobileMenuLinks}>
              <Link href="/ecosystem/dapps" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>🏗️</span>
                <span>Dapps 列表</span>
              </Link>
            </div>
          </div>

          <div className={styles.mobileMenuSection}>
            <h3 className={styles.mobileMenuSectionTitle}>开发者支持</h3>
            <div className={styles.mobileMenuLinks}>
              <Link href="/docs" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>📖</span>
                <span>中文开发文档</span>
              </Link>
              <Link href="/docs/protocol/quick-start" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>🚀</span>
                <span>Protocol 快速入门</span>
              </Link>
              <Link href="/docs/protocol/fhevm-contract" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>📝</span>
                <span>FHEVM 合约开发</span>
              </Link>
              <Link href="/docs/protocol/relayer-sdk" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>🔗</span>
                <span>Relayer SDK 指引</span>
              </Link>
              <Link href="/docs/examples/overview" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>💡</span>
                <span>实战示例</span>
              </Link>
              <Link href="https://docs.zama.ai" target="_blank" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>⚙️</span>
                <span>Zama 官方文档</span>
              </Link>
            </div>
          </div>

          <div className={styles.mobileMenuSection}>
            <h3 className={styles.mobileMenuSectionTitle}>社区活动</h3>
            <div className={styles.mobileMenuLinks}>
              <Link href="/events?type=hackathon" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>🏆</span>
                <span>黑客松</span>
              </Link>
              <Link href="/events?type=workshop" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>🎯</span>
                <span>Workshop</span>
              </Link>
              <Link href="/events?type=ama" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>💬</span>
                <span>AMA</span>
              </Link>
              <Link href="/events?type=meetup" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>🤝</span>
                <span>社区聚会</span>
              </Link>
              <Link href="/posts" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>📌</span>
                <span>社区帖子</span>
              </Link>
            </div>
          </div>

          <div className={styles.mobileMenuSection}>
            <h3 className={styles.mobileMenuSectionTitle}>官方资源</h3>
            <div className={styles.mobileMenuLinks}>
              <Link href="/blogs" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>📝</span>
                <span>博客</span>
              </Link>
              <Link href="https://docs.zama.ai/protocol" target="_blank" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>📄</span>
                <span>Protocol Litepaper</span>
              </Link>
              <Link href="https://community.zama.ai" target="_blank" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>🌐</span>
                <span>Community Forum</span>
              </Link>
              <Link href="https://discord.com/invite/zama" target="_blank" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                <span>💬</span>
                <span>Discord</span>
              </Link>
            </div>
          </div>
        </div>
      </Drawer>
    </header>
  );
}
