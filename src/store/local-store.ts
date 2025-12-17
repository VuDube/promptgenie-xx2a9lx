import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db, type Conversation, type Message, type PromptTemplate, type Settings, type SyncQueueItem } from '@/lib/db';
import { INITIAL_TEMPLATES } from '@/lib/seed-data';
import { liveQuery } from 'dexie';
import { chatService, routePrompt } from '@/lib/chat';
import { toast } from 'sonner';
interface LocalState {
  // UI State
  isSidebarOpen: boolean;
  activeConversationId: string | null;
  // AI & Model State
  cloudMode: boolean;
  currentModel: string;
  isGenerating: boolean;
  streamingContent: string;
  syncPendingCount: number;
  // Sync watcher
  watcherUnsub: (() => void) | null;
  // Data State
  conversations: Conversation[];
  templates: PromptTemplate[];
  settings: Settings | null;
  // Actions
  toggleSidebar: () => void;
  setActiveConversationId: (id: string | null) => void;
  // AI & Model Actions
  setCloudMode: (isCloud: boolean) => void;
  updateModel: (modelId: string) => void;
  setGenerating: (status: boolean) => void;
  appendStream: (chunk: string) => void;
  clearStream: () => void;
  routeToAI: (conversationId: string, prompt: string) => Promise<void>;
  generateMockResponse: (conversationId: string, prompt: string) => Promise<void>;
  // Sync Actions
  triggerSync: () => Promise<void>;
  initSyncWatcher: () => void;
  // DB Initialization
  initializeDatabase: () => Promise<void>;
  // Conversation Actions
  loadConversations: () => void;
  createNewConversation: (title: string) => Promise<string>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  // Message Actions
  getMessagesForConversation: (conversationId: string) => ReturnType<typeof liveQuery>;
  addMessage: (message: Omit<Message, 'id'>) => Promise<void>;
  // Template Actions
  loadTemplates: () => void;
  // Settings Actions
  loadSettings: () => void;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
}
export const useLocalStore = create<LocalState>((set, get) => ({
  // Initial State
  isSidebarOpen: false,
  activeConversationId: null,
  conversations: [],
  templates: [],
  settings: null,
  cloudMode: false,
  currentModel: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  isGenerating: false,
  streamingContent: '',
  syncPendingCount: 0,
  watcherUnsub: null,
  // UI Actions
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  // AI & Model Actions
  setCloudMode: (isCloud) => set({ cloudMode: isCloud }),
  updateModel: (modelId) => set({ currentModel: modelId, cloudMode: true }),
  setGenerating: (status) => set({ isGenerating: status }),
  appendStream: (chunk) => set((state) => ({ streamingContent: state.streamingContent + chunk })),
  clearStream: () => set({ streamingContent: '' }),
  routeToAI: async (conversationId, prompt) => {
    const { cloudMode, generateMockResponse, appendStream, addMessage, settings, currentModel } = get();
    set({ isGenerating: true, streamingContent: '' });
    if (cloudMode) {
      chatService.switchSession(conversationId);
      const selectedModel = routePrompt(prompt, currentModel);
      await chatService.updateModel(selectedModel);
      await chatService.sendMessage(prompt, selectedModel, settings?.userApiKeys, (chunk) => {
        appendStream(chunk);
      });
      const finalContent = get().streamingContent;
      await addMessage({
        conversationId,
        role: 'assistant',
        content: finalContent,
        timestamp: Date.now(),
      });
    } else {
      await generateMockResponse(conversationId, prompt);
    }
    set({ isGenerating: false, streamingContent: '' });
  },
  generateMockResponse: async (conversationId, prompt) => {
    const mockResponse = `This is a simulated local response for your prompt:\n\n> "${prompt.substring(0, 100)}..."\n\nTo get a real response from a powerful AI model, please switch to Cloud Mode in the header. This local mode is for offline use and demonstration purposes.`;
    const chunks = mockResponse.split(' ');
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 30));
      get().appendStream(chunk + ' ');
    }
    await get().addMessage({
      conversationId,
      role: 'assistant',
      content: get().streamingContent,
      timestamp: Date.now(),
    });
  },
  // Sync Actions
  triggerSync: async () => {
    if (!navigator.onLine) {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        // Ensure the registration actually supports the SyncManager API
        if ('sync' in registration) {
          try {
            // Cast to any to avoid TS2339 – “sync” is not on the type definition
            await (registration as any).sync.register('promptgenie-sync');
            toast.info('Offline. Sync queued for when you are back online.');
          } catch (err) {
            toast.error('Background sync could not be registered.');
            console.error('Background sync registration failed:', err);
          }
        } else {
          // Gracefully handle browsers that lack background‑sync support
          toast.error('Background sync not supported in this browser');
        }
      } else {
        toast.error('Offline and background sync is not available.');
      }
      return;
    }
    const queue = await db.syncQueue.toArray();
    if (queue.length === 0) {
      toast.info('Everything is already up to date.');
      await get().updateSettings({ lastSync: Date.now() });
      return;
    }
    toast.loading('Syncing with the cloud...');
    try {
      const result = await chatService.syncChanges(queue);
      if (result.success) {
        await db.syncQueue.clear();
        await get().updateSettings({ lastSync: Date.now() });
        toast.success('Sync complete!');
      } else {
        throw new Error(result.error || 'Unknown sync error');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      await get().updateSettings({ errorsLog: [...(get().settings?.errorsLog || []), errorMessage] });
      toast.error(`Sync failed: ${errorMessage}`);
    }
  },
  initSyncWatcher: () => {
    const { watcherUnsub } = get();
    if (watcherUnsub) return;
    const subscription = liveQuery(() => db.syncQueue.count()).subscribe({
      next: (count) => set({ syncPendingCount: count ?? 0 }),
      error: (err) => console.error('Sync watcher error:', err),
    });
    set({ watcherUnsub: () => subscription.unsubscribe() });
  },
  // DB Initialization
  initializeDatabase: async () => {
    try {
      const templateCount = await db.templates.count();
      if (templateCount === 0) {
        console.log('Seeding initial prompt templates...');
        const templatesWithIds = INITIAL_TEMPLATES.map(t => ({ ...t, id: uuidv4() }));
        await db.templates.bulkAdd(templatesWithIds);
      }
      get().loadConversations();
      get().loadTemplates();
      get().loadSettings();
      get().initSyncWatcher();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  },
  // Conversation Actions
  loadConversations: async () => {
    const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray();
    set({ conversations });
  },
  createNewConversation: async (title) => {
    const newConversation: Conversation = {
      id: uuidv4(),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.transaction('rw', db.conversations, db.syncQueue, async () => {
      await db.conversations.add(newConversation);
      await db.syncQueue.add({
        id: uuidv4(),
        action: 'create',
        store: 'conversations',
        data: newConversation,
        timestamp: Date.now(),
      });
    });
    get().loadConversations();
    return newConversation.id;
  },
  updateConversationTitle: async (id, title) => {
    const updatedAt = Date.now();
    await db.transaction('rw', db.conversations, db.syncQueue, async () => {
      await db.conversations.update(id, { title, updatedAt });
      await db.syncQueue.add({
        id: uuidv4(),
        action: 'update',
        store: 'conversations',
        data: { id, title, updatedAt },
        timestamp: updatedAt,
      });
    });
    get().loadConversations();
  },
  deleteConversation: async (id: string) => {
    await db.transaction('rw', db.conversations, db.messages, db.syncQueue, async () => {
      await db.conversations.delete(id);
      await db.messages.where({ conversationId: id }).delete();
      await db.syncQueue.add({
        id: uuidv4(),
        action: 'delete',
        store: 'conversations',
        data: { id },
        timestamp: Date.now(),
      });
    });
    if (get().activeConversationId === id) {
      set({ activeConversationId: null });
    }
    get().loadConversations();
    toast.success('Conversation deleted.');
  },
  // Message Actions
  getMessagesForConversation: (conversationId) => {
    return liveQuery(() =>
      db.messages.where('conversationId').equals(conversationId).sortBy('timestamp')
    );
  },
  addMessage: async (message) => {
    const messageWithId: Message = { ...message, id: uuidv4() };
    await db.transaction('rw', db.messages, db.conversations, db.syncQueue, async () => {
      await db.messages.add(messageWithId);
      await db.conversations.update(message.conversationId, { updatedAt: Date.now() });
      await db.syncQueue.add({
        id: uuidv4(),
        action: 'create',
        store: 'messages',
        data: messageWithId,
        timestamp: Date.now(),
      });
    });
    get().loadConversations();
  },
  // Template Actions
  loadTemplates: async () => {
    const templates = await db.templates.toArray();
    set({ templates });
  },
  // Settings Actions
  loadSettings: async () => {
    let settings = await db.settings.limit(1).first();
    if (!settings) {
      console.log('Initializing default settings...');
      const defaultSettings: Settings = {
        preferredModel: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        lastSync: 0,
        autoSync: false,
        errorsLog: [],
        userApiKeys: {},
      };
      await db.settings.add(defaultSettings);
      settings = await db.settings.limit(1).first();
    }
    set({ settings });
  },
  updateSettings: async (newSettings) => {
    const currentSettings = get().settings;
    if (currentSettings?.id) {
      await db.transaction('rw', db.settings, db.syncQueue, async () => {
        await db.settings.update(currentSettings.id, newSettings);
        if (newSettings.lastSync === undefined) { // Avoid queueing sync updates themselves
          await db.syncQueue.add({
            id: uuidv4(),
            action: 'update',
            store: 'settings',
            data: { ...currentSettings, ...newSettings },
            timestamp: Date.now(),
          });
        }
      });
      get().loadSettings();
    }
  },
}));