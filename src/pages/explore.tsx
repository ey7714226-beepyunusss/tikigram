import { useEffect, useState, useCallback } from 'react';
import { getExplorePosts, searchProfiles, searchHashtags } from '@/services/api';
import type { Post, Profile, Hashtag } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GridSkeleton } from '@/components/loading-states';
import EmptyState from '@/components/empty-states';
import Avatar from '@/components/avatar';
import { getTrendingHashtags } from '@/services/api';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ users: Profile[]; hashtags: Hashtag[]; posts: Post[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [trending, setTrending] = useState<Hashtag[]>([]);

  useEffect(() => {
    loadPosts(0);
    getTrendingHashtags().then(setTrending);
  }, []);

  const loadPosts = async (p: number) => {
    if (p === 0) setLoading(true);
    const data = await getExplorePosts(p);
    if (p === 0) setPosts(data);
    else setPosts((prev) => [...prev, ...data]);
    setLoading(false);
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const [users, hashtags] = await Promise.all([
      searchProfiles(query),
      searchHashtags(query),
    ]);
    setSearchResults({ users, hashtags, posts: [] });
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  return (
    <div className="max-w-4xl mx-auto">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kullanıcı, hashtag ara..."
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </header>

      {searchResults ? (
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="all">Tümü</TabsTrigger>
              <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
              <TabsTrigger value="hashtags">Hashtagler</TabsTrigger>
            </TabsList>

            {(activeTab === 'all' || activeTab === 'users') && (
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground">Kullanıcılar</h3>
                {searchResults.users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Kullanıcı bulunamadı</p>
                ) : (
                  searchResults.users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => navigate(`/profile/${user.username}`)}
                      className="flex items-center gap-3 w-full hover:bg-muted p-2 rounded-lg"
                    >
                      <Avatar profile={user} size="md" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{user.display_name || user.username}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'hashtags') && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Hashtagler</h3>
                {searchResults.hashtags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Hashtag bulunamadı</p>
                ) : (
                  searchResults.hashtags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => navigate(`/hashtag/${tag.name}`)}
                      className="flex items-center gap-3 w-full hover:bg-muted p-2 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">#</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">#{tag.name}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </Tabs>
        </div>
      ) : (
        <>
          {trending.length > 0 && (
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Trend hashtagler
              </h3>
              <div className="flex flex-wrap gap-2">
                {trending.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => navigate(`/hashtag/${tag.name}`)}
                    className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium hover:bg-primary/10 hover:text-primary"
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-1"><GridSkeleton /></div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon={<Search className="w-8 h-8" />}
              title="Henüz gönderi yok"
              description="Keşfedecek içerik bulunamadı."
            />
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
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
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
