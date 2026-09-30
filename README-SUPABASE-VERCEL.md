# Sosyal Medya — Supabase ve Vercel kurulumu

Bu proje React + Vite + TypeScript ve Supabase kullanır. Veritabanı projesi hazırlanmıştır; gerçek kullanıcı ve içerikler kayıt oldukça oluşur. Hazır demo kullanıcı/ gönderisi eklenmemiştir.

## Yerel çalıştırma

1. Node.js'in güncel LTS sürümünü kurun.
2. Proje klasöründe terminal açın.
3. `npm ci` komutunu çalıştırın.
4. `.env.local` dosyasında `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerinin bulunduğunu kontrol edin.
5. `npm run dev` ile yerel sunucuyu başlatın.

`.env.local` geliştirme içindir ve Git'e gönderilmemelidir. İçindeki `sb_publishable_...` anahtarı istemci uygulamalarında kullanılmak üzere tasarlanmıştır. `service_role` veya `sb_secret_...` anahtarlarını asla ön yüze ya da GitHub'a koymayın.

## GitHub'a yükleme

Proje klasörünü GitHub deposuna yükleyin. `node_modules`, `dist` ve `.env.local` dosyaları `.gitignore` nedeniyle yüklenmemelidir.

## Vercel dağıtımı

1. Vercel'de **Add New → Project** seçip GitHub deposunu içe aktarın.
2. Framework Preset: **Vite**; Build Command: `npm run build`; Output Directory: `dist`.
3. **Settings → Environment Variables** bölümüne şu değişkenleri ekleyin:
   - `VITE_SUPABASE_URL` = `https://nvkpfvqedsaigisbwhvb.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = Supabase projesinin publishable (`sb_publishable_...`) anahtarı
4. Production, Preview ve Development ortamlarını ihtiyacınıza göre işaretleyin ve yeniden deploy edin.

## Supabase Auth yönlendirmesi

Supabase Dashboard → Authentication → URL Configuration bölümünde Site URL alanını Vercel alan adınızla değiştirin. Redirect URLs listesine yerel geliştirme adresini (`http://localhost:5173/**`) ve Vercel alan adınızı (`https://<proje-adiniz>.vercel.app/**`) ekleyin. Gerçek Vercel alan adınız belli olduğunda bu değerleri güncelleyin.

## Önemli

Veritabanı tabloları ve depolama alanları Supabase projesinde oluşturulmuştur. Uygulamanın bütün ekranlarının canlı ortamda uçtan uca test edildiği anlamına gelmez. İlk kullanıcı kaydı, e-posta doğrulama ayarları, dosya yükleme ve mesajlaşma akışları yayın öncesinde test edilmelidir.


## Misafir önizleme sürümü
Bu sürümde giriş ekranı devre dışıdır ve uygulama sayfaları oturum açmadan görüntülenebilir. Supabase'e bağlı veri yazma, beğenme, takip ve mesaj gönderme gibi işlemler gerçek kullanıcı oturumu gerektirir.

## Demo içerik
Oturum açmamış misafirlere `src/lib/demo-data.ts` içindeki demo profiller, gönderiler, hikayeler ve etiketler gösterilir. Bu veriler yalnızca tarayıcıda üretilir, Supabase'e yazılmaz. Giriş yapan kullanıcılar gerçek verileri görür. Demoyu kapatmak için `src/services/api.ts` içindeki `isGuest()` korumalarını kaldırın.
