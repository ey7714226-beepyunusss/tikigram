import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetReports, adminUpdateReportStatus } from '@/services/api';
import { FullPageLoader } from '@/components/loading-states';
import EmptyState from '@/components/empty-states';
import { ArrowLeft, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const reasonLabels: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Taciz',
  inappropriate: 'Uygunsuz içerik',
  fake_account: 'Sahte hesap',
  other: 'Diğer',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  reviewing: 'bg-blue-500/10 text-blue-600',
  resolved: 'bg-green-500/10 text-green-600',
  dismissed: 'bg-gray-500/10 text-gray-600',
};

const statusLabels: Record<string, string> = {
  pending: 'Bekliyor',
  reviewing: 'İnceleniyor',
  resolved: 'Çözüldü',
  dismissed: 'Reddedildi',
};

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetReports().then((data) => {
      setReports(data);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = async (reportId: string, status: string) => {
    await adminUpdateReportStatus(reportId, status);
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    toast.success('Durum güncellendi');
  };

  if (loading) return <FullPageLoader label="Şikayetler yükleniyor" />;

  return (
    <div className="max-w-lg mx-auto">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate('/admin')} className="p-1.5 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Şikayetler</h1>
      </header>

      {reports.length === 0 ? (
        <EmptyState icon={<Flag className="w-8 h-8" />} title="Şikayet yok" description="Henüz şikayet bulunmuyor." />
      ) : (
        <div className="divide-y divide-border">
          {reports.map((report) => (
            <div key={report.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{reasonLabels[report.reason] || report.reason}</span>
                <span className={cn('text-xs px-2 py-0.5 rounded-full', statusColors[report.status])}>
                  {statusLabels[report.status] || report.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Şikayet eden: @{report.reporter?.username || 'Bilinmeyen'}
              </p>
              {report.reported_user && (
                <p className="text-sm text-muted-foreground">
                  Şikayet edilen: @{report.reported_user.username}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: tr })}
              </p>
              <Select value={report.status} onValueChange={(v) => handleStatusChange(report.id, v)}>
                <SelectTrigger className="w-full mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Bekliyor</SelectItem>
                  <SelectItem value="reviewing">İnceleniyor</SelectItem>
                  <SelectItem value="resolved">Çözüldü</SelectItem>
                  <SelectItem value="dismissed">Reddedildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
