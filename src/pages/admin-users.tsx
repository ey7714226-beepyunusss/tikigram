import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetAllProfiles, adminToggleBlock } from '@/services/api';
import type { Profile } from '@/types';
import { FullPageLoader } from '@/components/loading-states';
import EmptyState from '@/components/empty-states';
import Avatar from '@/components/avatar';
import { ArrowLeft, Ban, CheckCircle2, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetAllProfiles().then((data) => {
      setProfiles(data);
      setLoading(false);
    });
  }, []);

  const handleToggleBlock = async (userId: string, currentlyBlocked: boolean) => {
    await adminToggleBlock(userId, !currentlyBlocked);
    setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, is_blocked: !currentlyBlocked } : p)));
    toast.success(currentlyBlocked ? 'Engel kaldırıldı' : 'Kullanıcı engellendi');
  };

  if (loading) return <FullPageLoader label="Kullanıcılar yükleniyor" />;

  return (
    <div className="max-w-lg mx-auto">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate('/admin')} className="p-1.5 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Kullanıcılar</h1>
      </header>

      {profiles.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title="Kullanıcı yok" />
      ) : (
        <div className="divide-y divide-border">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar profile={p} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{p.display_name || p.username}</p>
                  {p.is_admin && <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  {p.is_blocked && <span className="text-xs text-destructive">Engelli</span>}
                </div>
                <p className="text-xs text-muted-foreground">@{p.username}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: tr })} katıldı
                </p>
              </div>
              {!p.is_admin && (
                <Button
                  size="sm"
                  variant={p.is_blocked ? 'outline' : 'destructive'}
                  onClick={() => handleToggleBlock(p.id, p.is_blocked)}
                >
                  {p.is_blocked ? (
                    <><CheckCircle2 className="w-4 h-4 mr-1" /> Engeli kaldır</>
                  ) : (
                    <><Ban className="w-4 h-4 mr-1" /> Engelle</>
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
