import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getActiveStories, getUserStories, viewStory, hasViewedStory } from '@/services/api';
import type { Story, Profile } from '@/types';
import Avatar from '@/components/avatar';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function StoryBar() {
  const { user, profile } = useAuth();
  const [storyGroups, setStoryGroups] = useState<{ user: Profile; stories: Story[]; hasUnviewed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<{ stories: Story[]; index: number; user: Profile } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setLoading(true);
    const stories = await getActiveStories();
    const grouped: Record<string, Story[]> = {};
    stories.forEach((s) => {
      if (s.profiles) {
        if (!grouped[s.user_id]) grouped[s.user_id] = [];
        grouped[s.user_id].push(s);
      }
    });

    const groups: { user: Profile; stories: Story[]; hasUnviewed: boolean }[] = [];
    for (const [userId, userStories] of Object.entries(grouped)) {
      const userProfile = userStories[0].profiles!;
      let hasUnviewed = false;
      if (user && userId !== user.id) {
        for (const s of userStories) {
          const viewed = await hasViewedStory(s.id, user.id);
          if (!viewed) {
            hasUnviewed = true;
            break;
          }
        }
      } else if (userId === user?.id) {
        hasUnviewed = false;
      } else {
        hasUnviewed = true;
      }
      groups.push({ user: userProfile, stories: userStories, hasUnviewed });
    }
    setStoryGroups(groups);
    setLoading(false);
  };

  const openStory = async (group: { user: Profile; stories: Story[] }, startIndex = 0) => {
    setViewing({ stories: group.stories, index: startIndex, user: group.user });
    if (user) {
      const story = group.stories[startIndex];
      await viewStory(story.id, user.id);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 py-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 py-3 border-b border-border">
        {/* Add story button */}
        <button
          onClick={() => navigate('/create?type=story')}
          className="flex flex-col items-center gap-1 flex-shrink-0"
        >
          <div className="relative w-16 h-16">
            <Avatar profile={profile} size="xl" className="ring-2 ring-border" />
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
          </div>
          <span className="text-xs text-muted-foreground max-w-16 truncate">Hikâyen</span>
        </button>

        {storyGroups.map((group) => (
          <button
            key={group.user.id}
            onClick={() => openStory(group)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div
              className={cn(
                'rounded-full p-0.5',
                group.hasUnviewed
                  ? 'bg-gradient-to-tr from-primary to-orange-400'
                  : 'bg-muted'
              )}
            >
              <div className="rounded-full p-0.5 bg-background">
                <Avatar profile={group.user} size="xl" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground max-w-16 truncate">
              {group.user.username}
            </span>
          </button>
        ))}
      </div>

      {viewing && (
        <StoryViewer
          stories={viewing.stories}
          initialIndex={viewing.index}
          user={viewing.user}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}

function StoryViewer({
  stories,
  initialIndex,
  user,
  onClose,
}: {
  stories: Story[];
  initialIndex: number;
  user: Profile;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const story = stories[index];

  useEffect(() => {
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = story?.media_type === 'video' ? 15000 : 5000;
    timerRef.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (index < stories.length - 1) {
            setIndex(index + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return p + (100 / (duration / 100));
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, stories.length, story?.media_type, onClose]);

  useEffect(() => {
    if (currentUser && story) {
      viewStory(story.id, currentUser.id);
    }
  }, [story, currentUser]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 z-10">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: i < index ? '100%' : i === index ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10">
        <button
          onClick={() => navigate(`/profile/${user.username}`)}
          className="flex items-center gap-2"
        >
          <Avatar profile={user} size="sm" />
          <span className="text-white text-sm font-medium">{user.username}</span>
        </button>
        <button onClick={onClose} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Media */}
      <div className="relative w-full h-full max-w-md mx-auto">
        {story.media_type === 'video' ? (
          <video src={story.media_url} autoPlay muted playsInline className="w-full h-full object-contain" />
        ) : (
          <img src={story.media_url} alt="" className="w-full h-full object-contain" />
        )}
        {story.caption && (
          <div className="absolute bottom-20 left-0 right-0 p-4">
            <p className="text-white text-sm">{story.caption}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      {index > 0 && (
        <button
          onClick={() => setIndex(index - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}
      {index < stories.length - 1 && (
        <button
          onClick={() => setIndex(index + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}
    </div>
  );
}
