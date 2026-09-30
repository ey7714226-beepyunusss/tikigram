import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Volume2, VolumeX, Play } from 'lucide-react';
import type { Post } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { getPostEngagement, toggleLike, toggleSave, deletePost } from '@/services/api';
import Avatar from '@/components/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getComments, addComment, deleteComment } from '@/services/api';
import type { Comment } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [engagement, setEngagement] = useState({
    likeCount: 0,
    commentCount: 0,
    hasLiked: false,
    hasSaved: false,
  });
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  useEffect(() => {
    if (!user) {
      setEngagement({ likeCount: post.like_count ?? 0, commentCount: post.comment_count ?? 0, hasLiked: false, hasSaved: false });
      return;
    }
    getPostEngagement(post.id, user.id).then(setEngagement);
  }, [post.id, post.like_count, post.comment_count, user]);

  // Intersection observer for video autoplay
  useEffect(() => {
    if (post.media_type !== 'video' || !videoRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: [0.6] }
    );
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [post.media_type]);

  const handleLike = useCallback(async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    const wasLiked = engagement.hasLiked;
    setEngagement((prev) => ({
      ...prev,
      hasLiked: !wasLiked,
      likeCount: wasLiked ? prev.likeCount - 1 : prev.likeCount + 1,
    }));
    if (!wasLiked) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    await toggleLike(post.id, user.id, post.user_id, wasLiked);
    setIsLiking(false);
  }, [user, isLiking, engagement.hasLiked, post.id, post.user_id]);

  const handleSave = useCallback(async () => {
    if (!user || isSaving) return;
    setIsSaving(true);
    const wasSaved = engagement.hasSaved;
    setEngagement((prev) => ({ ...prev, hasSaved: !wasSaved }));
    await toggleSave(post.id, user.id, wasSaved);
    toast.success(wasSaved ? 'Kaydedilenlerden çıkarıldı' : 'Kaydedilenlere eklendi');
    setIsSaving(false);
  }, [user, isSaving, engagement.hasSaved, post.id]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/hashtag/${encodeURIComponent(post.caption || '')}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Tiksta', text: post.caption || '', url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Bağlantı kopyalandı');
    }
  }, [post.caption]);

  const handleDoubleClick = useCallback(() => {
    if (post.media_type === 'image' && !engagement.hasLiked) {
      handleLike();
    }
  }, [post.media_type, engagement.hasLiked, handleLike]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const isOwner = user?.id === post.user_id;

  return (
    <article className="border-b border-border pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate(`/profile/${post.profiles?.username}`)}
          className="flex items-center gap-3"
        >
          <Avatar profile={post.profiles} size="md" />
          <div className="text-left">
            <p className="text-sm font-semibold leading-tight">{post.profiles?.username}</p>
            {post.location && (
              <p className="text-xs text-muted-foreground leading-tight">{post.location}</p>
            )}
          </div>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 hover:bg-muted rounded-lg">
            <MoreHorizontal className="w-5 h-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner ? (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async () => {
                  await deletePost(post.id);
                  toast.success('Gönderi silindi');
                  onDelete?.();
                }}
              >
                Gönderiyi sil
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => navigate(`/profile/${post.profiles?.username}`)}
              >
                Profili görüntüle
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleShare}>
              Paylaş
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Media */}
      <div className="relative bg-muted" onDoubleClick={handleDoubleClick}>
        {post.media_type === 'video' ? (
          <>
            <video
              ref={videoRef}
              src={post.media_url}
              poster={post.thumbnail_url || undefined}
              muted={muted}
              playsInline
              loop
              className="w-full max-h-[80vh] object-contain bg-black"
            />
            {/* Video controls overlay */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-1" fill="white" />
                </div>
              </button>
            )}
          </>
        ) : (
          <img
            src={post.media_url}
            alt={post.caption || ''}
            className="w-full max-h-[80vh] object-contain bg-black"
            loading="lazy"
          />
        )}
        {/* Heart animation */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-20 h-20 text-white fill-white animate-scale-in" style={{ animation: 'scale-in 0.3s ease-out' }} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="flex items-center gap-1.5 group">
            <Heart
              className={cn(
                'w-6 h-6 transition-all group-active:scale-75',
                engagement.hasLiked ? 'fill-destructive text-destructive' : 'text-foreground'
              )}
            />
            <span className="text-sm font-medium">{formatCount(engagement.likeCount)}</span>
          </button>
          <button onClick={() => setShowComments(true)} className="flex items-center gap-1.5 group">
            <MessageCircle className="w-6 h-6 transition-all group-active:scale-75" />
            <span className="text-sm font-medium">{formatCount(engagement.commentCount)}</span>
          </button>
          <button onClick={handleShare} className="group">
            <Share2 className="w-6 h-6 transition-all group-active:scale-75" />
          </button>
        </div>
        <button onClick={handleSave} disabled={isSaving}>
          <Bookmark
            className={cn(
              'w-6 h-6 transition-all',
              engagement.hasSaved ? 'fill-foreground text-foreground' : 'text-foreground'
            )}
          />
        </button>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 text-sm">
          <button
            onClick={() => navigate(`/profile/${post.profiles?.username}`)}
            className="font-semibold mr-2"
          >
            {post.profiles?.username}
          </button>
          <CaptionWithHashtags caption={post.caption} />
        </div>
      )}

      {/* Comments sheet */}
      <CommentsSheet
        postId={post.id}
        postOwnerId={post.user_id}
        open={showComments}
        onOpenChange={setShowComments}
        onCommentAdded={() =>
          setEngagement((prev) => ({ ...prev, commentCount: prev.commentCount + 1 }))
        }
      />
    </article>
  );
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}B`;
  return n.toString();
}

function CaptionWithHashtags({ caption }: { caption: string }) {
  const navigate = useNavigate();
  const parts = caption.split(/(#[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+)/g);
  return (
    <span className="line-clamp-2">
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          return (
            <button
              key={i}
              onClick={() => navigate(`/hashtag/${part.slice(1)}`)}
              className="text-primary font-medium hover:underline"
            >
              {part}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function CommentsSheet({
  postId,
  postOwnerId,
  open,
  onOpenChange,
  onCommentAdded,
}: {
  postId: string;
  postOwnerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentAdded: () => void;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getComments(postId).then((data) => {
        setComments(data);
        setLoading(false);
      });
    }
  }, [open, postId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || submitting) return;
    setSubmitting(true);
    const newComment = await addComment(postId, user.id, content.trim(), postOwnerId);
    if (newComment) {
      setComments((prev) => [...prev, newComment]);
      setContent('');
      onCommentAdded();
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle>Yorumlar</SheetTitle>
        </SheetHeader>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground py-8">Yükleniyor...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              Henüz yorum yok. İlk yorumu sen yap!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar profile={comment.profiles} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.profiles?.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: tr })}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5 break-words">{comment.content}</p>
                  {comment.user_id === user?.id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs text-destructive mt-1 hover:underline"
                    >
                      Sil
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {user && (
          <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Yorum yaz..."
              maxLength={500}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={!content.trim() || submitting}>
              Gönder
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
