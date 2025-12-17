import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Cloud, Trash2, AlertTriangle, RefreshCw, Key, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLocalStore } from '@/store/local-store';
import { db } from '@/lib/db';
import { MODELS, chatService } from '@/lib/chat';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
export function SettingsPage() {
  const navigate = useNavigate();
  const settings = useLocalStore(s => s.settings);
  const updateSettings = useLocalStore(s => s.updateSettings);
  const conversations = useLocalStore(s => s.conversations);
  const deleteConversation = useLocalStore(s => s.deleteConversation);
  const triggerSync = useLocalStore(s => s.triggerSync);
  const syncPendingCount = useLocalStore(s => s.syncPendingCount);
  const [apiKeys, setApiKeys] = useState(settings?.userApiKeys || {});
  const conversationCount = useLiveQuery(() => db.conversations.count(), []);
  const messageCount = useLiveQuery(() => db.messages.count(), []);
  const templateCount = useLiveQuery(() => db.templates.count(), []);
  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };
  const handleSaveApiKeys = () => {
    updateSettings({ userApiKeys: apiKeys });
    toast.success('API keys saved locally.');
  };
  const handleTestApiKey = async (provider: string) => {
    const key = apiKeys[provider];
    if (!key) {
      toast.error(`Please enter a key for ${provider}.`);
      return;
    }
    const toastId = toast.loading(`Testing ${provider} API key...`);
    const success = await chatService.testApiKey(provider, key);
    if (success) {
      toast.success(`${provider} connection successful!`, { id: toastId });
    } else {
      toast.error(`Failed to connect with ${provider} key.`, { id: toastId });
    }
  };
  const handleClearAllConversations = async () => {
    try {
      await Promise.all(conversations.map(c => deleteConversation(c.id)));
      toast.success('All conversations have been deleted.');
    } catch (error) {
      toast.error('Failed to delete all conversations.');
      console.error(error);
    }
  };
  const handleClearDatabase = async () => {
    try {
      await db.delete();
      toast.success('Database cleared. The app will now reload.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error('Failed to clear the database.');
      console.error(error);
    }
  };
  const freeTierUsage = (chatService.freeTierRequests / chatService.FREE_TIER_LIMIT) * 100;
  return (
    <div className="bg-cyber-bg min-h-screen text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft />
            </Button>
            <h1 className="text-3xl font-bold">Settings</h1>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sync Status Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card className="bg-cyber-card border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><RefreshCw className="text-cyber-accent" /> Sync Status</CardTitle>
                  <CardDescription>Manage data synchronization with the cloud.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span>Last Sync:</span>
                    <span className="font-mono">{settings?.lastSync ? formatDistanceToNow(new Date(settings.lastSync), { addSuffix: true }) : 'Never'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Pending Items:</span>
                    <span className="font-mono">{syncPendingCount ?? '...'}</span>
                  </div>
                  <Button onClick={triggerSync} className="w-full gap-2">
                    <RefreshCw className="size-4" /> Force Sync
                  </Button>
                  {settings?.errorsLog && settings.errorsLog.length > 0 && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="errors">
                        <AccordionTrigger className="text-sm text-yellow-400">View Sync Errors ({settings.errorsLog.length})</AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground max-h-24 overflow-y-auto">
                          <ul>
                            {settings.errorsLog.map((err, i) => <li key={i} className="truncate"> - {err}</li>)}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            {/* Model & Usage Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Card className="bg-cyber-card border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Cloud className="text-cyber-accent" /> Model & Usage</CardTitle>
                  <CardDescription>Preferences and free tier usage for today.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={settings?.preferredModel ?? '@cf/meta/llama-3.3-70b-instruct-fp8-fast'}
                    onValueChange={(value) => updateSettings({ preferredModel: value })}
                  >
                    <SelectTrigger className="bg-cyber-bg border-white/20">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent className="bg-cyber-card border-white/10">
                      {MODELS.map(model => (
                        <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div>
                    <label className="text-sm font-medium">Daily Free Tier Usage</label>
                    <Progress value={freeTierUsage} className="w-full mt-2" />
                    <p className="text-xs text-muted-foreground text-right mt-1">{chatService.freeTierRequests} / {chatService.FREE_TIER_LIMIT}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            {/* Storage Usage Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <Card className="bg-cyber-card border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Database className="text-cyber-accent" /> Local Storage</CardTitle>
                  <CardDescription>Statistics from your local device database.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between"><span>Conversations:</span> <span className="font-mono">{conversationCount ?? '...'}</span></div>
                  <div className="flex justify-between"><span>Messages:</span> <span className="font-mono">{messageCount ?? '...'}</span></div>
                  <div className="flex justify-between"><span>Templates:</span> <span className="font-mono">{templateCount ?? '...'}</span></div>
                </CardContent>
              </Card>
            </motion.div>
            {/* API Keys Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="md:col-span-2">
              <Card className="bg-cyber-card border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Key className="text-cyber-accent" /> API Keys</CardTitle>
                  <CardDescription>Optionally add your own keys for premium models. Keys are stored locally on your device.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <div className="flex gap-2">
                      <Input id="openai-key" type="password" placeholder="sk-..." value={apiKeys['openai'] || ''} onChange={e => handleApiKeyChange('openai', e.target.value)} className="bg-cyber-bg border-white/20" />
                      <Button variant="outline" onClick={() => handleTestApiKey('openai')}>Test</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                    <div className="flex gap-2">
                      <Input id="anthropic-key" type="password" placeholder="sk-ant-..." value={apiKeys['anthropic'] || ''} onChange={e => handleApiKeyChange('anthropic', e.target.value)} className="bg-cyber-bg border-white/20" />
                      <Button variant="outline" onClick={() => handleTestApiKey('anthropic')}>Test</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gemini-key">Google Gemini API Key</Label>
                    <div className="flex gap-2">
                      <Input id="gemini-key" type="password" placeholder="AIzaSy..." value={apiKeys['gemini'] || ''} onChange={e => handleApiKeyChange('gemini', e.target.value)} className="bg-cyber-bg border-white/20" />
                      <Button variant="outline" onClick={() => handleTestApiKey('gemini')}>Test</Button>
                    </div>
                  </div>
                  <Button onClick={handleSaveApiKeys} className="w-full gap-2"><CheckCircle className="size-4" /> Save Keys</Button>
                </CardContent>
              </Card>
            </motion.div>
            {/* Danger Zone Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="md:col-span-2 lg:col-span-3">
              <Card className="bg-cyber-card border-red-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-400"><AlertTriangle /> Danger Zone</CardTitle>
                  <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full gap-2"><Trash2 className="size-4" /> Clear All Conversations</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-cyber-card border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete all your conversations and messages from your local device. This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAllConversations}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full gap-2"><Trash2 className="size-4" /> Clear Entire Database</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-cyber-card border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle>This is a critical action!</AlertDialogTitle>
                        <AlertDialogDescription>This will wipe all local data, including settings and templates, and reload the app. Are you sure you want to proceed?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearDatabase}>Yes, delete everything</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}