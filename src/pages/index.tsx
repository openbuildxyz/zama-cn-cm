import {
  Users,
  Calendar,
  MapPin,
  Zap,
  Star,
  Code,
  Shield,
  Cpu,
  Database,
  BookOpen,
  Globe,
  GitBranch,
  Rocket,
  DollarSign,
  Handshake,
  Lock,
  Network,
  Activity,
  Server,
  ServerCog,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './index.module.css';
import { SiTelegram, SiX } from 'react-icons/si';
import { Avatar, Image } from 'antd';
import EventSection from './events/section';
import { getDapps } from './api/dapp';
import ClientOnly from '../components/ClientOnly';

export default function Home() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [dapps, setDapps] = useState<any[]>([]);
  const pageSize = 20;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Removed stats - currently not used as the stats section is commented out
  const [particleStyles, setParticleStyles] = useState<Array<React.CSSProperties>>([]);

  const scrollGallery = (direction: 'left' | 'right') => {
    const container = document.querySelector(`.${styles.galleryContainer}`) as HTMLElement;
    if (container) {
      const scrollAmount = 312; // Width of one image (280px) plus gap (32px)
      const currentScroll = container.scrollLeft;

      let targetScroll;
      if (direction === 'left') {
        if (currentScroll <= scrollAmount) {
          targetScroll = 0;
        } else {
          targetScroll = currentScroll - scrollAmount;
        }
      } else {
        const maxScroll = container.scrollWidth - container.clientWidth;
        targetScroll = Math.min(maxScroll, currentScroll + scrollAmount);
      }

      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const fetchDapps = async () => {
      try {
        const params = {
          is_feature: 1,
          page: 1,
          page_size: pageSize,
        };
        const result = await getDapps(params);
        if (result.success && result.data && Array.isArray(result.data.dapps)) {
          setDapps(result.data.dapps);
        }
      } catch (error) {
        console.error("获取 DApps 列表失败:", error);
      }
    };
    fetchDapps();
  }, []);

  useEffect(() => {
    let animationFrame: number;
    const scrollContainer = scrollRef.current;

    const scroll = () => {
      if (scrollContainer && !isHovering) {
        scrollContainer.scrollLeft += 0.5;
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationFrame = requestAnimationFrame(scroll);
    };

    animationFrame = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrame);
  }, [isHovering]);


  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    const styles = [...Array(30)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${2 + Math.random() * 3}s`,
    }));
    setParticleStyles(styles);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const features = [
    {
      icon: <Lock className={styles.featureIcon} />,
      title: '全同态加密（FHE）',
      description: 'Zama 的 TFHE 方案支持在加密数据上进行任意计算，实现真正的数据隐私保护，无需解密即可运算',
    },
    {
      icon: <Shield className={styles.featureIcon} />,
      title: '隐私智能合约',
      description: '基于 fhEVM，开发者可在以太坊链上构建端到端加密的保密智能合约，保护用户链上隐私',
    },
    {
      icon: <Cpu className={styles.featureIcon} />,
      title: '高性能密码学',
      description: 'TFHE-rs 提供业界领先的 FHE 运算性能，经过深度优化的 Rust 实现支持快速密文计算',
    },
    {
      icon: <Code className={styles.featureIcon} />,
      title: '完整工具链',
      description: '从 Rust（TFHE-rs）、Python（Concrete / Concrete ML）到 Solidity（fhEVM），覆盖全场景 FHE 开发',
    },
  ];

  return (
    <div className={styles.homepage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroGradient}></div>
          <div
            className={styles.mouseGradient}
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(147, 51, 234, 0.15), transparent 40%)`,
            }}
          ></div>
        </div>

        <div className={styles.container}>
          <div
            className={`${styles.heroContent} ${isVisible ? styles.heroVisible : ''}`}
          >
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleSecondary}>Zama 中文社区</span>
            </h1>

            <div className={styles.titleDecoration}>
              <div className={styles.decorationGradient}></div>
              <div className={styles.decorationLine}></div>
            </div>
            <p className={styles.heroSubtitle}>
              <span className={styles.heroHighlight}>
                探索全同态加密 · 构建隐私应用 · 共建 Web3 隐私生态
              </span>
            </p>

            <div className={styles.heroGallery}>
              <button
                className={`${styles.galleryNavigation} ${styles.galleryNavPrev}`}
                onClick={() => scrollGallery('left')}
                aria-label="Previous images"
              >
                <ChevronLeft className={styles.galleryNavIcon} />
              </button>

              <div className={styles.galleryContainer}>
                {/* 示例图片，可替换为 Zama 社区活动图 */}
                <div className={styles.galleryImage}>
                  <Image
                    src="/community/cp1.jpg"
                    alt="Zama 社区活动1"
                    width={300}
                    height={195}
                    style={{ borderRadius: '14px' }}
                    preview={{ mask: false }}
                  />
                </div>
                <div className={styles.galleryImage}>
                  <Image
                    src="/community/cp2.jpg"
                    alt="Zama 社区活动2"
                    width={300}
                    height={195}
                    style={{ borderRadius: '14px' }}
                    preview={{ mask: false }}
                  />
                </div>
              </div>

              <button
                className={`${styles.galleryNavigation} ${styles.galleryNavNext}`}
                onClick={() => scrollGallery('right')}
                aria-label="Next images"
              >
                <ChevronRight className={styles.galleryNavIcon} />
              </button>
            </div>

            <div className={styles.heroButtons}>
              <Link href="https://zama.ai" target="_blank" className={styles.heroPrimaryButton}>
                <Globe className={styles.buttonIcon} />
                了解 Zama
              </Link>
              <Link href="/events" className={styles.heroSecondaryButton}>
                <Users className={styles.buttonIcon} />
                加入社区
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <EventSection />

      {/* Milestones Section */}
      <section className={styles.milestones}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Zama 里程碑</h2>
            <p className={styles.sectionDescription}>
              从密码学研究室到全球首家 FHE 独角兽，Zama 正在重新定义区块链隐私计算的边界
            </p>
          </div>
          <div className={styles.timeline}>
            <div className={styles.timelineLine}></div>

            <div className={`${styles.milestoneItem} ${styles.milestoneLeft}`}>
              <div className={styles.milestoneIcon}><Rocket size={22} color="#1f2937" /></div>
              <div className={styles.milestoneContent}>
                <div className={styles.milestoneDate}>
                  <span className={styles.milestoneDateBadge}><Calendar className={styles.milestoneDateIcon} />2020年1月</span>
                </div>
                <h3 className={styles.milestoneTitle}>Zama 正式成立</h3>
                <p className={styles.milestoneDescription}>
                  Rand Hindi 与密码学先驱 Pascal Paillier 联合创立 Zama。Pascal Paillier 于 1999 年发明了 Paillier 密码系统，是 FHE 领域奠基人之一。Rand Hindi 此前创立隐私 AI 公司 Snips 并被 Sonos 收购。
                </p>
              </div>
            </div>

            <div className={`${styles.milestoneItem} ${styles.milestoneRight}`}>
              <div className={styles.milestoneIcon}><Handshake size={22} color="#1f2937" /></div>
              <div className={styles.milestoneContent}>
                <div className={styles.milestoneDate}>
                  <span className={styles.milestoneDateBadge}><Calendar className={styles.milestoneDateIcon} />2022年1月</span>
                </div>
                <h3 className={styles.milestoneTitle}>与 Protocol Labs 达成战略合作</h3>
                <p className={styles.milestoneDescription}>
                  Zama 与 Protocol Labs（Filecoin 母公司）建立战略合作，联合探索 FHE 在去中心化存储与保密智能合约领域的落地应用，Filecoin 创始人 Juan Benet 成为重要支持者。
                </p>
              </div>
            </div>

            <div className={`${styles.milestoneItem} ${styles.milestoneLeft}`}>
              <div className={styles.milestoneIcon}><Zap size={22} color="#1f2937" /></div>
              <div className={styles.milestoneContent}>
                <div className={styles.milestoneDate}>
                  <span className={styles.milestoneDateBadge}><Calendar className={styles.milestoneDateIcon} />2023年9月</span>
                </div>
                <h3 className={styles.milestoneTitle}>fhEVM Alpha 版本发布</h3>
                <p className={styles.milestoneDescription}>
                  全球首个基于 FHE 的私有智能合约协议正式开源。开发者无需密码学背景，即可在以太坊 EVM 上用 Solidity 编写保密智能合约，交易数据与链上状态全程加密。
                </p>
              </div>
            </div>

            <div className={`${styles.milestoneItem} ${styles.milestoneRight}`}>
              <div className={styles.milestoneIcon}><DollarSign size={22} color="#1f2937" /></div>
              <div className={styles.milestoneContent}>
                <div className={styles.milestoneDate}>
                  <span className={styles.milestoneDateBadge}><Calendar className={styles.milestoneDateIcon} />2024年3月</span>
                </div>
                <h3 className={styles.milestoneTitle}>Series A 融资 7300 万美元</h3>
                <p className={styles.milestoneDescription}>
                  由 Multicoin Capital 和 Protocol Labs 领投，Gavin Wood（以太坊联创）、Anatoly Yakovenko（Solana 联创）、Juan Benet 等区块链先驱参投，成为当时 FHE 领域最大单笔融资。
                </p>
              </div>
            </div>

            <div className={`${styles.milestoneItem} ${styles.milestoneLeft}`}>
              <div className={styles.milestoneIcon}><Star size={22} color="#1f2937" /></div>
              <div className={styles.milestoneContent}>
                <div className={styles.milestoneDate}>
                  <span className={styles.milestoneDateBadge}><Calendar className={styles.milestoneDateIcon} />2025年6月</span>
                </div>
                <h3 className={styles.milestoneTitle}>Series B $5700 万，全球首个 FHE 独角兽 🦄</h3>
                <p className={styles.milestoneDescription}>
                  Pantera Capital 和 Blockchange Ventures 领投，估值突破 10 亿美元，总融资超 1.5 亿美元。Zama 成为全球 FHE 领域首家独角兽，同步发布 Zama 保密区块链协议。
                </p>
              </div>
            </div>

            <div className={`${styles.milestoneItem} ${styles.milestoneRight}`}>
              <div className={styles.milestoneIcon}><ServerCog size={22} color="#1f2937" /></div>
              <div className={styles.milestoneContent}>
                <div className={styles.milestoneDate}>
                  <span className={styles.milestoneDateBadge}><Calendar className={styles.milestoneDateIcon} />2025年7月</span>
                </div>
                <h3 className={styles.milestoneTitle}>保密区块链协议测试网上线</h3>
                <p className={styles.milestoneDescription}>
                  Zama Protocol 公开测试网正式启动，FHE 运算速度相比创立之初提升 100 倍，已可支持大多数链上支付场景，开发者可在以太坊上直接部署保密 DApp。
                </p>
              </div>
            </div>

            <div className={`${styles.milestoneItem} ${styles.milestoneLeft}`}>
              <div className={styles.milestoneIcon}><ShieldCheck size={22} color="#1f2937" /></div>
              <div className={styles.milestoneContent}>
                <div className={styles.milestoneDate}>
                  <span className={styles.milestoneDateBadge}><Calendar className={styles.milestoneDateIcon} />2025年9月</span>
                </div>
                <h3 className={styles.milestoneTitle}>与 OpenZeppelin 联合制定 ERC-7984 标准</h3>
                <p className={styles.milestoneDescription}>
                  Zama、OpenZeppelin 与 Inco 共同创立保密代币协会，推出 ERC-7984 保密代币标准，为保密 DeFi、RWA 代币化和机构级隐私合规提供行业基础设施。
                </p>
              </div>
            </div>

            <div className={`${styles.milestoneItem} ${styles.milestoneRight}`}>
              <div className={styles.milestoneIcon}><Network size={22} color="#1f2937" /></div>
              <div className={styles.milestoneContent}>
                <div className={styles.milestoneDate}>
                  <span className={styles.milestoneDateBadge}><Calendar className={styles.milestoneDateIcon} />2025年11月</span>
                </div>
                <h3 className={styles.milestoneTitle}>战略收购 KKRT Labs（Kakarot ZK）</h3>
                <p className={styles.milestoneDescription}>
                  收购 Vitalik Buterin 投资的 ZK Rollup 研究团队 KKRT Labs，整合零知识证明扩容技术，目标将链上保密交易吞吐量提升至每秒 10,000+ 笔。
                </p>
              </div>
            </div>

            <div className={`${styles.milestoneItem} ${styles.milestoneLeft}`}>
              <div className={styles.milestoneIcon}><Globe size={22} color="#1f2937" /></div>
              <div className={styles.milestoneContent}>
                <div className={styles.milestoneDate}>
                  <span className={styles.milestoneDateBadge}><Calendar className={styles.milestoneDateIcon} />2025年12月</span>
                </div>
                <h3 className={styles.milestoneTitle}>Zama Protocol 主网正式上线</h3>
                <p className={styles.milestoneDescription}>
                  以太坊主网正式支持保密智能合约部署，$ZAMA 代币开放质押，路线图覆盖其他 EVM 链（2026 H1）及 Solana（2026 H2），构建覆盖全链的隐私计算基础层。
                </p>
              </div>
            </div>

            <div className={`${styles.milestoneItem} ${styles.milestoneRight}`}>
              <div className={styles.milestoneIcon}><Activity size={22} color="#1f2937" /></div>
              <div className={styles.milestoneContent}>
                <div className={styles.milestoneDate}>
                  <span className={styles.milestoneDateBadge}><Calendar className={styles.milestoneDateIcon} />2026年2月</span>
                </div>
                <h3 className={styles.milestoneTitle}>$ZAMA 代币 Binance 上市</h3>
                <p className={styles.milestoneDescription}>
                  $ZAMA 在 Binance 正式上线交易，公开代币认领窗口开放。$ZAMA 是 Zama Protocol 的原生代币，用于支付保密计算费用、质押节点和参与协议治理。
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>核心技术</h2>
            <p className={styles.sectionDescription}>
              Zama 以全同态加密（FHE）为核心，为区块链隐私计算提供完整的工具链与技术栈，让开发者轻松构建隐私应用
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={`feature-${index}`} className={styles.featureCard}>
                <div className={styles.featureCardGlow}></div>
                <div className={styles.featureCardContent}>
                  <div className={styles.featureIconWrapper}>
                    {feature.icon}
                  </div>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDescription}>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Resources Section */}
      <section className={styles.resources}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>学习资源</h2>
            <p className={styles.sectionDescription}>
              通过文档、教程和示例代码，快速掌握 FHE 技术，探索 Zama 生态
            </p>
          </div>
          <div className={styles.resourcesGrid}>
            <div className={styles.resourceCard}>
              <BookOpen className={styles.resourceIcon} />
              <h3 className={styles.resourceTitle}>开发文档</h3>
              <p className={styles.resourceDesc}>
                完整的 Zama FHE 技术文档，包括 TFHE-rs、fhEVM 和 Concrete 的 API 参考
              </p>
            </div>
            <div className={styles.resourceCard}>
              <Code className={styles.resourceIcon} />
              <h3 className={styles.resourceTitle}>教程与示例</h3>
              <p className={styles.resourceDesc}>
                从零开始学习 FHE，丰富的代码示例帮助你快速上手隐私应用开发
              </p>
            </div>
            <div className={styles.resourceCard}>
              <Globe className={styles.resourceIcon} />
              <h3 className={styles.resourceTitle}>生态项目</h3>
              <p className={styles.resourceDesc}>
                探索基于 Zama FHE 技术构建的隐私 DApp 生态，发现前沿隐私计算应用
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Members Section */}

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>
              加入 Zama 中文社区 · 探索 FHE 的无限可能
            </h2>
            <p className={styles.ctaDesc}>
              无论你是密码学研究者，还是 Web3 开发者，
              Zama 中文社区都为你提供最前沿的 FHE 技术资源与交流平台。
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/events" className={styles.ctaPrimaryButton}>
                <Rocket className={styles.buttonIcon} />
                立即加入
              </Link>
              <Link href="https://t.me/zamacn" target="_blank" className={styles.ctaSecondaryButton}>
                <SiTelegram className={styles.buttonIcon} />
                加入 Telegram
              </Link>
              <Link href="https://x.com/zama_fhe" target="_blank" className={styles.ctaSecondaryButton}>
                <SiX className={styles.buttonIcon} />
                关注 X
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
