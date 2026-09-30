import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import HomePage from '@/pages/home';
import ExplorePage from '@/pages/explore';
import CreatePage from '@/pages/create';
import ReelsPage from '@/pages/reels';
import NotificationsPage from '@/pages/notifications';
import MessagesPage from '@/pages/messages';
import ConversationPage from '@/pages/conversation';
import ProfilePage from '@/pages/profile';
import SettingsPage from '@/pages/settings';
import SavedPage from '@/pages/saved';
import HashtagPage from '@/pages/hashtag';
import AdminPage from '@/pages/admin';
import AdminUsersPage from '@/pages/admin-users';
import AdminPostsPage from '@/pages/admin-posts';
import AdminReportsPage from '@/pages/admin-reports';
import ConfigError from '@/components/config-error';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Guest preview: allow browsing without signing in. Write actions still require a real session.
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (!profile?.is_admin) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  if (!isSupabaseConfigured) return <ConfigError />;

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/home" replace />} />
      <Route path="/register" element={<Navigate to="/home" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/home" replace />} />

      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/reels" element={<ReelsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:conversationId" element={<ConversationPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/hashtag/:name" element={<HashtagPage />} />

        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/posts" element={<AdminRoute><AdminPostsPage /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster />
      <SonnerToaster position="top-center" richColors />
    </AuthProvider>
  );
}
