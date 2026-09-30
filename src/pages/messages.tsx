import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversations, startConversation, searchProfiles } from '@/services/api';
import type { Conversation, Profile } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import Avatar from '@/components/avatar';
import { FullPageLoader } from '@/components/loading-states';
import EmptyState from '@/components/empty-states';
import { MessageCircle, Search, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) return;
    getConversations(user.id).then((data) => {
      setConversations(data);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchProfiles(searchQuery);
      setSearchResults(results.filter((p) => p.id !== user?.id));
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  const startNewChat = async (otherUser: Profile) => {
    if (!user) return;
    const convId = await startConversation(user.id, otherUser.id);
    setShowNewChat(false);
    setSearchQuery('');
    if (convId) navigate(`/messages/${convId}`);
  };

  if (loading) return <FullPageLoader label="Mesajlar yükleniyor" />;

  return (
    <div className="max-w-lg mx-auto">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold">Mesajlar</h1>
        <button
          onClick={() => setShowNewChat(true)}
          className="p-2 hover:bg-muted rounded-lg"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="w-8 h-8" />}
          title="Henüz mesaj yok"
          description="Yeni bir sohbet başlatmak için + butonuna dokun."
          action={<Button onClick={() => setShowNewChat(true)}>Yeni sohbet başlat</Button>}
        />
      ) : (
        <div className="divide-y divide-border">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => navigate(`/messages/${conv.id}`)}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted transition-colors text-left"
            >
              <Avatar profile={conv.other_member} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate">
                    {conv.other_member?.display_name || conv.other_member?.username || 'Bilinmeyen'}
                  </p>
                  {conv.last_message && (
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false, locale: tr })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground truncate flex-1">
                    {conv.last_message?.content || 'Yeni sohbet'}
                  </p>
                  {conv.unread_count && conv.unread_count > 0 ? (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* New chat dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni sohbet</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kullanıcı ara..."
              className="pl-10"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {searching ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aranıyor...</p>
            ) : searchResults.length === 0 && searchQuery ? (
              <p className="text-sm text-muted-foreground text-center py-4">Kullanıcı bulunamadı</p>
            ) : (
              searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => startNewChat(p)}
                  className="flex items-center gap-3 w-full p-2 hover:bg-muted rounded-lg text-left"
                >
                  <Avatar profile={p} size="md" />
                  <div>
                    <p className="text-sm font-medium">{p.display_name || p.username}</p>
                    <p className="text-xs text-muted-foreground">@{p.username}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
