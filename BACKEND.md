# Backend — paguyupan-system

Backend berjalan **di dalam Next.js** (App Router) memakai **API Routes** + **Prisma ORM** + **MySQL**.

## Struktur

```
app/
  api/
    anggota/
      route.ts            # GET (list), POST (create)
      [id]/
        route.ts          # GET (detail), PUT (update), DELETE
    iuran/
      route.ts            # GET (list, filter periode/status)
      [id]/
        bayar/
          route.ts        # PATCH (tandai LUNAS)
    cron/
      iuran-bulanan/
        route.ts          # GET — generate tagihan bulanan (proteksi CRON_SECRET)
lib/
  prisma.ts               # Prisma Client singleton
prisma/
  schema.prisma           # definisi model (Anggota, Iuran)
generated/prisma/         # Prisma Client hasil generate (gitignored)
prisma.config.ts          # konfigurasi Prisma (load .env via dotenv)
```

## Setup pertama kali

1. **Siapkan database MySQL** dan isi kredensial di `.env`:

   ```
   DATABASE_URL="mysql://root:password@localhost:3306/paguyupan"
   ```

   > Punya Docker? `docker run --name paguyupan-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=paguyupan -p 3306:3306 -d mysql:8`

2. **Jalankan migrasi** (membuat tabel sesuai schema):

   ```
   npm run db:migrate        # prisma migrate dev
   ```

3. **Jalankan dev server:**
   ```
   npm run dev
   ```

## Endpoint

| Method | Path                                            | Fungsi                                 |
| ------ | ----------------------------------------------- | -------------------------------------- |
| GET    | `/api/anggota?status=AKTIF&q=budi`              | Daftar anggota                         |
| POST   | `/api/anggota`                                  | Tambah anggota                         |
| GET    | `/api/anggota/:id`                              | Detail + riwayat iuran                 |
| PUT    | `/api/anggota/:id`                              | Update anggota                         |
| DELETE | `/api/anggota/:id`                              | Hapus anggota                          |
| GET    | `/api/iuran?periode=2026-06&status=BELUM_BAYAR` | Daftar tagihan                         |
| PATCH  | `/api/iuran/:id/bayar`                          | Tandai tagihan LUNAS                   |
| GET    | `/api/cron/iuran-bulanan`                       | (cron) Generate tagihan bulan berjalan |

### Contoh

```bash
# Tambah anggota
curl -X POST http://localhost:3000/api/anggota \
  -H "Content-Type: application/json" \
  -d '{"nama":"Budi Santoso","email":"budi@mail.com","noTelp":"08123"}'

# List anggota aktif
curl http://localhost:3000/api/anggota?status=AKTIF

# Bayar iuran id 1
curl -X PATCH http://localhost:3000/api/iuran/1/bayar
```

## Cron job

Endpoint `/api/cron/iuran-bulanan` membuat tagihan iuran periode berjalan untuk
semua anggota AKTIF. Aman dipanggil berulang (pakai `skipDuplicates`).

Proteksi: harus mengirim header `Authorization: Bearer <CRON_SECRET>`.

- **Vercel:** jadwal sudah diset di `vercel.json` (`0 0 1 * *` = tiap tanggal 1).
  Vercel otomatis menambahkan header Authorization jika env `CRON_SECRET` diset.
- **VPS / crontab:**
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

## Catatan

- Field `jumlah` (Decimal) dikembalikan sebagai **string** di JSON agar presisi uang tidak hilang.
- Param dinamis route (`[id]`) di Next.js 16 berupa `Promise` — harus di-`await`.
