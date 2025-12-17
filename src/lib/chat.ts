import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import type { Message, ChatState, ToolCall, WeatherResult, MCPResult, ErrorResult, SessionInfo, SyncQueueItem } from '../../worker/types';
import { formatDistanceToNow } from 'date-fns';
export const formatTime = (ts: number): string =>
  formatDistanceToNow(ts, { addSuffix: true });

export interface ChatResponse {
  success: boolean;
  data?: ChatState;
  error?: string;
}
export const MODELS = [
  { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', name: 'Llama 3.3 70B (Cloudflare)', provider: 'cloudflare' },
  { id: '@cf/deepseek-ai/deepseek-coder-7b-instruct-v1.5', name: 'DeepSeek Coder 7B (Cloudflare)', provider: 'cloudflare' },
  { id: 'openai/gpt-4o', name: 'GPT-4o (Premium)', provider: 'openai' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Premium)', provider: 'anthropic' },
  { id: 'gemini/gemini-1.5-flash', name: 'Gemini 1.5 Flash (Premium)', provider: 'gemini' },
];
export const routePrompt = (query: string, currentModel: string): string => {
  const modelInfo = MODELS.find(m => m.id === currentModel);
  if (modelInfo && modelInfo.provider !== 'cloudflare') {
    return currentModel; // User has selected a premium model, don't override
  }
  const lowerQuery = query.toLowerCase();
  const codeKeywords = ['code', 'javascript', 'python', 'typescript', 'react', 'node.js', 'function', 'component', 'api', 'sql'];
  if (codeKeywords.some(keyword => lowerQuery.includes(keyword))) {
    console.log("Routing to DeepSeek Coder...");
    return '@cf/deepseek-ai/deepseek-coder-7b-instruct-v1.5';
  }
  console.log("Routing to Llama 3.3...");
  return '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
};
class ChatService {
  private sessionId: string;
  private baseUrl: string;
  public freeTierRequests = 0;
  public readonly FREE_TIER_LIMIT = 100;
  constructor() {
    this.sessionId = crypto.randomUUID();
    this.baseUrl = `/api/chat/${this.sessionId}`;
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('promptgenie-last-reset-date');
    if (lastReset !== today) {
      localStorage.setItem('promptgenie-last-reset-date', today);
      localStorage.setItem('promptgenie-free-requests', '0');
      this.freeTierRequests = 0;
    } else {
      this.freeTierRequests = Number(localStorage.getItem('promptgenie-free-requests') ?? '0');
    }
  }
  async sendMessage(
    message: string,
    model: string,
    userApiKeys?: Record<string, string>,
    onChunk?: (chunk: string) => void
  ): Promise<ChatResponse> {
    const modelInfo = MODELS.find(m => m.id === model);
    const provider = modelInfo?.provider || 'cloudflare';
    // Handle Premium Models with User API Keys
    if (provider !== 'cloudflare') {
      const apiKey = userApiKeys?.[provider];
      if (!apiKey) {
        const errorMsg = `API key for ${provider} is missing. Please add it in Settings.`;
        onChunk?.(errorMsg);
        return { success: false, error: errorMsg };
      }
      try {
        if (provider === 'openai') {
          const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
          const stream = await openai.chat.completions.create({
            model: model.split('/')[1],
            messages: [{ role: 'user', content: message }],
            stream: true,
          });
          for await (const chunk of stream) {
            onChunk?.(chunk.choices[0]?.delta?.content || '');
          }
        } else if (provider === 'anthropic') {
            const anthropic = new Anthropic({ apiKey });
            const stream = await anthropic.messages.stream({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 1024,
                messages: [{ role: 'user', content: message }],
            });
            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                    onChunk?.(chunk.delta.text);
                }
            }
        }
        // Gemini would be similar with its SDK/fetch
        return { success: true };
      } catch (error) {
        console.error(`Error with ${provider} API:`, error);
        const errorMsg = `Failed to get response from ${provider}. Check your API key and network.`;
        onChunk?.(errorMsg);
        return { success: false, error: errorMsg };
      }
    }
    // Handle Cloudflare Free Tier
    if (this.freeTierRequests >= this.FREE_TIER_LIMIT) {
      const errorMsg = 'Cloudflare free tier limit reached for today.';
      onChunk?.(errorMsg);
      return { success: false, error: errorMsg };
    }
    this.freeTierRequests++;
    localStorage.setItem('promptgenie-free-requests', this.freeTierRequests.toString());
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model, stream: !!onChunk }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (onChunk && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            onChunk(decoder.decode(value, { stream: true }));
          }
        } finally {
          reader.releaseLock();
        }
        return { success: true };
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to send message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }
  async testApiKey(provider: string, key: string): Promise<boolean> {
    // This is a mock test. A real implementation would make a simple API call.
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(key.length > 10); // Simple validation
      }, 1000);
    });
  }
  async syncChanges(queue: SyncQueueItem[]): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to sync changes:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Sync failed' };
    }
  }
  async getMessages(): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get messages:', error);
      return { success: false, error: 'Failed to load messages' };
    }
  }
  switchSession(sessionId: string): void {
    this.sessionId = sessionId;
    this.baseUrl = `/api/chat/${sessionId}`;
  }
  async updateModel(model: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to update model:', error);
      return { success: false, error: 'Failed to update model' };
    }
  }
}
export const chatService = new ChatService();