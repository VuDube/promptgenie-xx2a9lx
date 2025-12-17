import React, { KeyboardEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useLocalStore } from '@/store/local-store';
import { db, type Conversation } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, PlusCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/chat';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
export function ConversationList() {
  const conversations = useLiveQuery(
    () => db.conversations.orderBy('updatedAt').reverse().toArray(),
    []
  );
  const activeConversationId = useLocalStore(s => s.activeConversationId);
  const setActiveConversationId = useLocalStore(s => s.setActiveConversationId);
  const createNewConversation = useLocalStore(s => s.createNewConversation);
  const deleteConversation = useLocalStore(s => s.deleteConversation);
  // Map of conversationId -> latest message content for preview
  const lastMessageMap = useLiveQuery(async () => {
    const msgs = await db.messages.orderBy('timestamp').reverse().toArray();
    const map = new Map<string, string>();
    for (const msg of msgs) {
      if (!map.has(msg.conversationId)) {
        map.set(msg.conversationId, msg.content);
      }
    }
    return map;
  }, []);
  const handleNewConversation = async () => {
    const newId = await createNewConversation('New Conversation');
    setActiveConversationId(newId);
  };
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id).catch(() => toast.error("Failed to delete conversation."));
  };
  return (
    <div className="h-full flex flex-col p-4 space-y-2">
      <div className="p-4 border-b border-white/10">
        <Button variant="outline" className="w-full gap-2 border-cyber-accent text-cyber-accent hover:bg-cyber-accent hover:text-white" onClick={handleNewConversation}>
          <PlusCircle className="size-4" /> New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {conversations && conversations.length > 0 ? (
          <div className="p-2 space-y-1">
            {conversations.map(convo => {
              const preview = lastMessageMap?.get(convo.id) ?? '';
              return (
                <div
                  key={convo.id}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`Open ${convo.title}`}
                  onClick={() => setActiveConversationId(convo.id)}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter') setActiveConversationId(convo.id);
                  }}
                  className={cn(
                    "group flex items-center justify-between p-2 rounded-md cursor-pointer transition-all duration-200",
                    "hover:shadow-glow hover:scale-105",
                    activeConversationId === convo.id
                      ? "bg-cyber-accent/20 ring-2 ring-cyber-accent border-r-2"
                      : "hover:bg-white/10"
                  )}
                >
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{convo.title}</p>
                    <p className={cn("text-xs truncate", activeConversationId === convo.id ? "text-cyber-accent" : "text-muted-foreground")}>
                      {preview ? preview : formatTime(convo.updatedAt)}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{preview}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "size-7 shrink-0 opacity-0 group-hover:opacity-100",
                          activeConversationId === convo.id ? "text-cyber-accent hover:bg-cyber-accent/20" : "text-muted-foreground hover:bg-white/20"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-cyber-card border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{convo.title}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => handleDelete(e, convo.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
            <Bot className="size-12 mb-4 text-cyber-accent" />
            <p>No conversations yet. Start a new chat to begin!</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}