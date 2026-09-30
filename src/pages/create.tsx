import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { uploadFile, createPost, createStory } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Video, X, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'menu' | 'post' | 'story'>(
    searchParams.get('type') === 'story' ? 'story' : 'menu'
  );
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 100 * 1024 * 1024) {
      toast.error('Dosya boyutu 100MB\'yi geçemez');
      return;
    }
    if (!selected.type.startsWith('image/') && !selected.type.startsWith('video/')) {
      toast.error('Sadece resim ve video dosyaları yüklenebilir');
      return;
    }
    const isVideo = selected.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async () => {
    if (!user || !file) return;
    setUploading(true);
    setProgress(10);

    const bucket = mode === 'story' ? 'stories' : 'posts';
    const folder = mode === 'story' ? 'story' : undefined;
    const mediaUrl = await uploadFile(bucket, user.id, file, folder);
    if (!mediaUrl) {
      toast.error('Yükleme başarısız oldu');
      setUploading(false);
      return;
    }
    setProgress(70);

    if (mode === 'story') {
      const storyId = await createStory(user.id, mediaType, mediaUrl, caption);
      if (storyId) {
        toast.success('Hikâye paylaşıldı');
        navigate('/home');
      } else {
        toast.error('Hikâye oluşturulamadı');
      }
    } else {
      const thumbnailUrl = mediaType === 'video' ? mediaUrl : null;
      const postId = await createPost(user.id, mediaType, mediaUrl, thumbnailUrl, caption, location);
      if (postId) {
        toast.success('Gönderi paylaşıldı');
        navigate('/home');
      } else {
        toast.error('Gönderi oluşturulamadı');
      }
    }
    setProgress(100);
    setUploading(false);
  };

  const reset = () => {
    setFile(null);
    setPreview('');
    setCaption('');
    setLocation('');
    setMode('menu');
  };

  if (mode === 'menu') {
    return (
      <div className="max-w-lg mx-auto min-h-[80vh] flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold mb-8">Ne paylaşmak istersin?</h2>
        <div className="w-full space-y-3">
          <button
            onClick={() => {
              setMode('post');
              setMediaType('image');
              setTimeout(() => fileInputRef.current?.click(), 100);
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:bg-muted transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Image className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Gönderi</p>
              <p className="text-sm text-muted-foreground">Fotoğraf paylaş</p>
            </div>
          </button>
          <button
            onClick={() => {
              setMode('post');
              setMediaType('video');
              setTimeout(() => fileInputRef.current?.click(), 100);
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:bg-muted transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Video</p>
              <p className="text-sm text-muted-foreground">Video paylaş</p>
            </div>
          </button>
          <button
            onClick={() => {
              setMode('story');
              setTimeout(() => fileInputRef.current?.click(), 100);
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:bg-muted transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Image className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Hikâye</p>
              <p className="text-sm text-muted-foreground">24 saat sonra kaybolur</p>
            </div>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border flex items-center justify-between px-4 py-3">
        <button onClick={reset} className="p-1.5 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">
          {mode === 'story' ? 'Hikâye' : 'Yeni Gönderi'}
        </h1>
        <div className="w-8" />
      </header>

      <div className="p-4 space-y-4">
        {!file ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/5] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 hover:bg-muted transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              {mediaType === 'video' ? <Video className="w-8 h-8 text-muted-foreground" /> : <Image className="w-8 h-8 text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground">Dosya seçmek için dokun</p>
          </button>
        ) : (
          <>
            <div className="relative rounded-2xl overflow-hidden bg-black">
              {mediaType === 'video' ? (
                <video src={preview} controls className="w-full max-h-[50vh] object-contain" />
              ) : (
                <img src={preview} alt="" className="w-full max-h-[50vh] object-contain" />
              )}
              <button
                onClick={reset}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="caption">Açıklama</Label>
                <textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Açıklama yaz..."
                  maxLength={2200}
                  className="w-full mt-1 min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {mode === 'post' && (
                <div>
                  <Label htmlFor="location">Konum (opsiyonel)</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Konum ekle"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {uploading ? (
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-center text-muted-foreground">Yükleniyor...</p>
              </div>
            ) : (
              <Button onClick={handleSubmit} className="w-full" disabled={!file}>
                Paylaş
              </Button>
            )}
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
