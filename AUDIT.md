# Audit Aplikasi — glm-pos

**Tanggal audit:** 2026-07-09  
**Versi:** 0.1.0  
**Stack:** Next.js 16.2.10 (Turbopack) · React 19.2 · Prisma 6.19 / SQLite · ws 8 · TypeScript 5 · Tailwind 4  
**Status build:** ❌ GAGAL (`tsc` error)  
**Status lint:** ❌ 1 error, 2 warnings

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Temuan Kritis (Critical)](#2-temuan-kritis-critical)
3. [Temuan Tinggi (High)](#3-temuan-tinggi-high)
4. [Temuan Sedang (Medium)](#4-temuan-sedang-medium)
5. [Temuan Rendah (Low)](#5-temuan-rendah-low)
6. [Tabel Ringkasan](#6-tabel-ringkasan)
7. [Rekomendasi Prioritas Perbaikan](#7-rekomendasi-prioritas-perbaikan)

---

## 1. Ringkasan Eksekutif

Aplikasi `glm-pos` adalah sistem POS restoran dengan modul kasir, dapur (kitchen display real-time via WebSocket), dashboard laporan, dan panel admin (produk, kategori, stok, resep/HPP, user). Secara fungsional cukup lengkap, namun audit menemukan:

- **Build produksi gagal** karena ketidakcocokan tipe antara schema Prisma (String) dan impor "enum" dari `@prisma/client` yang tidak ada (SQLite tidak mendukung enum native).
- **Celah keamanan kritis**: server actions tanpa cek otorisasi, endpoint broadcast WebSocket tanpa autentikasi, secret JWT hardcode.
- **Sejumlah bug logika & race condition** pada stok dan tanggal.
- **Tidak ada pengujian** sama sekali untuk logika finansial (pajak, kembalian, deduksi stok, HPP).

Dianjurkan **tidak deploy ke produksi** sampai temuan Kritis & Tinggi diperbaiki.

---

## 2. Temuan Kritis (Critical)

### C1. Build gagal — impor enum Prisma yang tidak ada

**Lokasi:**

- `src/app/actions.ts:269` (error pertama yang muncul)
- Sumber akar menyebar di **9 file**:
  - `src/app/admin/actions.ts:3` → `import { UserRole } from "@prisma/client"`
  - `src/app/dashboard/actions.ts:3` → `import { OrderStatus } from "@prisma/client"`
  - `src/app/kitchen/actions.ts:3` → `import { KitchenTicketStatus } from "@prisma/client"`
  - `src/components/kitchen/KitchenDisplay.tsx:3` → `import { KitchenTicketStatus } from "@prisma/client"`
  - `src/components/admin/UserManager.tsx:4` → `import { UserRole } from "@prisma/client"`
  - `src/components/dashboard/OrderHistory.tsx` → `import { PaymentMethod } from "@prisma/client"`
  - `src/components/pos/Receipt.tsx` → `import { PaymentMethod } from "@prisma/client"`
  - `src/components/pos/CheckoutModal.tsx` (sudah work-around dengan `enum PaymentMethod` lokal)
  - `src/app/actions.ts` (tidak impor langsung, tapi memakai tipe hasil)

**Penjelasan:**  
`prisma/schema.prisma` mendefinisikan `role`, `status`, `paymentMethod` dll sebagai `String` karena SQLite tidak mendukung `enum`. Karena itu Prisma **tidak** meng-generate `OrderStatus`, `KitchenTicketStatus`, `UserRole`, atau `PaymentMethod` sebagai enum. Impor tersebut akan:

- **TypeScript:** `string` tidak bisa ditugaskan ke `KitchenTicketStatus` (tidak ada) → `next build` gagal di type-check.
- **Runtime:** `KitchenTicketStatus.PENDING` dst. menjadi `undefined` (jika build dilewati) sehingga tombol transisi status di Kitchen Display, filter order Completed di dashboard, dan perbandingan role di semua layar akan **rusak**.

**Output build:**

```
./src/app/actions.ts:269:9
Type error: Type 'string' is not assignable to type 'KitchenTicketStatus'.
```

**Rekomendasi:**  
Gunakan tipe union string dari `src/types/index.ts` (sudah ada: `UserRole`, `PaymentMethod`, `OrderStatus`, `KitchenTicketStatus`). Buat objek konstanta/`Record` sebagai pengganti nilai enum runtime, contoh:

```ts
// src/lib/status.ts
export const OrderStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
```

Lalu ganti semua impor `from "@prisma/client"` (kecuali `PrismaClient`) ke `@/types` / `@/lib/status`.

---

### C2. Server actions TANPA cek otorisasi

**Lokasi:**

- `src/app/admin/actions.ts` — semua action (createProduct, updateProduct, adjustStock, deleteProduct, createUser, updateUser, deleteUser, semua action ingredient & recipe)
- `src/app/kitchen/actions.ts` — `updateKitchenTicketStatus`
- `src/app/dashboard/actions.ts` — semua action (getDashboardStats, getTopProducts, getOrderHistory, getOrderDetail)
- `src/app/actions.ts` — `createOrder`, `getProducts`, `getCategories`, `getTables`

**Penjelasan:**  
Middleware (`src/middleware.ts`) hanya melindungi **route pages**, bukan panggilan langsung ke server actions. Server actions di Next.js adalah endpoint yang dapat dipanggil via request khusus dari klien. Saat ini:

- Tidak ada `getSession()` atau cek role di awal action admin. Seorang `KASIR`, `PELAYAN`, atau bahkan pengguna yang telah logout (jika cookie masih valid) dapat memanggil `createUser` / `deleteUser` / `createProduct` secara langsung via fetch internal.
- `createOrder` mengambil `session?.userId` (opsional) tetapi tidak memastikan role atau bahwa sesi masih aktif.

**Dampak:**  
Eskalasi hak akses — pengguna non-admin dapat mengelola seluruh data (termasuk membuat akun ADMIN baru) dengan memanggil server action langsung.

**Rekomendasi:**  
Tambahkan guard otorisasi di awal setiap server action:

```ts
export async function createUser(input: UserFormInput) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Tidak ada izin." };
  }
  // ...lanjut
}
```

Buat helper `requireRole(roles: UserRole[])` untuk mengurangi duplikasi.

---

### C3. Endpoint broadcast WebSocket TANPA autentikasi

**Lokasi:** `server/ws-server.ts:8-28`

**Penjelasan:**

```ts
if (req.method === "POST" && req.url === "/broadcast") {
  // ... langsung relay body ke SEMUA klien WS
}
```

Tidak ada token, secret, origin check, atau signature. Siapa pun yang bisa menjangkau `http://host:3001/broadcast` dapat:

- Menyuntik payload JSON sembarang ke semua klien Kitchen Display.
- Karena klien (`KitchenDisplay.tsx`) memanggil `refresh()` tanpa validasi payload, ini bisa memicu render data palsu atau (jika ada XSS) eksekusi skrip.

**Rekomendasi:**

- Validasi header secret bersama (mis. `x-ws-secret`) yang hanya diketahui server Next.
- Batasi origin/host yang boleh POST.
- Validasi bentuk payload sebelum relay.

---

### C4. Koneksi WebSocket tanpa autentikasi & tanpa heartbeat

**Lokasi:** `server/ws-server.ts:30-35`

**Penjelasan:**

```ts
wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});
```

- Tidak ada verifikasi token/cookie pada koneksi WS.
- Tidak ada `ping`/`pong` → klien mati (mis. tab tutup tanpa `close`) tetap di `Set` selamanya, menyebabkan memory leak & pengiriman ke soket mati.
- Klien `KitchenDisplay` juga langsung mempercayai pesan masuk tanpa validasi.

**Rekomendasi:**

- Autentikasi saat upgrade (query token atau sub-protokol) atau putus koneksi tanpa sesi.
- Aktifkan `pingInterval`/`pingTimeout` pada `WebSocketServer`.
- Di klien, validasi `event.type` sebelum memproses.

---

### C5. JWT Secret lemah & hardcode (sama dengan fallback default)

**Lokasi:**

- `.env:2` → `JWT_SECRET="glm-pos-dev-secret-change-in-production"`
- `src/lib/auth.ts:7` dan `src/middleware.ts:8` → fallback `"glm-pos-dev-secret-change-in-production"`

**Penjelasan:**  
Secret di `.env` identik dengan default di kode. Siapa pun yang membaca repo dapat **menyimpan token sendiri** untuk peran apa pun (`role: "ADMIN"`) dan mendapatkan akses penuh. Karena `.gitignore` mengabaikan `.env*` (kecuali `.env.example`), berkas `.env` sebenarnya tidak ikut commit — tetapi nilai default di kode adalah masalah, dan `.env` lokal memakai nilai yang sama.

**Rekomendasi:**

- Hapus fallback default; gagalkan startup bila `JWT_SECRET` kosong:
  ```ts
  const raw = process.env.JWT_SECRET;
  if (!raw) throw new Error("JWT_SECRET wajib di-set");
  const SECRET = new TextEncoder().encode(raw);
  ```
- Generate secret kuat acak untuk setiap environment (min. 32 byte).

---

## 3. Temuan Tinggi (High)

### H6. Lint error — `set-state-in-effect`

**Lokasi:** `src/components/kitchen/KitchenDisplay.tsx:57-59`

**Penjelasan:**

```ts
useEffect(() => {
  setTickets(initialTickets);
}, [initialTickets]);
```

Memanggil `setState` sinkron di dalam `useEffect` menyebabkan render berantai (cascading renders) dan dilarang aturan React 19 (aturan `react-hooks/set-state-in-effect`). Karena `initialTickets` berubah setelah `router.refresh()`, ini juga bisa reset tiket yang sedang dilihat user.

**Rekomendasi:**  
Gunakan pola "derived state with reset key" — remount via `key` dari parent, atau gabung dengan state sinkron via `useSyncExternalStore` / guarded update.

---

### H7. Konvensi `middleware` sudah deprecated (Next.js 16)

**Lokasi:** `src/middleware.ts`

**Penjelasan:**  
Build memberi warning: _"The 'middleware' file convention is deprecated. Please use 'proxy' instead."_ Di Next.js 16, file harus bernama `proxy.ts`. Bisa gagal di minor rilis berikutnya.

**Rekomendasi:**  
Ganti nama `src/middleware.ts` → `src/proxy.ts` dan sesuaikan export bila perlu.

---

### H8. Bug zona waktu pada filter tanggal dashboard

**Lokasi:** `src/lib/date.ts:8-11`

**Penjelasan:**

```ts
const start = new Date(`${dateFrom}T00:00:00`); // lokal
const end = new Date(`${dateTo}T23:59:59.999`); // lokal
```

String tanpa suffix zona waktu diurai sebagai **waktu lokal server**. `Order.createdAt` disimpan UTC oleh Prisma, dan `generateOrderNumber` memakai `toISOString()` (UTC). Jika server berbeda zona dengan bisnis:

- Pesanan dibuat 23:30 WITA (15:30 UTC) mungkin masuk "hari berikutnya" di filter.
- Laporan harian bisa lobang/ganda di sekitar tengah malam.

**Rekomendasi:**  
Standardisasi: simpan & query UTC, atau eksplisit pakai offset zona bisnis (mis. `"+08:00"`). Contoh:

```ts
const start = new Date(`${dateFrom}T00:00:00+08:00`);
```

Ideally, kalender UI menampilkan zona bisnis; query konsisten.

---

### H9. Race condition (TOCTOU) pada validasi stok `createOrder`

**Lokasi:** `src/app/actions.ts:104-203`

**Penjelasan:**

1. Produk & bahan di-fetch **sebelum** transaksi.
2. Validasi stok dilakukan di luar transaksi.
3. Di dalam `$transaction`, stok di-decrement tanpa cek ulang.

Dua request `createOrder` bersamaan bisa **lolos validasi** (keduanya melihat stok cukup) lalu keduanya men-decrement → stok negatif.

**Rekomendasi:**  
Lakukan validasi di dalam transaksi dengan update bersyarat, misal:

```ts
const updated = await tx.product.updateMany({
  where: { id, stock: { gte: qty } },
  data: { stock: { decrement: qty } },
});
if (updated.count === 0) throw new Error("Stok tidak cukup");
```

Tangkap error dan kembalikan pesan ramah. Lakukan hal serupa untuk ingredient.

---

## 4. Temuan Sedang (Medium)

### M10. Transaksi Prisma sequential `await` per item (inefisien)

**Lokasi:** `src/app/actions.ts:186-203`

```ts
for (const item of input.items) {
  if (...) await tx.product.update(...);
}
for (const [ingredientId, need] of ingredientNeeds) {
  await tx.ingredient.update(...);
}
```

Banyak round-trip DB berturut-turut. Untuk keranjang besar, lambat.

**Rekomendasi:** Kumpulkan jadi `Promise.all` (lebih aman dalam transaction karena satu koneksi) atau `updateMany`/`createMany`.

---

### M11. `revalidateAll()` tidak dipanggil pada CRUD user

**Lokasi:** `src/app/admin/actions.ts:202-274` (`createUser`, `updateUser`, `deleteUser`)

Helper `revalidateAll()` didefinisikan, tetapi **tidak** dipanggil setelah mutasi user. Daftar user admin tidak akan refresh otomatis sampai reload manual.

**Rekomendasi:** Tambahkan `revalidateAll()` (atau `revalidatePath("/admin")`) di akhir ketiga action tersebut.

---

### M12. "Hapus" sebenarnya soft-delete — pesan menyesatkan

**Lokasi:** `src/app/admin/actions.ts:137,264,346` (`deleteProduct`, `deleteUser`, `deleteIngredient`)

Fungsi bernama `delete*` tetapi hanya men-set `isActive: false`. Pesan error "Gagal menghapus..." bisa menyesatkan. Selain itu tidak ada path hard-delete, sehingga DB tumbuh tanpa batas.

**Rekomendasi:** Ganti nama menjadi `deactivate*` / `archive*` (atau beri opsi hard-delete untuk admin), dan perbaiki copy pesan.

---

### M13. Risiko kolisi nomor order/tiket

**Lokasi:** `src/app/actions.ts:61-75`

`generateOrderNumber()` & `generateTicketNumber()` memakai timestamp + `Math.random()` 3 digit (`900 + 100`). Pada >100 order/detik dalam window waktu yang sama, kolisi pada kolom `@unique` → rollback transaksi & gagal order.

**Rekomendasi:** Pakai counter/sekuens DB, atau `crypto.randomUUID()`-based, atau tambahkan retry pada kolisi.

---

### M14. `getOrderDetail` rentan IDOR

**Lokasi:** `src/app/dashboard/actions.ts:89-103`

Tidak ada cek bahwa order milik/terkait pengguna atau tenant. Semua yang login bisa fetch order by ID (`where: { id: orderId }`).

**Rekomendasi:** Batasi per role/tenant; verifikasi sesi.

---

### M15. Semua `catch` menelan error senyap

**Lokasi:** Hampir semua server actions (mis. `actions.ts:289`, `admin/actions.ts:86,114`, `kitchen/actions.ts:87`)

```ts
} catch {
  return { success: false, error: "Gagal..." };
}
```

Tidak ada logging → debug & monitoring sangat sulit.

**Rekomendasi:** Tangkap error, log dengan context (`console.error(e)` atau logger), baru kembalikan pesan umum.

---

## 5. Temuan Rendah (Low)

### L16. Strategi enum tidak konsisten

`src/components/pos/CheckoutModal.tsx:4-10` mendefinisikan `enum PaymentMethod` lokal (dengan komentar mengakui masalah Prisma), sementara `Receipt.tsx` & `OrderHistory.tsx` masih impor dari `@prisma/client`. Pusatkan di `src/types/index.ts` + objek konstanta runtime.

---

### L17. Cast tidak perlu `as Promise<TableOption[]>`

**Lokasi:** `src/app/actions.ts:28` — Prisma sudah infer tipe. Hapus cast.

---

### L18. `getTaxRate` di-fetch per order tanpa cache

Bisa di-cache dengan `unstable_cache` / `React.cache` untuk mengurangi query DB pada setiap checkout.

---

### L19. `/broadcast` menumpun body tanpa batas ukuran

**Lokasi:** `server/ws-server.ts:11-13` (`body += chunk`). Tidak ada batas → DoS ringan (memory bloat). Batasi `Content-Length`/body size.

---

### L20. Tidak ada panduan DB produksi & variabel lingkungan

`.env.example` hanya SQLite `dev.db`. Tidak ada catatan upgrade ke Postgres/MySQL untuk produksi atau daftar env wajib (`JWT_SECRET`, `WS_SECRET`, dsb.).

---

### L21. Tidak ada pengujian

Zero file test. Logika finansial (pajak, kembalian, deduksi stok & bahan, HPP) berisiko regresi. Tambahkan minimal unit test untuk `createOrder`, `getProductCost`, `formatIDR`, `parseIDRInput`, dan helper tanggal.

---

### L22. Variabel tidak terpakai (warning lint)

- `src/app/actions.ts:287` — `const { kitchenTicket: _, ...orderResult } = order;` (`_` unused)
- `src/components/admin/UserManager.tsx:4` — `X` (lucide) diimpor tak terpakai.

---

### L23. `tsconfig` kurang ketat untuk akses indeks

Logika inventaris memakai `ingredientNeeds.get(...)` dan akses array. Aktifkan `noUncheckedIndexedAccess` agar akses `Map.get`/array diperiksa aman (tipuan bug null).

---

## 6. Tabel Ringkasan

| #   | ID  | Severity    | Kategori          | Lokasi Utama                                   |
| --- | --- | ----------- | ----------------- | ---------------------------------------------- |
| 1   | C1  | 🔴 Critical | Build/Correctness | `src/app/actions.ts:269` + 9 file              |
| 2   | C2  | 🔴 Critical | Security          | semua `*/actions.ts`                           |
| 3   | C3  | 🔴 Critical | Security          | `server/ws-server.ts:8`                        |
| 4   | C4  | 🔴 Critical | Security          | `server/ws-server.ts:30`                       |
| 5   | C5  | 🔴 Critical | Security          | `.env`, `src/lib/auth.ts:7`                    |
| 6   | H6  | 🟠 High     | Lint/React        | `src/components/kitchen/KitchenDisplay.tsx:58` |
| 7   | H7  | 🟠 High     | Deprecated        | `src/middleware.ts`                            |
| 8   | H8  | 🟠 High     | Correctness/TZ    | `src/lib/date.ts:9`                            |
| 9   | H9  | 🟠 High     | Race condition    | `src/app/actions.ts:104-203`                   |
| 10  | M10 | 🟡 Medium   | Performance       | `src/app/actions.ts:186`                       |
| 11  | M11 | 🟡 Medium   | Correctness       | `src/app/admin/actions.ts:202-274`             |
| 12  | M12 | 🟡 Medium   | UX/Design         | `src/app/admin/actions.ts:137,264,346`         |
| 13  | M13 | 🟡 Medium   | Reliability       | `src/app/actions.ts:61-75`                     |
| 14  | M14 | 🟡 Medium   | Security/IDOR     | `src/app/dashboard/actions.ts:89`              |
| 15  | M15 | 🟡 Medium   | Observability     | semua `catch` server actions                   |
| 16  | L16 | 🟢 Low      | Consistency       | `CheckoutModal.tsx` vs `Receipt.tsx`           |
| 17  | L17 | 🟢 Low      | Code quality      | `src/app/actions.ts:28`                        |
| 18  | L18 | 🟢 Low      | Performance       | `src/app/actions.ts:52`                        |
| 19  | L19 | 🟢 Low      | Security/DoS      | `server/ws-server.ts:11`                       |
| 20  | L20 | 🟢 Low      | Docs/Ops          | `.env.example`                                 |
| 21  | L21 | 🟢 Low      | Testing           | (proyek)                                       |
| 22  | L22 | 🟢 Low      | Lint warnings     | `actions.ts:287`, `UserManager.tsx:4`          |
| 23  | L23 | 🟢 Low      | TS strictness     | `tsconfig.json`                                |

| Ringkasan            | Critical | High  | Medium | Low    | Total  |
| -------------------- | -------- | ----- | ------ | ------ | ------ |
| Security             | 4        | 0     | 1      | 1      | 6      |
| Build/Correctness    | 1        | 2     | 1      | 0      | 4      |
| Performance          | 0        | 0     | 1      | 1      | 2      |
| Architecture/Quality | 0        | 2     | 3      | 5      | 10     |
| Testing/Ops/Docs     | 0        | 0     | 0      | 3      | 3      |
| **Total**            | **5**    | **4** | **6**  | **10** | **25** |

---

## 7. Rekomendasi Prioritas Perbaikan

### Sprint 0 — Bloker Produksi (harus sebelum go-live)

1. **C1** — Perbaiki impor enum: ganti ke union string & objek konstanta di `src/types` & `src/lib/status`. Verifikasi `npm run build` lulus.
2. **C2** — Tambah guard otorisasi (`requireRole`) di semua server actions.
3. **C3 + C4** — Autentikasi WS: secret header pada `/broadcast`, token pada koneksi, ping/pong, validasi payload.
4. **C5** — Hapus default JWT; gagal startup bila kosong; rotasi secret.

### Sprint 1 — Kualitas & Correctness

5. **H6** — Refactor `KitchenDisplay` useEffect.
6. **H7** — Rename `middleware.ts` → `proxy.ts`.
7. **H8** — Standardisasi zona waktu query tanggal.
8. **H9** — Atomic validate-and-decrement stok.
9. **M11** — Panggil `revalidateAll()` di CRUD user.

### Sprint 2 — Robustness

10. **M10** — Batch update dalam transaction.
11. **M13** — Sistem nomor order tahan kolisi.
12. **M14** — Scope `getOrderDetail`.
13. **M15** — Logging error di `catch`.

### Sprint 3 — Polish

14. **L16–L23** — Konsolidasi enum, bersihkan lint, aktifkan `noUncheckedIndexedAccess`, tambah unit test, batas body `/broadcast`, dokumentasi env.

---

_Akhir laporan audit `glm-pos`._
