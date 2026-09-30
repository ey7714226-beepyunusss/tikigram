import type { Post, Profile, Story, Comment, Hashtag } from '@/types';

// Demo içerik: yalnızca oturumu olmayan misafirlere gösterilir, veritabanına yazılmaz.
const now = Date.now();
const ago = (h: number) => new Date(now - h * 3600_000).toISOString();

const art = (a: string, b: string, label: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="800" fill="url(#g)"/><circle cx="620" cy="180" r="90" fill="#fff" fill-opacity=".18"/><circle cx="200" cy="620" r="150" fill="#fff" fill-opacity=".12"/><text x="400" y="420" font-family="sans-serif" font-size="56" font-weight="700" fill="#fff" text-anchor="middle">${label}</text></svg>`
  );

const mk = (id: string, username: string, name: string, bio: string, c1: string, c2: string): Profile => ({
  id: `demo-${id}`,
  username,
  display_name: name,
  bio,
  avatar_url: art(c1, c2, name[0]),
  website_url: null,
  is_private: false,
  is_admin: false,
  is_blocked: false,
  created_at: ago(24 * 90),
  updated_at: ago(24 * 90),
});

export const DEMO_PROFILES: Profile[] = [
  mk('1', 'elif.gezgin', 'Elif Gezgin', 'Gezgin, kahve tutkunu. Bugün neredeyim?', '#f97316', '#db2777'),
  mk('2', 'mert.fotograf', 'Mert Işık', 'Fotoğraf • Şehir • Işık', '#0ea5e9', '#6366f1'),
  mk('3', 'zeynep.mutfakta', 'Zeynep Mutfakta', 'Ev yemekleri ve tarifler', '#22c55e', '#0d9488'),
  mk('4', 'can.kodlar', 'Can Yıldız', 'Yazılım geliştirici. Kod yazar, bisiklete biner.', '#8b5cf6', '#ec4899'),
  mk('5', 'derya.sanat', 'Derya Sanat', 'Resim ve dijital sanat', '#eab308', '#ef4444'),
  mk('6', 'baris.spor', 'Barış Koşar', 'Sabah koşuları, maraton hazırlığı', '#14b8a6', '#3b82f6'),
];

const P = (id: string) => DEMO_PROFILES.find((p) => p.id === `demo-${id}`)!;

const rows: [string, string, string, string, string, string, number, number, number][] = [
  ['1', 'Kapadokya\'da gün doğumu, balonlar tam tepemizde! #seyahat #kapadokya', 'Göreme', '#f97316', '#db2777', 'Kapadokya', 3, 248, 14],
  ['2', 'Sabah ışığında Galata. #fotograf #istanbul', 'İstanbul', '#0ea5e9', '#6366f1', 'Galata', 5, 312, 22],
  ['3', 'Pazar kahvaltısı: ev yapımı simit ve çılgın bir reçel. #tarif #kahvalti', 'Ev', '#22c55e', '#0d9488', 'Kahvaltı', 8, 189, 31],
  ['4', 'Yeni yan projem yayında! Gece boyunca kod yazdım. #yazilim #kodlama', '', '#8b5cf6', '#ec4899', 'Yeni Proje', 11, 421, 47],
  ['5', 'Akşam üstü dijital çizimim. Yorumlarınızı merak ediyorum. #sanat #cizim', '', '#eab308', '#ef4444', 'Gün Batımı', 14, 275, 19],
  ['6', 'Sahilde 15 km tamam! Maraton yolunda bir adım daha. #kosu #spor', 'Bostanlı', '#14b8a6', '#3b82f6', '15 KM', 20, 167, 12],
  ['1', 'Kaş\'ta turkuaz sular ve sessizlik. #seyahat #deniz', 'Kaş', '#06b6d4', '#2563eb', 'Kaş', 26, 356, 28],
  ['2', 'Yağmur sonrası kaldırımlar. #fotograf #sokak', 'Kadıköy', '#64748b', '#0f172a', 'Yağmur', 32, 143, 9],
  ['3', 'Mantı için hamur açma günü. #tarif #mantı', 'Ev', '#f59e0b', '#b45309', 'Mantı', 40, 221, 25],
  ['4', 'Bugünün masa düzeni. #yazilim #ofis', '', '#a855f7', '#4c1d95', 'Masam', 48, 98, 6],
  ['5', 'Suluboya denemesi, orman. #sanat #suluboya', '', '#16a34a', '#14532d', 'Orman', 56, 204, 15],
  ['6', 'Hafta sonu bisiklet turu. #spor #bisiklet', 'Urla', '#ef4444', '#f97316', 'Bisiklet', 70, 132, 8],
];

export const DEMO_POSTS: Post[] = rows.map(([u, caption, loc, c1, c2, label, h, likes, comments], i) => ({
  id: `demo-post-${i + 1}`,
  user_id: `demo-${u}`,
  caption,
  media_type: 'image',
  media_url: art(c1, c2, label),
  thumbnail_url: null,
  location: loc || null,
  view_count: likes * 7,
  created_at: ago(h),
  updated_at: ago(h),
  profiles: P(u),
  like_count: likes,
  comment_count: comments,
  has_liked: false,
  has_saved: false,
}));

export const DEMO_STORIES: Story[] = DEMO_PROFILES.slice(0, 5).map((p, i) => ({
  id: `demo-story-${i + 1}`,
  user_id: p.id,
  media_url: art(['#f43f5e', '#0ea5e9', '#22c55e', '#8b5cf6', '#f59e0b'][i], '#111827', p.display_name!.split(' ')[0]),
  media_type: 'image',
  caption: null,
  created_at: ago(i + 1),
  expires_at: new Date(now + 20 * 3600_000).toISOString(),
  profiles: p,
  has_viewed: false,
  view_count: 40 + i * 13,
}));

const commentTexts = ['Harika olmuş! 😍', 'Bayıldım, elinize sağlık.', 'Burası neresi? Çok güzel.', 'Bunu denemem lazım!', 'Işık muhteşem.'];
export const demoComments = (postId: string): Comment[] =>
  commentTexts.slice(0, 3).map((content, i) => ({
    id: `${postId}-c${i}`,
    post_id: postId,
    user_id: DEMO_PROFILES[(i + 2) % DEMO_PROFILES.length].id,
    content,
    parent_id: null,
    created_at: ago(i + 1),
    updated_at: ago(i + 1),
    profiles: DEMO_PROFILES[(i + 2) % DEMO_PROFILES.length],
  }));

export const DEMO_HASHTAGS: Hashtag[] = ['seyahat', 'fotograf', 'tarif', 'yazilim', 'sanat', 'kosu', 'spor'].map((name, i) => ({
  id: `demo-tag-${i}`,
  name,
  created_at: ago(24),
  post_count: DEMO_POSTS.filter((p) => p.caption?.includes(`#${name}`)).length,
}));
