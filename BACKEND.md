# Backend — paguyupan-system

Backend berjalan **di dalam Next.js** (App Router) memakai **API Routes** + **Prisma ORM** + **MySQL**.

## Struktur

```
app/
  api/
    auth/
      login/route.ts        # POST — login, set cookie session
      logout/route.ts       # POST — hapus cookie session
      me/route.ts           # GET  — profil user yang login
    anggota/
      route.ts              # GET (list), POST (create — Admin only)
      [id]/
        route.ts            # GET (detail), PUT (update — Admin), DELETE (Admin)
    news/
      route.ts              # GET (list, semua login), POST (Admin/Sekertaris)
      [id]/
        route.ts            # GET (detail), PUT/DELETE (Admin/Sekertaris)
    upload/
      route.ts              # POST — upload gambar, return { url } (Admin/Sekertaris)
    iuran/
      route.ts              # GET (list)
      [id]/
        bayar/
          route.ts          # PATCH — tandai LUNAS (Admin only)
    cron/
      iuran-bulanan/
        route.ts            # GET — generate tagihan bulanan (proteksi CRON_SECRET)
lib/
  prisma.ts                 # Prisma Client singleton
  session.ts                # encrypt/decrypt JWT (jose), create/get/delete cookie session
  auth.ts                   # requireAuth / requireRole / requireAdmin
prisma/
  schema.prisma             # definisi model (Anggota, News, Iuran)
generated/prisma/           # Prisma Client hasil generate (gitignored)
prisma.config.ts            # konfigurasi Prisma (load .env via dotenv)
```

## Setup pertama kali

1. **Siapkan database MySQL** dan isi kredensial di `.env`:

   ```
   DATABASE_URL="mysql://root:password@localhost:3306/paguyupan"
   SESSION_SECRET="<openssl rand -hex 32>"
   ```

2. **Jalankan migrasi**:

   ```
   npm run db:migrate
   ```

3. **Seed data awal** (akun Admin + beberapa anggota contoh):

   ```bash
   npm run db:seed
   ```

   Menjalankan `prisma/seed.ts` via `tsx`. Memakai `upsert` berdasarkan `email`,
   jadi **aman dijalankan berulang** tanpa membuat duplikat.

   Akun hasil seed (lihat `prisma/seed.ts` untuk daftar lengkap), mis. Admin:
   `abdi@paguyupan.id`.

4. **Generate Prisma Client** (wajib setelah install atau update dependency):

   ```bash
   npm run db:generate
   ```

   Jika terlewat, akan muncul error:
   `@prisma/client did not initialize yet. Please run "prisma generate"`.

5. **Jalankan dev server:**

   ```
   npm run dev
   ```

## Autentikasi

Sistem memakai **stateless session** berbasis JWT yang disimpan di **HttpOnly cookie** (`session`). Library: `jose` (Edge-compatible) + `bcryptjs` untuk hash password.

### Flow Login

```
POST /api/auth/login  { email, password }
  → verifikasi email + bcrypt.compare
  → buat JWT (payload: anggotaId, role), simpan di cookie
  → return { id, nama, email, role }
```

### Roles

| Role         | Keterangan                                       |
| ------------ | ------------------------------------------------ |
| `ADMIN`      | CRUD penuh semua data + anggota                  |
| `SEKERTARIS` | CRUD news, read-only data lain                   |
| `BENDAHARA`  | Bisa lihat data (read-only)                      |
| `ANGGOTA`    | Bisa lihat data (read-only)                      |

### Guard Helpers (`lib/auth.ts`)

```ts
requireAuth()           // wajib login (401 jika tidak)
requireRole("ADMIN")    // wajib role tertentu (403 jika tidak)
requireAdmin()          // shortcut requireRole("ADMIN")
```

Penggunaan di route handler:

```ts
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response; // otomatis 401/403
  // ... lanjut logika
}
```

## Endpoint

### Auth

| Method | Path               | Guard        | Fungsi                      |
| ------ | ------------------ | ------------ | --------------------------- |
| POST   | `/api/auth/login`  | —            | Login, set cookie session   |
| POST   | `/api/auth/logout` | —            | Hapus cookie session        |
| GET    | `/api/auth/me`     | Login        | Return profil user login    |

