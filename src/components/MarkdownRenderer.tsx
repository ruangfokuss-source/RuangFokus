import React, { useState } from 'react';
import { marked } from 'marked';
import { Check, Copy, Code as CodeIcon } from 'lucide-react';
import { copyToClipboard } from '../utils/chatUtils';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

// Custom code block component with copy button and language badge
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayLang = language || 'code';

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-slate-700/80 bg-[#121620] shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1a202c] border-b border-slate-700/60 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
          <CodeIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>{displayLang}</span>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-300 hover:text-white hover:bg-slate-700/70 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[13px] leading-relaxed font-mono text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
  // Parse content into parts separating code blocks from standard markdown
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore.trim()) {
      const html = marked.parse(textBefore, { breaks: true, gfm: true }) as string;
      parts.push(
        <div
          key={`text-${lastIndex}`}
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    const language = match[1] || '';
    const code = match[2] || '';
    parts.push(
      <CodeBlock
        key={`code-${match.index}`}
        language={language}
        code={code}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text
  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    // If we're streaming and there is an unclosed code block at the end (e.g. ```typescript ... without closing ```)
    if (remainingText.startsWith('```')) {
      const firstLineBreak = remainingText.indexOf('\n');
      const lang = firstLineBreak !== -1 ? remainingText.slice(3, firstLineBreak).trim() : '';
      const incompleteCode = firstLineBreak !== -1 ? remainingText.slice(firstLineBreak + 1) : '';
      parts.push(
        <CodeBlock
          key="code-incomplete"
          language={lang}
          code={incompleteCode}
        />
      );
    } else {
      const html = marked.parse(remainingText, { breaks: true, gfm: true }) as string;
      parts.push(
        <div
          key={`text-end`}
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
  }

  return (
    <div className={`space-y-1.5 ${isStreaming ? 'streaming-cursor' : ''}`}>
      {parts.length === 0 && !isStreaming ? (
        <span className="text-slate-400 italic">No content</span>
      ) : (
        parts
      )}
    </div>
  );
};
