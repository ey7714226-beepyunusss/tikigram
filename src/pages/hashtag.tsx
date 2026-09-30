import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostsByHashtag } from '@/services/api';
import type { Post } from '@/types';
import { FullPageLoader } from '@/components/loading-states';
import EmptyState from '@/components/empty-states';
import { Hash, ArrowLeft, Film } from 'lucide-react';

export default function HashtagPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    getPostsByHashtag(name).then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, [name]);

  if (loading) return <FullPageLoader label="Yükleniyor" />;

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Hash className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">#{name}</h1>
            <p className="text-xs text-muted-foreground">{posts.length} gönderi</p>
          </div>
        </div>
      </header>

      {posts.length === 0 ? (
        <EmptyState
          icon={<Hash className="w-8 h-8" />}
          title="Henüz gönderi yok"
          description={`#${name} hashtag'ine sahip henüz gönderi yok.`}
        />
      ) : (
        <div className="grid grid-cols-3 gap-1 py-1">
          {posts.map((post) => (
            <button
              key={post.id}
              onClick={() => navigate(`/profile/${post.profiles?.username || ''}`)}
              className="aspect-square relative group overflow-hidden"
            >
              {post.media_type === 'video' ? (
                <video src={post.media_url} poster={post.thumbnail_url || undefined} className="w-full h-full object-cover" muted />
              ) : (
                <img src={post.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              )}
              {post.media_type === 'video' && (
                <div className="absolute top-1 right-1">
                  <Film className="w-4 h-4 text-white drop-shadow-lg" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
