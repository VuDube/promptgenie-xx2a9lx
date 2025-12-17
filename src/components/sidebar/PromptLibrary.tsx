import React, { useMemo, useState } from 'react';
import { useLocalStore } from '@/store/local-store';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookCopy, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConversationList } from './ConversationList';
interface PromptLibraryProps {
  onSelectTemplate: (content: string) => void;
}
export function PromptLibrary({ onSelectTemplate }: PromptLibraryProps) {
  const templates = useLocalStore((state) => state.templates);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredAndGroupedTemplates = useMemo(() => {
    const filtered = templates.filter(
      (t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered.reduce((acc, template) => {
      const { category } = template;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    }, {} as Record<string, typeof templates>);
  }, [templates, searchTerm]);
  return (
    <div className="h-full flex flex-col bg-cyber-card text-foreground">
      <div className="p-4 flex items-center gap-2 border-b border-white/10">
        <BookCopy className="text-cyber-accent" />
        <h2 className="text-lg font-semibold">PromptGenie</h2>
      </div>
      <Tabs defaultValue="conversations" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-cyber-bg rounded-none">
          <TabsTrigger value="conversations">Chats</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
        </TabsList>
        <TabsContent value="conversations" className="flex-1">
          <ConversationList />
        </TabsContent>
        <TabsContent value="library" className="flex-1 flex flex-col p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-9 bg-cyber-bg border-white/10 focus:ring-cyber-accent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ScrollArea className="flex-1 -mx-4">
            <Accordion type="multiple" className="px-4">
              {Object.entries(filteredAndGroupedTemplates).map(([category, templates]) => (
                <AccordionItem value={category} key={category}>
                  <AccordionTrigger className="text-sm font-medium hover:no-underline">
                    {category} ({templates.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="p-3 rounded-md border border-white/10 bg-cyber-bg hover:bg-white/5 transition-colors"
                        >
                          <h4 className="font-semibold text-sm mb-1">{template.title}</h4>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{template.content}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-cyber-accent text-cyber-accent hover:bg-cyber-accent hover:text-white"
                            onClick={() => onSelectTemplate(template.content)}
                          >
                            Use Template
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      <div className="p-2 text-xs text-center text-muted-foreground border-t border-white/10">
        Built with ❤️ at Cloudflare
      </div>
    </div>
  );
}