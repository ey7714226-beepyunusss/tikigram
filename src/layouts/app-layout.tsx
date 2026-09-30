import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/bottom-nav';
import Sidebar from '@/components/sidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
