import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="zh-CN">
      <Head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
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
