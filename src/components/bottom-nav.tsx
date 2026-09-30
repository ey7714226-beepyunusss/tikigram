import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, PlusSquare, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { getUnreadNotificationCount } from '@/services/api';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
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
    { to: '/create', icon: PlusSquare, label: 'Oluştur', isCenter: true },
    { to: '/notifications', icon: Bell, label: 'Bildirimler', badge: unreadCount },
    { to: user ? `/profile/${user.user_metadata?.username || ''}` : '/home', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border md:hidden safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 w-14 h-14 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <div className="relative">
              {item.isCenter ? (
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <item.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              ) : (
                <item.icon className="w-6 h-6" strokeWidth={2} />
              )}
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : null}
            </div>
            {!item.isCenter && <span className="text-[10px] font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
