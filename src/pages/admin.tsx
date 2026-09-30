import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Shield, Users, FileText, Flag, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: Users, label: 'Kullanıcılar', desc: 'Tüm kullanıcıları görüntüle ve yönet', path: '/admin/users' },
    { icon: FileText, label: 'Gönderiler', desc: 'Tüm gönderileri görüntüle ve kaldır', path: '/admin/posts' },
    { icon: Flag, label: 'Şikayetler', desc: 'Şikayetleri incele ve çöz', path: '/admin/reports' },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate('/home')} className="p-1.5 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Admin Paneli</h1>
      </header>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{profile?.display_name || profile?.username}</p>
            <p className="text-xs text-muted-foreground">Yönetici</p>
          </div>
        </div>

        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex items-center gap-3 w-full p-4 rounded-xl border border-border hover:bg-muted transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
