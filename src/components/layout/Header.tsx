import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Cloud, Cpu, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { useLocalStore } from '@/store/local-store';
import { MODELS } from '@/lib/chat';
export function Header() {
  const navigate = useNavigate();
  const cloudMode = useLocalStore(s => s.cloudMode);
  const currentModel = useLocalStore(s => s.currentModel);
  const setCloudMode = useLocalStore(s => s.setCloudMode);
  const updateModel = useLocalStore(s => s.updateModel);
  const syncPendingCount = useLocalStore(s => s.syncPendingCount);
  const selectedModelName = MODELS.find(m => m.id === currentModel)?.name || 'Unknown Model';
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-cyber-bg/50 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Bot className="text-cyber-accent size-7" />
            <h1 className="text-xl font-bold text-foreground">PromptGenie</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className={syncPendingCount > 0 ? "border-yellow-500/50 text-yellow-400" : "border-green-500/50 text-green-400"}>
              {syncPendingCount > 0 ? (
                <AlertCircle className="size-3 mr-2 animate-pulse" />
              ) : (
                <CheckCircle className="size-3 mr-2" />
              )}
              {syncPendingCount > 0 ? `${syncPendingCount} Pending Sync` : 'Synced'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent border-white/20 hover:bg-white/10 transition-all hover:scale-105 hover:shadow-glow active:scale-95">
                  {cloudMode ? <Cloud className="size-4 text-cyber-accent" /> : <Cpu className="size-4" />}
                  <span>{cloudMode ? selectedModelName : 'Local Mock Model'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-cyber-card border-white/10 text-foreground w-64">
                <DropdownMenuLabel>Select Mode & Model</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuRadioGroup value={cloudMode ? currentModel : 'local'}>
                  <DropdownMenuRadioItem value="local" onSelect={() => setCloudMode(false)} className="gap-2 focus:bg-cyber-accent">
                    <Cpu className="size-4" /> Local Mock Model
                  </DropdownMenuRadioItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {MODELS.map(model => (
                    <DropdownMenuRadioItem key={model.id} value={model.id} onSelect={() => updateModel(model.id)} className="gap-2 focus:bg-cyber-accent">
                      <Cloud className="size-4" /> {model.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="transition-transform hover:scale-110 hover:rotate-12" onClick={() => navigate('/settings')}>
              <Settings className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}