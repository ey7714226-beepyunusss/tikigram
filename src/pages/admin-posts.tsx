import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetAllPosts, adminDeletePost } from '@/services/api';
import type { Post } from '@/types';
import { FullPageLoader } from '@/components/loading-states';
import EmptyState from '@/components/empty-states';
import { ArrowLeft, Trash2, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function AdminPostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetAllPosts().then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (postId: string) => {
    await adminDeletePost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success('Gönderi kaldırıldı');
  };

  if (loading) return <FullPageLoader label="Gönderiler yükleniyor" />;

  return (
    <div className="max-w-lg mx-auto">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate('/admin')} className="p-1.5 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Gönderiler</h1>
      </header>

      {posts.length === 0 ? (
        <EmptyState icon={<Film className="w-8 h-8" />} title="Gönderi yok" />
      ) : (
        <div className="divide-y divide-border">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {post.media_type === 'video' ? (
                  <video src={post.media_url} poster={post.thumbnail_url || undefined} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">@{post.profiles?.username}</p>
                <p className="text-xs text-muted-foreground truncate">{post.caption || 'Açıklama yok'}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
                </p>
              </div>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(post.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
