## Umumiy holat

Hozir loyihada butun ma'lumot (mahsulot, buyurtma, sklad, do'kon, xodim, mashina, qarz, admin login) faqat `localStorage`da (`src/routes/index.tsx` ichidagi `safeGet`/`safeSet`) saqlanadi. Shuning uchun har bir qurilma o'z alohida nusxasini ko'radi va real-time sinxronizatsiya yo'q. Rasm ham faqat URL orqali. Til aralash (English/Uzbek).

Bu ro'yxatdagi hamma narsani bitta xabarda qilib bo'lmaydi — bu bir necha kunlik ish. Shuning uchun bosqichma-bosqich boramiz, har bosqichdan keyin build va ishlashini tekshiramiz.

## 0-bosqich — Backend yoqish (majburiy)

`localStorage`dan chiqish, real-time, rasm yuklash, Auth, RLS — bularning hammasi backend talab qiladi. **Lovable Cloud** (Supabase asosida) yoqilishi kerak. Bu bepul, tashqi hisob talab qilmaydi.

## 1-bosqich — Ma'lumotlar bazasi + realtime (eng muhim)

Jadvallar:
- `categories`, `products` (stock, box_stock, low_stock, unit_price, box_price, description, images[])
- `shops`, `employees`, `vehicles`
- `orders` (order_number — har do'kon uchun ketma-ket, status, total, payment_type), `order_items`
- `debt_payments`, `stock_movements`, `price_history`, `audit_log`, `info`
- `user_roles` (admin/xodim rollari — profiles jadvalida emas)

Har bir jadval uchun RLS + GRANT. `stock`/`box_stock` buyurtma tasdiqlanganda trigger/RPC orqali avtomatik kamayadi va `stock_movements`ga yoziladi. Supabase Realtime `products` va `orders`ga yoqiladi — barcha panel darhol yangilanadi. Barcha `safeGet`/`safeSet` Supabase so'rovlariga almashtiriladi.

## 2-bosqich — Xavfsizlik va admin login

- Supabase Auth (email + parol). Birinchi admin akkaunt DB seed orqali (public signup yo'q).
- `user_roles` + `has_role()` security-definer funksiya. RLS: mijoz faqat mahsulot va o'z buyurtmasini ko'radi.
- Admin Settings → "Parolni almashtirish" (avval eski parolni tekshirish).
- Login xato bo'lsa: "Login yoki parol noto'g'ri".
- Sessiya saqlanadi, "Chiqish" tugmasi. Plain-text parollar butunlay olib tashlanadi.

## 3-bosqich — To'liq o'zbek tiliga o'tkazish

Butun UI, tugma, xato/muvaffaqiyat xabarlari, `alert`/`confirm` dialoglari, Supabase Auth xatolari — hammasi lotin yozuvida. "so'm" qoldiriladi, sana kun/oy/yil.

## 4-bosqich — Buyurtma jarayoni

- Status: Qabul qilindi → Tayyorlanmoqda → Yo'lda → Yetkazildi → Bekor qilindi. Admin/xodim o'zgartiradi, mijoz realtime ko'radi.
- Har buyurtmaga `order_number` (do'kon bo'yicha ketma-ket).
- Savatni yakuniy tasdiqlashdan oldin ko'rish (Cart review).
- Minimal buyurtma summasi (admin sozlaydi).
- PDF chek (do'kon nomi, raqam, dona/karobka, jami).

## 5-bosqich — Sklad va ogohlantirishlar

- `stock_movements` tarixi (kim, qachon, qancha, sabab) — Sklad tabida qidiruv/saralash.
- Kam qolgan mahsulotlar admin dashboardda banner + Products/Warehouse’da qizil belgi.

## 6-bosqich — Mahsulot: rasm, narx, tavsif, variant

- **Bir nechta rasm** (10–15 tagacha) qurilma/galereyadan yuklash, avtomatik siqish (browser resize), Supabase Storage’ga. Karusel/gallereya sifatida ko'rsatish. URL fallback saqlanadi.
- Dona narxi va karobka narxi — ikkalasi alohida qo'lda kiritiladi (auto-calc yo'q). Mijoz kartochkasida ikkita alohida "− qty +".
- Ixtiyoriy tavsif maydoni.
- Mahsulot varianti (o'lcham/tam) — savatga qo'shishdan oldin tanlanadi.
- Chegirma/promo kod tizimi (admin yaratadi, checkoutda ishlaydi).

## 7-bosqich — Mijoz qulayligi

- Nom bo'yicha qidiruv + kategoriya filtri (birga ishlaydi).

## 8-bosqich — Admin dashboard va hisobotlar

- Dashboard: bugungi buyurtma soni va daromadi, hafta/oy jami, kam qolgan mahsulot soni, kutilayotgan buyurtmalar.
- Reports: kunlik/haftalik/oylik savdo (jadval + chart), top-10 mahsulot, xodim/mashina bo'yicha yetkazilgan buyurtmalar, kunlik naqd vs qarz.
- Narx tarixi (har o'zgarganda log).
- Audit log (narx o'zgarishi, mahsulot o'chirilishi, buyurtma bekor qilinishi, sklad tuzatilishi) — read-only tab.
- Export/Import (JSON/Excel) zaxira.

## 9-bosqich — Xodim paneli

- Kunlik yo'nalish ko'rinishi (biriktirilgan do'konlar ro'yxati, imkon bo'lsa xarita).
- Xodim ish jurnali (kuniga nechta buyurtma yetkazgan, vaqt bilan).

## 10-bosqich — Bildirishnomalar va 2FA

- Telegram bot: yangi buyurtma → admin; status o'zgarishi → mijoz; kam qolgan zaxira → admin. Token secret sifatida saqlanadi.
- Admin uchun 2FA (Supabase TOTP).

---

## Texnik eslatma

Bu ro'yxat juda katta — realistik baho: **10+ mustaqil bosqich**, har biri o'zicha katta. Men bularni yuqoridagi tartibda, **har xabarda 1–2 bosqichdan** ketma-ket bajaraman va har biridan keyin build/ishlashini tekshiraman. Aks holda bitta xabarda hammasini urishga urinsak — kod sinadi, xatolarni topib bo'lmaydi.

## Sizdan tasdiq kerak

1. **Lovable Cloud yoqishimga ruxsat berasizmi?** (Bosqich 0 — bularsiz keyingi hech narsani qilib bo'lmaydi.)
2. **1 va 2-bosqichdan boshlaymanmi** (baza + realtime + Auth + admin login) — ular tayyor bo'lgach 3-bosqich (to'liq o'zbekcha) va keyin qolganlariga o'taman?
3. Birinchi admin uchun email/parolni siz beringmi yoki men Cloud yoqilgach avvalgi `Svitlogorie.Urgench` login uchun `admin@svitlo.uz` kabi email yarataymi?
