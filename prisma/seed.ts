import { PrismaClient } from "@prisma/client";
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
    {
      name: "Nasi Goreng Spesial",
      price: 25000,
      emoji: "🍛",
      categoryId: makanan.id,
      stock: 50,
      trackStock: true,
    },
    {
      name: "Mie Goreng",
      price: 22000,
      emoji: "🍜",
      categoryId: makanan.id,
      stock: 40,
      trackStock: true,
    },
    {
      name: "Ayam Bakar",
      price: 35000,
      emoji: "🍗",
      categoryId: makanan.id,
      stock: 30,
      trackStock: true,
    },
    {
      name: "Sate Ayam (10 tusuk)",
      price: 30000,
      emoji: "🍢",
      categoryId: makanan.id,
      stock: 25,
      trackStock: true,
    },
    {
      name: "Gado-Gado",
      price: 20000,
      emoji: "🥗",
      categoryId: makanan.id,
      stock: 20,
      trackStock: true,
    },
    {
      name: "Es Teh Manis",
      price: 8000,
      emoji: "🧋",
      categoryId: minuman.id,
      stock: 100,
      trackStock: true,
    },
    {
      name: "Es Jeruk",
      price: 10000,
      emoji: "🍊",
      categoryId: minuman.id,
      stock: 80,
      trackStock: true,
    },
    {
      name: "Kopi Hitam",
      price: 12000,
      emoji: "☕",
      categoryId: minuman.id,
      stock: 60,
      trackStock: true,
    },
    {
      name: "Jus Alpukat",
      price: 18000,
      emoji: "🥑",
      categoryId: minuman.id,
      stock: 30,
      trackStock: true,
    },
    {
      name: "Air Mineral",
      price: 5000,
      emoji: "💧",
      categoryId: minuman.id,
      stock: 200,
      trackStock: false,
    },
    {
      name: "Keripik Kentang",
      price: 15000,
      emoji: "🥔",
      categoryId: cemilan.id,
      stock: 35,
      trackStock: true,
    },
    {
      name: "Pisang Goreng",
      price: 12000,
      emoji: "🍌",
      categoryId: cemilan.id,
      stock: 25,
      trackStock: true,
    },
    {
      name: "Tahu Isi",
      price: 10000,
      emoji: "🫘",
      categoryId: cemilan.id,
      stock: 30,
      trackStock: true,
    },
  ];

  // Upsert produk dan simpan map nama→id untuk relasi resep
  const productIdMap = new Map<string, string>();
  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });

    if (existing) {
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: product,
      });
      productIdMap.set(updated.name, updated.id);
    } else {
      const created = await prisma.product.create({ data: product });
      productIdMap.set(created.name, created.id);
    }
  }

  // -----------------------------------------------------------------------
  // Bahan mentah (raw material) — stok bahan baku & dasar HPP
  // -----------------------------------------------------------------------
  const ingredients = [
    { name: "Beras", unit: "gram", stock: 10000, unitCost: 40, isActive: true },
    {
      name: "Mie Kuning",
      unit: "gram",
      stock: 5000,
      unitCost: 50,
      isActive: true,
    },
    { name: "Ayam", unit: "gram", stock: 8000, unitCost: 60, isActive: true },
    {
      name: "Telur",
      unit: "butir",
      stock: 500,
      unitCost: 2500,
      isActive: true,
    },
    {
      name: "Kacang Tanah",
      unit: "gram",
      stock: 3000,
      unitCost: 80,
      isActive: true,
    },
    {
      name: "Tahu",
      unit: "potong",
      stock: 400,
      unitCost: 1000,
      isActive: true,
    },
    {
      name: "Kentang",
      unit: "gram",
      stock: 4000,
      unitCost: 45,
      isActive: true,
    },
    {
      name: "Pisang",
      unit: "buah",
      stock: 200,
      unitCost: 3000,
      isActive: true,
    },
    {
      name: "Minyak Goreng",
      unit: "ml",
      stock: 10000,
      unitCost: 50,
      isActive: true,
    },
    {
      name: "Bumbu Campur",
      unit: "gram",
      stock: 2000,
      unitCost: 100,
      isActive: true,
    },
    { name: "Garam", unit: "gram", stock: 2000, unitCost: 30, isActive: true },
    {
      name: "Gula Pasir",
      unit: "gram",
      stock: 5000,
      unitCost: 40,
      isActive: true,
    },
    {
      name: "Kopi Bubuk",
      unit: "gram",
      stock: 1000,
      unitCost: 200,
      isActive: true,
    },
    { name: "Teh", unit: "gram", stock: 1000, unitCost: 50, isActive: true },
    { name: "Jeruk", unit: "buah", stock: 300, unitCost: 2000, isActive: true },
    {
      name: "Alpukat",
      unit: "buah",
      stock: 150,
      unitCost: 8000,
      isActive: true,
    },
    {
      name: "Susu Kental Manis",
      unit: "ml",
      stock: 3000,
      unitCost: 100,
      isActive: true,
    },
    {
      name: "Es Batu",
      unit: "gram",
      stock: 20000,
      unitCost: 5,
      isActive: true,
    },
    {
      name: "Air Mineral",
      unit: "ml",
      stock: 50000,
      unitCost: 2,
      isActive: true,
    },
  ];

  const ingredientIdMap = new Map<string, string>();
  for (const ing of ingredients) {
    const existing = await prisma.ingredient.findUnique({
      where: { name: ing.name },
    });

    if (existing) {
      const updated = await prisma.ingredient.update({
        where: { id: existing.id },
        data: ing,
      });
      ingredientIdMap.set(updated.name, updated.id);
    } else {
      const created = await prisma.ingredient.create({ data: ing });
      ingredientIdMap.set(created.name, created.id);
    }
  }

  // -----------------------------------------------------------------------
  // Resep — hubungkan produk dengan bahan & hitung HPP
  // -----------------------------------------------------------------------
  const recipes: Array<[string, Array<[string, number]>]> = [
    [
      "Nasi Goreng Spesial",
      [
        ["Beras", 150],
        ["Telur", 1],
        ["Minyak Goreng", 30],
        ["Bumbu Campur", 20],
        ["Garam", 3],
      ],
    ],
    [
      "Mie Goreng",
      [
        ["Mie Kuning", 120],
        ["Telur", 1],
        ["Minyak Goreng", 25],
        ["Bumbu Campur", 15],
        ["Garam", 3],
      ],
    ],
    [
      "Ayam Bakar",
      [
        ["Ayam", 200],
        ["Minyak Goreng", 20],
        ["Bumbu Campur", 25],
        ["Garam", 3],
      ],
    ],
    [
      "Sate Ayam (10 tusuk)",
      [
        ["Ayam", 150],
        ["Kacang Tanah", 40],
        ["Bumbu Campur", 10],
        ["Garam", 2],
      ],
    ],
    [
      "Gado-Gado",
      [
        ["Tahu", 2],
        ["Kentang", 100],
        ["Telur", 1],
        ["Kacang Tanah", 30],
        ["Bumbu Campur", 15],
      ],
    ],
    [
      "Es Teh Manis",
      [
        ["Teh", 10],
        ["Gula Pasir", 20],
        ["Air Mineral", 200],
        ["Es Batu", 100],
      ],
    ],
    [
      "Es Jeruk",
      [
        ["Jeruk", 1],
        ["Gula Pasir", 20],
        ["Air Mineral", 150],
        ["Es Batu", 100],
      ],
    ],
    [
      "Kopi Hitam",
      [
        ["Kopi Bubuk", 15],
        ["Gula Pasir", 10],
        ["Air Mineral", 200],
      ],
    ],
    [
      "Jus Alpukat",
      [
        ["Alpukat", 1],
        ["Susu Kental Manis", 30],
        ["Gula Pasir", 15],
        ["Air Mineral", 100],
        ["Es Batu", 100],
      ],
    ],
    [
      "Keripik Kentang",
      [
        ["Kentang", 150],
        ["Minyak Goreng", 40],
        ["Garam", 3],
      ],
    ],
    [
      "Pisang Goreng",
      [
        ["Pisang", 1],
        ["Minyak Goreng", 30],
        ["Garam", 1],
      ],
    ],
    [
      "Tahu Isi",
      [
        ["Tahu", 3],
        ["Kentang", 50],
        ["Bumbu Campur", 10],
        ["Minyak Goreng", 25],
      ],
    ],
  ];

  for (const [productName, items] of recipes) {
    const productId = productIdMap.get(productName);
    if (!productId) continue;

    const recipeItems = items
      .map(([ingName, qty]) => {
        const ingredientId = ingredientIdMap.get(ingName);
        return ingredientId ? { ingredientId, quantity: qty } : null;
      })
      .filter(
        (x): x is { ingredientId: string; quantity: number } => x !== null,
      );

    if (!recipeItems.length) continue;

    const recipe = await prisma.recipe.upsert({
      where: { productId },
      update: {},
      create: { productId },
    });

    await prisma.recipeItem.deleteMany({ where: { recipeId: recipe.id } });
    await prisma.recipeItem.createMany({
      data: recipeItems.map((item) => ({
        recipeId: recipe.id,
        ingredientId: item.ingredientId,
        quantity: item.quantity,
      })),
    });
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
    {
      username: "admin",
      name: "Administrator",
      password: "admin123",
      role: "ADMIN" as const,
    },
    {
      username: "kasir",
      name: "Kasir Utama",
      password: "kasir123",
      role: "KASIR" as const,
    },
    {
      username: "pelayan",
      name: "Pelayan 1",
      password: "pelayan123",
      role: "PELAYAN" as const,
    },
    {
      username: "dapur",
      name: "Koki Dapur",
      password: "dapur123",
      role: "DAPUR" as const,
    },
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
  console.log(`  - ${ingredients.length} bahan mentah`);
  console.log(`  - ${recipes.length} resep (HPP)`);
  console.log(`  - ${tables.length} meja`);
  console.log(`  - ${users.length} pengguna`);
  console.log("  - pengaturan pajak (11%)");
  console.log("");
  console.log("Akun default:");
  console.log("  admin / admin123   (Admin)");
  console.log("  kasir / kasir123   (Kasir)");
  console.log("  pelayan / pelayan123 (Pelayan)");
  console.log("  dapur / dapur123   (Dapur)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
