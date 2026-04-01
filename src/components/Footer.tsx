import { Image } from 'antd'
import styles from "../styles/Footer.module.css"

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <div className={styles.footerLogo}>
              <Image preview={false} width={24} src="/logo.svg" className={styles.logo} />
              <span className={styles.footerLogoTitle}>Zama 中文社区</span>
            </div>
            <p className={styles.footerDescription}>
              Zama 中文社区是全同态加密（FHE）技术爱好者与 Web3 隐私开发者的聚集地，致力于推广 Zama 生态与隐私计算文化。
            </p>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.footerCopyright}>
            &copy; 2025 Zama 中文社区. 保留所有权利
          </p>
        </div>
      </div>
    </footer>
  )
}
