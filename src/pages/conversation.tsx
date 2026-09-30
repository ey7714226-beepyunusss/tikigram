import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMessages, sendMessage, markMessagesRead, uploadFile } from '@/services/api';
import type { Message, Profile } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/avatar';
import { ArrowLeft, Send, ImagePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId || !user) return;
    const data = await getMessages(conversationId);
    setMessages(data);
    setLoading(false);

    // Get other member
    if (supabase) {
      const { data: members } = await supabase
        .from('conversation_members')
        .select('user_id, profiles!conversation_members_user_id_fkey(*)')
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id);
      if (members && members.length > 0) {
        setOtherUser(members[0].profiles as unknown as Profile);
      }
    }

    // Mark as read
    await markMessagesRead(conversationId, user.id);
  }, [conversationId, user]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!supabase || !conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
          if (user && (payload.new as Message).sender_id !== user.id) {
            markMessagesRead(conversationId, user.id);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !conversationId || !content.trim() || sending) return;
    setSending(true);
    const msgContent = content.trim();
    setContent('');
    await sendMessage(conversationId, user.id, msgContent);
    setSending(false);
  };

  const handleImageSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !conversationId) return;
    if (!file.type.startsWith('image/')) return;
    setSending(true);
    const url = await uploadFile('messages', user.id, file, 'msg');
    if (url) {
      await sendMessage(conversationId, user.id, '', url);
    }
    setSending(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-lg mx-auto h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate('/messages')} className="p-1.5 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar profile={otherUser} size="sm" />
        <button
          onClick={() => otherUser && navigate(`/profile/${otherUser.username}`)}
          className="flex-1 text-left"
        >
          <p className="text-sm font-semibold">{otherUser?.display_name || otherUser?.username || 'Sohbet'}</p>
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Yükleniyor...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Henüz mesaj yok. İlk mesajı gönder!
          </p>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.sender_id === user?.id;
            const showDate = i === 0 || new Date(messages[i - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();
            return (
              <div key={msg.id}>
                {showDate && (
                  <p className="text-center text-xs text-muted-foreground my-3">
                    {format(new Date(msg.created_at), 'd MMMM', { locale: tr })}
                  </p>
                )}
                <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-3 py-2',
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    )}
                  >
                    {msg.media_url && (
                      <img src={msg.media_url} alt="" className="max-w-48 rounded-lg mb-1" />
                    )}
                    {msg.content && <p className="text-sm break-words">{msg.content}</p>}
                    <p className={cn('text-[10px] mt-0.5', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-border p-3 flex items-center gap-2 safe-bottom">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSend}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-muted rounded-lg flex-shrink-0"
        >
          <ImagePlus className="w-5 h-5 text-muted-foreground" />
        </button>
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Mesaj yaz..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!content.trim() || sending} className="flex-shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
