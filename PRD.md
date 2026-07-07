# Product Requirements Document (PRD)
# Aplikasi POS Resto (Point of Sale)

## 1. Ringkasan Produk
Aplikasi POS (Point of Sale) berbasis web yang dirancang khusus untuk restoran, kafe, atau UMKM kuliner. Aplikasi ini dibangun menggunakan Next.js dengan UI/UX yang responsif dan dinamis, dioptimalkan untuk digunakan pada perangkat iPad (sebagai kasir utama) dan Handphone (sebagai mobile ordering/pelayanan). Aplikasi ini berjalan secara lokal (localhost) tanpa memerlukan server cloud berbayar.

## 2. Tujuan & Sasaran
- **Tujuan:** Menggantikan sistem pencatatan transaksi manual dengan sistem digital yang cepat, akurat, dan mudah digunakan.
- **Sasaran:**
  - UMKM kuliner yang ingin digitalisasi proses transaksi.
  - Restoran/kafe dengan multiple kasir namun terhubung dalam jaringan lokal.

## 3. target Pengguna
- **Kasir / Operator:** Menggunakan iPad untuk input pesanan dan memproses pembayaran.
- **Pelayan / Waitress:** Menggunakan handphone untuk mencatat pesanan langsung dari meja pelanggan.
- **Dapur** Menentukan posisi pesanan sudah beradai posis proses atau selesai.
- **Pemilik Usaha:** Memantau laporan penjualan harian dari perangkat apa pun.

## 4. Fitur Utama (MVP - Minimum Viable Product)

### 4.1. Manajemen Menu (Produk)
- Menampilkan daftar produk dalam bentuk kartu visual (Gambar/Emoji, Nama, Harga).
- Fitur pencarian produk by nama.
- Filter produk berdasarkan kategori (Makanan, Minuman, Cemilan, dll).
- **(Admin)** CRUD Produk: Tambah, ubah, hapus produk dan kategori.

### 4.2. Keranjang Belanja (Cart)
- Penambahan produk ke keranjang dengan satu klik ( Tap).
- Pengaturan kuan
- Penghapusan item dari keranjang.
- Kalkulasi otomatis: Subtotal, Pajak (configurable), dan Total Bayar.

### 4.3. Sistem Transaksi & Pembayaran
- Pemilihan metode pembayaran (Cash, QRIS, Debit, dll).
- Input nominal tunang (untuk menghitung kembalian).
- Simpan transaksi ke database lokal.
- Cetak struk (Sederhana, via browser print dialog).

### 4.4. Manajemen Meja (Opsional/MVP lanjutan)
- Peta/daftar meja restoran.
- Status meja (Kosong, Terisi).
- Hubungkan pesanan dengan nomor meja.

### 4.5. Laporan Penjualan (Dashboard)
- Total pendapatan harian.
- Jumlah transaksi.
- Produk terlaris.
- Riwayat transaksi (dengan filter tanggal).

### 4.5 Manajemen Stok 
- stok terdapat produk jadi dan produk mentah(bahan makanan/minuman)
- restoran merupakan proses bisnis mengubah bahan mentah menjadi bahan jadi. buatkankan struktur stok dari bahan mentah dan bahan jadi
- dari struktur tersebut buatkan resep untuk membuat HPP setiap produk dan sebagai dasar untuk penghitungan stok.
- manajemen stok harus sesuai dengan perhitungan berdasakan bahan yang digunakan.

## 5. Pengalaman Pengguna (UX) & Desain

### 5.1. Tampilan Responsif (Adaptive Layout)
- **Tablet (iPad) / Desktop:** 
  - Layout terbagi 2 (Split View). Kiri untuk pilih menu, kanan untuk keranjang aktif.
  - Mendukung *Drag and Drop* (opsional di masa depan) untuk memindahkan item ke meja.
- **Mobile (Handphone):**
  - Layout bertumpuk. Menu memenuhi layar.
  - Keranjang disembunyikan, dipanggil via tombol mengambang (FAB) yang membuka Drawer dari kanan layar.
  - Tombol dan area tap berukuran besar (Thumb-friendly) untuk mempermudah pelayan saat berdiri.

### 5.2. Mode Offline (Local-First)
- Aplikasi dan database berjalan 100% di localhost.
- Data tersimpan di perangkat lokal (SQLite), tidak butuh koneksi internet.
- Cepat, aman, dan tanpa biaya langganan.

## 6. Stack Teknologi
- **Framework:** Next.js 14 (App Router)
- **Bahasa:** TypeScript / JavaScript
- **UI:** Tailw
- **UI:** Tailwind CSS, Lucide React (Ikon)
- **Database:** SQLite (via Prisma ORM) - Gratis, berjalan lokal tanpa instalasi server terpisah.
- **State Management:** React Context / Zustand

## 7. Metrik Keberhasilan
- Waktu rata-rata input pesanan < 30 detik.
- Tidak ada bug逸
- UI dapat bertransisi mulus antara iPad mode ke mobile mode tanpa break

## 8. Roadmap Pengembangan
- **Fase 1 (MVP):** Katalog menu, Keranjang, Checkout, Simpan DB.
- **Fase 2:** Dashboard laporan harian, Manajemen produk (Admin panel).
- **Fase 3:** Kitchen Ticket System (Kirim order langsung ke dapur via WebSocket).
- **Fase 4:** Manajemen stok, Multi-user (Role: Admin, Kasir, Pelayan,dapur).
