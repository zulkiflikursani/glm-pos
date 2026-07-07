import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Makanan" },
      update: {},
      create: { name: "Makanan" },
    }),
    prisma.category.upsert({
      where: { name: "Minuman" },
      update: {},
      create: { name: "Minuman" },
    }),
    prisma.category.upsert({
      where: { name: "Cemilan" },
      update: {},
      create: { name: "Cemilan" },
    }),
  ]);

  const [makanan, minuman, cemilan] = categories;

  const products = [
    { name: "Nasi Goreng Spesial", price: 25000, emoji: "🍛", categoryId: makanan.id, stock: 50, trackStock: true },
    { name: "Mie Goreng", price: 22000, emoji: "🍜", categoryId: makanan.id, stock: 40, trackStock: true },
    { name: "Ayam Bakar", price: 35000, emoji: "🍗", categoryId: makanan.id, stock: 30, trackStock: true },
    { name: "Sate Ayam (10 tusuk)", price: 30000, emoji: "🍢", categoryId: makanan.id, stock: 25, trackStock: true },
    { name: "Gado-Gado", price: 20000, emoji: "🥗", categoryId: makanan.id, stock: 20, trackStock: true },
    { name: "Es Teh Manis", price: 8000, emoji: "🧋", categoryId: minuman.id, stock: 100, trackStock: true },
    { name: "Es Jeruk", price: 10000, emoji: "🍊", categoryId: minuman.id, stock: 80, trackStock: true },
    { name: "Kopi Hitam", price: 12000, emoji: "☕", categoryId: minuman.id, stock: 60, trackStock: true },
    { name: "Jus Alpukat", price: 18000, emoji: "🥑", categoryId: minuman.id, stock: 30, trackStock: true },
    { name: "Air Mineral", price: 5000, emoji: "💧", categoryId: minuman.id, stock: 200, trackStock: false },
    { name: "Keripik Kentang", price: 15000, emoji: "🥔", categoryId: cemilan.id, stock: 35, trackStock: true },
    { name: "Pisang Goreng", price: 12000, emoji: "🍌", categoryId: cemilan.id, stock: 25, trackStock: true },
    { name: "Tahu Isi", price: 10000, emoji: "🫘", categoryId: cemilan.id, stock: 30, trackStock: true },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: product,
      });
    } else {
      await prisma.product.create({ data: product });
    }
  }

  await prisma.setting.upsert({
    where: { key: "tax_rate" },
    update: { value: "0.11" },
    create: { key: "tax_rate", value: "0.11" },
  });

  const tables = Array.from({ length: 10 }, (_, i) => i + 1);
  for (const number of tables) {
    await prisma.table.upsert({
      where: { number },
      update: {},
      create: { number },
    });
  }

  const users = [
    { username: "admin", name: "Administrator", password: "admin123", role: UserRole.ADMIN },
    { username: "kasir", name: "Kasir Utama", password: "kasir123", role: UserRole.KASIR },
    { username: "pelayan", name: "Pelayan 1", password: "pelayan123", role: UserRole.PELAYAN },
  ];

  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        name: user.name,
        password: hashed,
        role: user.role,
        isActive: true,
      },
      create: {
        username: user.username,
        name: user.name,
        password: hashed,
        role: user.role,
      },
    });
  }

  console.log("Seed selesai:");
  console.log(`  - ${categories.length} kategori`);
  console.log(`  - ${products.length} produk (dengan stok)`);
  console.log(`  - ${tables.length} meja`);
  console.log(`  - ${users.length} pengguna`);
  console.log("  - pengaturan pajak (11%)");
  console.log("");
  console.log("Akun default:");
  console.log("  admin / admin123   (Admin)");
  console.log("  kasir / kasir123   (Kasir)");
  console.log("  pelayan / pelayan123 (Pelayan)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
