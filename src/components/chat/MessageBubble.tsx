import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Bot, User, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}
export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }, () => {
      toast.error('Failed to copy.');
    });
  };
  return (
    <div className={cn('flex items-start gap-4 w-full', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex-shrink-0 size-8 rounded-full bg-cyber-card flex items-center justify-center text-cyber-accent">
          <Bot className="size-5" />
        </div>
      )}
      <div
        className={cn(
          'relative group max-w-2xl w-fit rounded-2xl p-4 prose prose-invert prose-sm text-foreground',
          isUser
            ? 'bg-cyber-accent text-white rounded-br-lg'
            : 'bg-cyber-card border border-white/10 rounded-bl-lg'
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const codeText = String(children).replace(/\n$/, '');
              return match ? (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-50 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy(codeText)}
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {codeText}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      {isUser && (
        <div className="flex-shrink-0 size-8 rounded-full bg-muted flex items-center justify-center">
          <User className="size-5" />
        </div>
      )}
    </div>
  );
}