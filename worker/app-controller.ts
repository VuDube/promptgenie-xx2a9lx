import { DurableObject } from 'cloudflare:workers';
import type { SessionInfo, SyncQueueItem, Message } from './types';
import type { Env } from './core-utils';
export class AppController extends DurableObject<Env> {
  private sessions = new Map<string, SessionInfo>();
  private loaded = false;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      const stored = await this.ctx.storage.get<Record<string, SessionInfo>>('sessions') || {};
      this.sessions = new Map(Object.entries(stored));
      this.loaded = true;
    }
  }
  private async persist(): Promise<void> {
    await this.ctx.storage.put('sessions', Object.fromEntries(this.sessions));
  }
  async addSession(sessionId: string, title?: string): Promise<void> {
    await this.ensureLoaded();
    const now = Date.now();
    const existing = this.sessions.get(sessionId);
    this.sessions.set(sessionId, {
      id: sessionId,
      title: title || existing?.title || `Chat ${new Date(now).toLocaleDateString()}`,
      createdAt: existing?.createdAt || now,
      lastActive: now
    });
    await this.persist();
  }
  async removeSession(sessionId: string): Promise<boolean> {
    await this.ensureLoaded();
    const deleted = this.sessions.delete(sessionId);
    if (deleted) await this.persist();
    return deleted;
  }
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = Date.now();
      await this.persist();
    }
  }
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) {
      session.title = title;
      await this.persist();
      return true;
    }
    return false;
  }
  async listSessions(): Promise<SessionInfo[]> {
    await this.ensureLoaded();
    return Array.from(this.sessions.values()).sort((a, b) => b.lastActive - a.lastActive);
  }
  async getSessionCount(): Promise<number> {
    await this.ensureLoaded();
    return this.sessions.size;
  }
  async getSession(sessionId: string): Promise<SessionInfo | null> {
    await this.ensureLoaded();
    return this.sessions.get(sessionId) || null;
  }
  async clearAllSessions(): Promise<number> {
    await this.ensureLoaded();
    const count = this.sessions.size;
    this.sessions.clear();
    await this.persist();
    return count;
  }
  async processSyncQueue(queue: SyncQueueItem[]): Promise<{ success: boolean; processed: number; errors: string[] }> {
    await this.ensureLoaded();
    const errors: string[] = [];
    // Process settings first (last-write-wins)
    const settingsQueue = queue.filter(q => q.store === 'settings').sort((a, b) => a.timestamp - b.timestamp);
    if (settingsQueue.length > 0) {
      const lastSetting = settingsQueue[settingsQueue.length - 1];
      await this.ctx.storage.put('global_settings', lastSetting.data);
    }
    // Process conversations
    const convoQueue = queue.filter(q => q.store === 'conversations');
    for (const item of convoQueue) {
      try {
        if (item.action === 'create' || item.action === 'update') {
          await this.addSession(item.data.id, item.data.title);
        } else if (item.action === 'delete') {
          await this.removeSession(item.data.id);
        }
      } catch (e) {
        errors.push(`Failed to process conversation ${item.data.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
    // Group and process messages
    const messageQueue = queue.filter(q => q.store === 'messages' && q.action === 'create');
    const messagesByConvo = messageQueue.reduce((acc, q) => {
      const convoId = q.data.conversationId;
      if (!acc[convoId]) acc[convoId] = [];
      acc[convoId].push(q.data as Message);
      return acc;
    }, {} as Record<string, Message[]>);
    for(const convoId in messagesByConvo) {
        messagesByConvo[convoId].sort((a, b) => a.timestamp - b.timestamp);
    }
    const messagePromises = Object.entries(messagesByConvo).map(async ([sessionId, messages]) => {
      try {
        const agentStub = this.env.CHAT_AGENT.get(this.env.CHAT_AGENT.idFromName(sessionId));
        const importRequest = new Request('http://agent/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
        });
        const response = await agentStub.fetch(importRequest);
        if (!response.ok) {
          const respText = await response.text();
          throw new Error(`Agent for ${sessionId} returned status ${response.status}: ${respText}`);
        }
        const result = await response.json();
        if(!result.success) {
            throw new Error(`Agent for ${sessionId} failed to import messages.`);
        }
      } catch (e) {
        errors.push(`Failed to sync messages for conversation ${sessionId}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    });
    await Promise.all(messagePromises);
    await this.persist();
    if (errors.length > 0) {
      console.error("Sync errors occurred:", errors);
      return { success: false, processed: queue.length - errors.length, errors };
    }
    return { success: true, processed: queue.length, errors: [] };
  }
}