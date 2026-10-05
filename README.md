# PinjeS

> **Pinjam apa pun, sebentar saja.**  
> Platform sewa barang dari toko rental lokal di sekitarmu dengan pembayaran langsung ke toko.

PinjeS menghubungkan penyewa yang membutuhkan barang untuk sementara waktu (kamera, tenda camping, konsol game, proyektor, drone, hingga perlengkapan acara) dengan toko-toko rental fisik di sekitar mereka. Tanpa perantara dompet digital pihak ketiga yang rumit, penyewa membayar sewa langsung ke toko (melalui QRIS atau Transfer Bank), lalu mengambil barang di lokasi toko.

---

## 🌟 Fitur Utama

### 1. Untuk Penyewa (Customer)
* **Jelajahi & Cari Barang:** Pencarian cerdas berdasarkan kata kunci, kategori, rentang harga, dan ketersediaan tanggal sewa.
* **Kalender Ketersediaan Real-Time:** Kalender interaktif dinamis yang langsung memblokir tanggal-tanggal yang sudah disewa agar tidak terjadi pemesanan ganda (*anti double-booking*).
* **Transparansi Biaya:** Perhitungan biaya sewa harian dan uang jaminan (*security deposit*) yang jelas sejak awal.
* **Pembayaran Langsung:** Pembayaran melalui QRIS atau transfer bank resmi toko dengan alur unggah bukti bayar yang praktis.
* **Timeline Status Pesanan:** Pelacakan status pesanan secara visual dari tahap verifikasi bayar, siap ambil di toko, masa sewa, hingga barang kembali.
* **Ulasan & Rating:** Memberikan ulasan dan penilaian bintang setelah barang dikembalikan.

### 2. Untuk Pemilik Toko (Store Owner)
* **Pendaftaran & Profil Toko:** Registrasi toko rental, pengaturan jam operasional, alamat fisik, titik koordinat peta, rekening bank, serta upload QRIS toko.
* **Manajemen Barang:** Tambah, edit, dan atur ketersediaan barang rental lengkap dengan galeri foto, ketentuan sewa, dan batas minimal/maksimal hari sewa.
* **Blokir Jadwal:** Kemampuan memblokir tanggal tertentu untuk perawatan barang (*maintenance*) secara manual.
* **Konfirmasi Pesanan:** Verifikasi bukti transfer pembayaran pelanggan dan pembaruan status serah terima barang.
* **Saldo Deposit Toko:** Sistem saldo deposit untuk pemotongan biaya layanan platform per transaksi sewa yang berhasil.

### 3. Untuk Administrator Platform
* **Verifikasi Toko:** Tinjau dan setujui/tolak permohonan pendaftaran toko rental baru.
* **Validasi Top-Up Saldo:** Verifikasi bukti transfer top-up saldo deposit dari pemilik toko.
* **Monitoring:** Pantau statistik transaksi, pengguna, dan toko aktif di seluruh sistem.

---

## 🛠️ Tech Stack & Architecture

Proyek ini dibangun di atas fondasi teknologi web paling mutakhir (*bleeding-edge*):

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions)
* **UI Library:** [React 19](https://react.dev/)
* **Styling & Design System:** [Tailwind CSS v4](https://tailwindcss.com/) dengan palet warna **OKLCH**, tipografi fluid `clamp()`, dan CSS scroll-driven animations
* **Tipografi:** [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) (Display Headings) + [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (Body Text)
* **Animasi Fisik & Mikro-interaksi:** [Motion 14](https://motion.dev/) (Framer Motion core)
* **Database & ORM:** [Prisma 7](https://www.prisma.io/) (SQLite untuk local development, siap dialihkan ke PostgreSQL untuk produksi)
* **Validasi & State:** [Zod 4](https://zod.dev/), [React Hook Form](https://react-hook-form.com/), dan [TanStack React Query v5](https://tanstack.com/query)
* **Testing:** [Vitest 5](https://vitest.dev/) dengan 102 automated integration/unit tests
* **Komponen & Ikon:** [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/), dan [Sonner](https://sonner.emilkowal.ski/)

---

## 🚀 Memulai (Local Development)

### 1. Prasyarat
Pastikan komputer Anda sudah terpasang:
* **Node.js** v20 atau lebih baru
* **npm** v10 atau lebih baru
* **Git**

### 2. Instalasi Dependensi
Clone repository dan pasang paket yang dibutuhkan:
```bash
git clone https://github.com/sharulwardana/Pinjes.git
cd Pinjes
npm install
```

### 3. Konfigurasi Environment Variable
Salin file konfigurasi contoh:
```bash
cp .env.example .env
```
Sesuaikan variabel di dalam `.env` bila diperlukan (secara default sudah siap digunakan untuk SQLite lokal).

### 4. Setup Database
Sinkronkan skema database Prisma dan buat file database lokal:
```bash
npx prisma db push
```

### 5. Jalankan Server Development
```bash
npm run dev
```
Buka browser dan akses [http://localhost:3000](http://localhost:3000).

---

## 🧪 Pengujian & Kualitas Kode

Menjalankan seluruh 102 automated tests dengan Vitest:
```bash
npm test
```

Menjalankan pemeriksaan tipe data TypeScript:
```bash
npm run typecheck
```

Menjalankan linter ESLint:
```bash
npm run lint
```

---

## 🔒 Kebijakan Integritas Keuangan & Data
1. **Integer Money:** Semua perhitungan finansial dan harga sewa disimpan dalam integer Rupiah murni (`Int`) untuk mencegah potensi *floating-point math error*.
2. **UTC Normalized Time:** Jadwal kalender sewa dinormalisasi ke UTC 00:00 dengan zona waktu bisnis `Asia/Jakarta`.
3. **Session Cookies:** Menggunakan HTTP-only cookie dengan enkripsi token yang aman.

---

## 📄 Lisensi
Hak Cipta © 2026 **PinjeS**. Dikembangkan untuk ekosistem rental lokal Indonesia.
