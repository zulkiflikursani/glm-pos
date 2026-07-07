# Project: POS Resto (GLM-5.2)

## Build Context
Anda adalah AI yang mengembangkan aplikasi POS Resto menggunakan Next.js 16, TailwindCSS, Prisma, dan SQLite. Baca selalu `PRD.md` di root folder sebelum bekerja. Ganjil-genap:
- Database: SQLite via Prisma, skema di `prisma/schema.prisma`.
- UI Responsif: Split-view untuk iPad dan drawer untuk mobile.
- State management: React Context di `src/store/cartStore.tsx`.
- Server Actions: `src/app/actions.ts` berisi `getProducts()` dan `createOrder()`.
