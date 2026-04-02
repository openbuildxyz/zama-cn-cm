import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

// 注册 Solidity 语言（highlight.js 内置支持，直接使用）
// Solidity 可用 javascript 模式作为降级

marked.use(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      // Solidity 降级到 javascript 高亮
      const language = hljs.getLanguage(lang) ? lang
        : lang === 'solidity' ? 'javascript'
        : lang === 'bash' || lang === 'shell' || lang === 'sh' ? 'bash'
        : 'plaintext';
      return hljs.highlight(code, { language, ignoreIllegals: true }).value;
    },
  })
);

marked.use({
  gfm: true,
  breaks: false,
});

export interface MarkdownParseOptions {
  breaks?: boolean;
  gfm?: boolean;
  sanitize?: boolean;
  [key: string]: unknown;
}

export async function parseMarkdown(content: string, _options?: MarkdownParseOptions): Promise<string> {
  return await marked(content);
}

export async function sanitizeMarkdown(content: string): Promise<string> {
  return await marked(content);
}

export function parseMarkdownToTokens(content: string) {
  return marked.lexer(content);
}

export function extractHeadings(content: string): Array<{ level: number; text: string; id?: string }> {
  const tokens = parseMarkdownToTokens(content);
  const headings: Array<{ level: number; text: string; id?: string }> = [];
  const idCounts = new Map<string, number>();

  tokens.forEach(token => {
    if (token.type === 'heading') {
      let cleanText = (token.text as string).replace(/<[^>]*>/g, '').trim();
      cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '$1');
      cleanText = cleanText.replace(/\*(.*?)\*/g, '$1');
      cleanText = cleanText.replace(/__(.*?)__/g, '$1');
      cleanText = cleanText.replace(/_(.*?)_/g, '$1');
      cleanText = cleanText.replace(/`(.*?)`/g, '$1');
      cleanText = cleanText.replace(/&#x20;/g, ' ').trim();

      let baseId = cleanText
        .toLowerCase()
        .trim()
        .replace(/[\s]+/g, '-')
        .replace(/[^\w\-\u4e00-\u9fa5]/g, '');

      if (!baseId) baseId = 'heading';

      const count = idCounts.get(baseId) || 0;
      idCounts.set(baseId, count + 1);

      const finalId = count > 0 ? `${baseId}-${count}` : baseId;

      headings.push({
        level: token.depth,
        text: cleanText,
        id: finalId,
      });
    }
  });

  return headings;
}

export function extractText(content: string): string {
  const tokens = parseMarkdownToTokens(content);
  let text = '';

  const extractTokenText = (token: { type: string; text?: string; items?: { type: string; text?: string }[] }): string => {
    switch (token.type) {
      case 'list':
        return (token.items || []).map(item => extractTokenText(item)).join(' ');
      default:
        return token.text || '';
    }
  };

  tokens.forEach(token => {
    text += extractTokenText(token) + ' ';
  });

  return text.trim();
}

export function getTableOfContents(content: string): Array<{ level: number; text: string; id: string }> {
  return extractHeadings(content)
    .filter(h => h.level >= 2 && h.level <= 4)
    .map(h => ({ level: h.level, text: h.text, id: h.id || '' }));
}