### Anggota

| Method | Path                             | Guard  | Fungsi                      |
| ------ | -------------------------------- | ------ | --------------------------- |
| GET    | `/api/anggota?status=AKTIF&q=`   | Login  | Daftar anggota              |
| POST   | `/api/anggota`                   | Admin  | Tambah anggota (+ password) |
| GET    | `/api/anggota/:id`               | Login  | Detail + riwayat iuran      |
| PUT    | `/api/anggota/:id`               | Admin  | Update anggota / reset pw   |
| DELETE | `/api/anggota/:id`               | Admin  | Hapus anggota               |

### News

| Method | Path             | Guard          | Fungsi                          |
| ------ | ---------------- | -------------- | ------------------------------- |
| GET    | `/api/news?q=`   | Login          | Daftar berita (semua role)      |
| POST   | `/api/news`      | Admin/Sekertaris | Buat berita baru              |
| GET    | `/api/news/:id`  | Login          | Detail berita                   |
| PUT    | `/api/news/:id`  | Admin/Sekertaris | Update berita                 |
| DELETE | `/api/news/:id`  | Admin/Sekertaris | Hapus berita                  |

### Iuran

| Method | Path                                              | Guard | Fungsi                        |
| ------ | ------------------------------------------------- | ----- | ----------------------------- |
| GET    | `/api/iuran?periode=2026-06&status=BELUM_BAYAR`   | Login | Daftar tagihan                |
| PATCH  | `/api/iuran/:id/bayar`                            | Admin | Tandai tagihan LUNAS          |
| GET    | `/api/cron/iuran-bulanan`                         | Cron  | Generate tagihan bulan ini    |

### Contoh

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@paguyupan.id","password":"password123"}'

# Tambah anggota (perlu cookie session Admin)
curl -X POST http://localhost:3000/api/anggota \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"nama":"Budi Santoso","email":"budi@mail.com","password":"budi1234","noTelp":"08123","role":"ANGGOTA"}'

# List anggota (semua role login)
curl http://localhost:3000/api/anggota -b cookies.txt

# Logout
curl -X POST http://localhost:3000/api/auth/logout -b cookies.txt -c cookies.txt
```

## Cron job

Endpoint `/api/cron/iuran-bulanan` proteksi via header `Authorization: Bearer <CRON_SECRET>`.

- **Vercel:** `vercel.json` jadwal `0 0 1 * *` (tiap tanggal 1).
- **VPS:**
  ```
  0 0 1 * * curl -H "Authorization: Bearer $CRON_SECRET" https://domain/api/cron/iuran-bulanan
  ```

## Perintah berguna

| Perintah              | Fungsi                                        |
| --------------------- | --------------------------------------------- |
| `npm run db:migrate`  | Buat/terapkan migrasi (development)           |
| `npm run db:deploy`   | Terapkan migrasi (production)                 |
| `npm run db:push`     | Sinkronkan schema tanpa migrasi (prototyping) |
| `npm run db:generate` | Generate ulang Prisma Client                  |
| `npm run db:studio`   | Buka Prisma Studio (GUI database)             |
| `npm run db:seed`     | Isi data awal (`prisma/seed.ts`, idempotent)  |

## Catatan

- Field `jumlah` (Decimal) dikembalikan sebagai **string** di JSON.
- Param dinamis route (`[id]`) di Next.js 16 berupa `Promise` — harus di-`await`.
- `passwordHash` tidak pernah dikembalikan di response API (selalu di-`select` eksplisit tanpa field itu).
- Session JWT expire 8 jam. Cookie `httpOnly` + `sameSite: lax`.
- Upload gambar disimpan di `public/uploads/` dengan nama `<timestamp>-<randomHex>.<ext>`. Maks. 5 MB. Format: JPEG, PNG, WebP, GIF, AVIF.
- Setelah `npm install` atau update versi Prisma, **wajib jalankan** `npm run db:generate` agar Prisma Client ter-generate ulang. Tanpa ini, server akan error: `@prisma/client did not initialize yet`.
