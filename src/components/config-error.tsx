import { AlertCircle } from 'lucide-react';
import { APP_NAME } from '@/lib/theme';

export default function ConfigError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">{APP_NAME} yapılandırılmamış</h1>
        <p className="text-muted-foreground">
          Uygulamanın çalışması için Supabase bağlantısı gereklidir. Lütfen
          <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-sm">.env</code>
          dosyasında <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-sm">VITE_SUPABASE_URL</code> ve
          <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-sm">VITE_SUPABASE_ANON_KEY</code>
          değişkenlerini tanımlayın.
        </p>
      </div>
    </div>
  );
}
