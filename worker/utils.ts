import type { Message } from './types';
export const createMessage = (role: 'user' | 'assistant', content: string, conversationId: string, toolCalls?: any[]): Message => ({
  id: crypto.randomUUID(),
  role,
  content,
  timestamp: Date.now(),
  conversationId,
  ...(toolCalls && { toolCalls })
});
export const createStreamResponse = (readable: ReadableStream) => new Response(readable, {
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  },
});
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const createEncoder = () => new TextEncoder();