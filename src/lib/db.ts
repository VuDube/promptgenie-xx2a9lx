import Dexie, { type Table } from 'dexie';
export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}
export interface Message {
  id:string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
export interface PromptTemplate {
  id: string;
  title: string;
  framework: string;
  category: string;
  content: string;
}
export interface Settings {
  id?: number;
  preferredModel: string;
  lastSync: number;
  autoSync: boolean;
  errorsLog?: string[];
  userApiKeys?: Record<string, string>;
}
export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  store: 'conversations' | 'messages' | 'settings';
  data: any;
  timestamp: number;
}
export class PromptGenieDatabase extends Dexie {
  conversations!: Table<Conversation>;
  messages!: Table<Message>;
  templates!: Table<PromptTemplate>;
  settings!: Table<Settings>;
  syncQueue!: Table<SyncQueueItem>;
  constructor() {
    super('PromptGenieDatabase');
    this.version(3).stores({
      conversations: 'id, title, updatedAt',
      messages: 'id, conversationId, timestamp',
      templates: 'id, title, category, framework',
      settings: '++id',
      syncQueue: 'id, timestamp',
    });
  }
}
export const db = new PromptGenieDatabase();