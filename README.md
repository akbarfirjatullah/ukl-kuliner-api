# API Resep Kuliner UKL

Backend API untuk aplikasi kuliner / resep yang dibuat menggunakan NestJS, Prisma, dan MySQL.

Project ini sudah mencakup:

- Autentikasi register dan login menggunakan JWT
- Password di-hash menggunakan bcrypt
- Role-based authorization untuk `ADMIN` dan `USER`
- CRUD resep
- CRUD kategori
- Fitur favorit resep
- Fitur rating dan ulasan
- Update otomatis `averageRating` dan `ratingCount` pada tabel resep
- Dokumentasi API menggunakan Swagger
- Prisma schema, seed admin, Docker MySQL, dan Dockerfile untuk deployment

## Tech Stack

- Framework: NestJS
- Bahasa: TypeScript
- ORM: Prisma
- Database: MySQL
- Dokumentasi: Swagger
- Auth: JWT, Passport, bcrypt

## Struktur Project

```text
src/
  auth/
  users/
  categories/
  recipes/
  favorites/
  reviews/
  prisma/
  common/
prisma/
  schema.prisma
  seed.ts
docker-compose.yml
Dockerfile
```

## Cara Menjalankan Project

Masuk ke folder project:

```bash
cd D:\UKLRPL
```

Install dependency:

```bash
npm install
```

Pastikan MySQL sudah berjalan. Kalau menggunakan XAMPP, nyalakan `MySQL` dari XAMPP Control Panel.

Buat database bernama:

```text
ukl_recipe_app
```

Contoh `.env` untuk XAMPP MySQL tanpa password:

```env
PORT=3000
DATABASE_URL="mysql://root:@localhost:3306/ukl_recipe_app"
JWT_SECRET="change-me-to-a-strong-random-secret-at-least-32-characters"
JWT_EXPIRES_IN="1d"
ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
ADMIN_NAME="Admin UKL"
ADMIN_EMAIL="admin@uklrecipe.com"
ADMIN_PASSWORD="Admin12345"
```

Jalankan migration:

```bash
npx prisma migrate dev --name init
```

Jalankan seed admin:

```bash
npm run seed
```

Jalankan server:

```bash
npm run start:dev
```

URL API:

```text
http://localhost:3000/api
```

Dokumentasi Swagger:

```text
http://localhost:3000/api/docs
```

## Akun Admin Awal

Setelah menjalankan seed, akun admin default adalah:

```text
Email: admin@uklrecipe.com
Password: Admin12345
```

## Cara Menggunakan Token

1. Login melalui `POST /api/auth/login`
2. Salin `accessToken` dari response
3. Klik tombol `Authorize` di Swagger
4. Masukkan token dengan format:

```text
Bearer TOKEN_ANDA
```

## Role Pengguna

`ADMIN` dapat:

- Membuat, mengubah, dan menghapus kategori
- Membuat, mengubah, dan menghapus resep
- Melihat daftar pengguna

`USER` dapat:

- Melihat kategori dan resep
- Mengelola favorit miliknya sendiri
- Membuat, mengubah, dan menghapus ulasan miliknya sendiri

## Endpoint Utama

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`

Users:

- `GET /api/users/me`
- `GET /api/users` - khusus admin
- `GET /api/users/:id` - khusus admin

Categories:

- `POST /api/categories` - khusus admin
- `GET /api/categories`
- `GET /api/categories/:id`
- `PATCH /api/categories/:id` - khusus admin
- `DELETE /api/categories/:id` - khusus admin

Recipes:

- `POST /api/recipes` - khusus admin
- `GET /api/recipes`
- `GET /api/recipes/:id`
- `PATCH /api/recipes/:id` - khusus admin
- `DELETE /api/recipes/:id` - khusus admin

Favorites:

- `GET /api/favorites`
- `POST /api/favorites/:recipeId`
- `DELETE /api/favorites/:recipeId`

Reviews:

- `GET /api/reviews/me`
- `GET /api/reviews/recipe/:recipeId`
- `POST /api/reviews/recipe/:recipeId`
- `PATCH /api/reviews/recipe/:recipeId`
- `DELETE /api/reviews/recipe/:recipeId`

## Logic Transaksi

Favorit:

- API mengecek apakah resep ada
- API mengecek apakah resep sudah ada di favorit user
- Data favorit disimpan atau dihapus di dalam Prisma transaction

Ulasan:

- Satu user hanya boleh memberi satu ulasan untuk satu resep
- Saat ulasan dibuat, diubah, atau dihapus, API menghitung ulang rating resep
- Field `averageRating` dan `ratingCount` pada resep akan diperbarui otomatis
- Proses ini berjalan dalam Prisma transaction agar data tetap konsisten

## Docker

Docker bersifat opsional untuk development lokal.

Kalau menggunakan XAMPP, Anda tidak wajib memakai Docker. Docker disediakan agar MySQL bisa dijalankan secara terpisah dan konsisten untuk project ini.

Kalau menjalankan MySQL dengan Docker Compose, siapkan variabel berikut di `.env` sebelum menjalankan perintah di bawah:

```env
MYSQL_ROOT_PASSWORD="ganti-password-root-docker"
MYSQL_DATABASE="ukl_recipe_app"
MYSQL_USER="nestuser"
MYSQL_PASSWORD="ganti-password-database-docker"
```

`DATABASE_URL` di aplikasi harus sesuai dengan `MYSQL_USER` dan `MYSQL_PASSWORD` di atas jika Anda memakai Docker.

Menjalankan MySQL dengan Docker:

```bash
docker compose up -d
```

Menghentikan Docker:

```bash
docker compose down
```

## Deployment

Project ini bisa dideploy ke Railway atau Render.

Environment variable yang perlu disiapkan di server:

```env
PORT=3000
DATABASE_URL="mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME"
JWT_SECRET="ganti-dengan-secret-production-yang-kuat-minimal-32-karakter"
JWT_EXPIRES_IN="1d"
ALLOWED_ORIGINS="https://frontend-anda.com"
ADMIN_NAME="Admin UKL"
ADMIN_EMAIL="admin@uklrecipe.com"
ADMIN_PASSWORD="Admin12345"
```

Build command:

```bash
npm install
npm run build
```

Start command:

```bash
npm run start:prod
```

Jika menggunakan Dockerfile, migration akan dijalankan otomatis sebelum server start:

```bash
npx prisma migrate deploy
```

## Catatan Untuk Frontend

Base URL lokal:

```text
http://localhost:3000/api
```

Frontend harus mengirim token login pada endpoint yang membutuhkan autentikasi:

```text
Authorization: Bearer TOKEN_ANDA
```

Endpoint publik seperti `GET /api/recipes` dan `GET /api/categories` tidak membutuhkan token.

Endpoint admin membutuhkan akun dengan role `ADMIN`.

## Perintah Penting

```bash
npm run start:dev
npm run build
npm run seed
npx prisma migrate dev --name init
npx prisma studio
```
