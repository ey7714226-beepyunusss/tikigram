import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getFeedPosts } from '@/services/api';
import type { Post } from '@/types';
import StoryBar from '@/components/story-bar';
import PostCard from '@/components/post-card';
import { FeedSkeleton } from '@/components/loading-states';
import EmptyState from '@/components/empty-states';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPosts = useCallback(async (p: number) => {
    if (p === 0) setLoading(true);
    else setLoadingMore(true);
    const data = await getFeedPosts(user?.id ?? '', p);
    if (p === 0) {
      setPosts(data);
    } else {
      setPosts((prev) => [...prev, ...data]);
    }
    setHasMore(data.length === 10);
    setLoading(false);
    setLoadingMore(false);
  }, [user]);

  useEffect(() => {
    loadPosts(0);
  }, [loadPosts]);

  const handleScroll = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage);
    }
  }, [loadingMore, hasMore, page, loadPosts]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="max-w-lg mx-auto md:max-w-xl">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
        <h1 className="px-4 py-3 text-xl font-bold">Tiksta</h1>
      </header>
      <StoryBar />
      {loading ? (
        <div className="p-4"><FeedSkeleton /></div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<Home className="w-8 h-8" />}
          title="Henüz gönderi yok"
          description="Takip ettiğin kişilerin gönderileri burada görünecek. Keşfet sayfasından yeni kişiler keşfet!"
          action={<Button onClick={() => navigate('/explore')}>Keşfetmeye başla</Button>}
        />
      ) : (
        <div className="pb-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={() => setPosts((prev) => prev.filter((p) => p.id !== post.id))}
            />
          ))}
          {loadingMore && (
            <div className="py-4 text-center text-sm text-muted-foreground">Daha fazla yükleniyor...</div>
          )}
        </div>
      )}
    </div>
  );
}
