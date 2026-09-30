import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, PlusSquare, Bell, User, MessageCircle, Settings, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { getUnreadNotificationCount } from '@/services/api';
import { APP_NAME } from '@/lib/theme';

export default function Sidebar() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    getUnreadNotificationCount(user.id).then(setUnreadCount);
    const interval = setInterval(() => {
      getUnreadNotificationCount(user.id).then(setUnreadCount);
    }, 30000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  const navItems = [
    { to: '/home', icon: Home, label: 'Ana Sayfa' },
    { to: '/explore', icon: Compass, label: 'Keşfet' },
    { to: '/create', icon: PlusSquare, label: 'Oluştur' },
    { to: '/reels', icon: Compass, label: 'Reels' },
    { to: '/messages', icon: MessageCircle, label: 'Mesajlar' },
    { to: '/notifications', icon: Bell, label: 'Bildirimler', badge: unreadCount },
    { to: user ? `/profile/${user.user_metadata?.username || ''}` : '/home', icon: User, label: 'Profil' },
    { to: '/saved', icon: PlusSquare, label: 'Kaydedilenler' },
    { to: '/settings', icon: Settings, label: 'Ayarlar' },
  ];

  if (profile?.is_admin) {
    navItems.push({ to: '/admin', icon: Shield, label: 'Admin' });
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 border-r border-border bg-background/95 backdrop-blur-lg z-40">
      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-primary">{APP_NAME}</span>
        </h1>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-4 px-3 py-3 rounded-xl transition-colors text-sm font-medium',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
              )
            }
          >
            <div className="relative">
              <item.icon className="w-6 h-6" strokeWidth={2} />
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : null}
            </div>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{profile?.display_name || profile?.username}</p>
            <p className="text-xs text-muted-foreground truncate">@{profile?.username}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
