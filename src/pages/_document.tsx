import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="zh-CN">
      <Head>
        {/* OpenGraph Meta Tags */}
        <meta property="og:title" content="Zama 中文社区" />
        <meta
          property="og:description"
          content="加入我们, 一起了解、参与、共建 Zama FHE 中文社区"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="" />
        <meta property="og:image" content="" />
        <meta property="og:site_name" content="Zama 中文社区" />

      </Head>
      <body style={{ backgroundColor: '#ffffff' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
