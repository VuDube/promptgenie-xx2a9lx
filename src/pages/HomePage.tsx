import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bot, Library, SendHorizonal, Share2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocalStore } from '@/store/local-store';
import { Header } from '@/components/layout/Header';
import { PromptLibrary } from '@/components/sidebar/PromptLibrary';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { db, type Message } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
export function HomePage() {
  const initializeDatabase = useLocalStore((s) => s.initializeDatabase);
  const activeConversationId = useLocalStore((s) => s.activeConversationId);
  const setActiveConversationId = useLocalStore((s) => s.setActiveConversationId);
  const createNewConversation = useLocalStore((s) => s.createNewConversation);
  const addMessage = useLocalStore((s) => s.addMessage);
  const routeToAI = useLocalStore((s) => s.routeToAI);
  const isGenerating = useLocalStore((s) => s.isGenerating);
  const streamingContent = useLocalStore((s) => s.streamingContent);
  const syncPendingCount = useLocalStore((s) => s.syncPendingCount);
  const triggerSync = useLocalStore((s) => s.triggerSync);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!useIsMobile());
  const isMobile = useIsMobile();
  const messages = useLiveQuery<Message[]>(
    async () => {
      if (!activeConversationId) return [];
      return db.messages.where('conversationId').equals(activeConversationId).sortBy('timestamp');
    },
    [activeConversationId]
  );
  const safeMessages = useMemo(() => (messages ?? []) as Message[], [messages]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [safeMessages, streamingContent, isGenerating]);
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    const messageContent = input.trim();
    setInput('');
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      const newId = await createNewConversation(messageContent.substring(0, 50));
      setActiveConversationId(newId);
      currentConversationId = newId;
    }
    if (currentConversationId) {
      await addMessage({
        conversationId: currentConversationId,
        role: 'user',
        content: messageContent,
        timestamp: Date.now(),
      });
      await routeToAI(currentConversationId, messageContent);
    }
  };
  const handleSelectTemplate = (content: string) => {
    setInput(content);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };
  const PromptLibraryDrawer = () => <PromptLibrary onSelectTemplate={handleSelectTemplate} />;
  return (
    <div className="h-screen w-screen bg-cyber-bg text-foreground flex flex-col overflow-hidden">
      <Header />
      <Toaster theme="dark" richColors />
      <main className="flex-1 flex pt-16">
        {isMobile ? (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="p-0 w-[300px] border-r-0 bg-cyber-card">
              <PromptLibraryDrawer />
            </SheetContent>
          </Sheet>
        ) : (
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ width: 0, x: -320 }}
                animate={{ width: 320, x: 0 }}
                exit={{ width: 0, x: -320 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="h-full border-r border-white/10 overflow-hidden"
              >
                <PromptLibraryDrawer />
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div className="flex-1 flex flex-col relative">
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="bg-cyber-card/50 hover:bg-cyber-card backdrop-blur-sm"
            >
              {isSidebarOpen && !isMobile ? <X className="size-5" /> : <Library className="size-5" />}
            </Button>
          </div>
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 w-full">
              {safeMessages.length === 0 && !isGenerating ? (
                <div className="text-center py-20 animate-fade-in">
                  <Bot className="mx-auto size-12 text-cyber-accent mb-4" />
                  <h2 className="text-2xl font-semibold">Welcome to PromptGenie</h2>
                  <p className="text-muted-foreground mt-2">
                    Start a new conversation or select a template from the library.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {safeMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <MessageBubble role={msg.role} content={msg.content} />
                    </motion.div>
                  ))}
                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <MessageBubble role="assistant" content={streamingContent || 'Thinking...'} />
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="w-full px-4 pb-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative rounded-2xl bg-cyber-card border border-white/10 shadow-lg p-2">
                <form onSubmit={handleSendMessage}>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Ask anything or use a template..."
                    className="bg-transparent border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base pr-28"
                    rows={1}
                    disabled={isGenerating}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-full bg-transparent border-white/20 hover:bg-white/10"
                      onClick={triggerSync}
                    >
                      <Share2 className="size-4" />
                      {syncPendingCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-yellow-500 text-black">
                          {syncPendingCount}
                        </Badge>
                      )}
                    </Button>
                    <Button type="submit" size="icon" className="rounded-full bg-cyber-accent hover:bg-cyber-accent/90" disabled={isGenerating}>
                      <SendHorizonal className="size-5" />
                    </Button>
                  </div>
                </form>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                AI can make mistakes. Consider checking important information. There is a limit on the number of requests that can be made to the AI servers.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}