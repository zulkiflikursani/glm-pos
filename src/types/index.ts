import type { KitchenTicketStatus, PaymentMethod, UserRole } from "@prisma/client";

export type ProductWithCategory = {
  id: string;
  name: string;
  price: number;
  emoji: string | null;
  imageUrl: string | null;
  stock: number;
  trackStock: boolean;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
};

export type CategoryOption = {
  id: string;
  name: string;
};

export type TableOption = {
  id: string;
  number: number;
  status: "EMPTY" | "OCCUPIED";
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  emoji: string | null;
  quantity: number;
  trackStock: boolean;
  stock: number;
};

export type CreateOrderItem = {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
};

export type CreateOrderInput = {
  items: CreateOrderItem[];
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  tableId?: string;
};

export type OrderResult = {
  id: string;
  orderNumber: string;
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived: number | null;
  changeAmount: number | null;
  createdAt: Date;
  items: {
    productName: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
};

export type DashboardStats = {
  totalRevenue: number;
  orderCount: number;
  averageOrder: number;
};

export type TopProduct = {
  productName: string;
  quantity: number;
  revenue: number;
};

export type OrderHistoryItem = {
  id: string;
  orderNumber: string;
  total: number;
  paymentMethod: PaymentMethod;
  itemCount: number;
  createdAt: Date;
};

export type AdminProduct = {
  id: string;
  name: string;
  price: number;
  emoji: string | null;
  imageUrl: string | null;
  stock: number;
  trackStock: boolean;
  categoryId: string;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  };
};

export type AdminCategory = {
  id: string;
  name: string;
  productCount: number;
};

export type ProductFormInput = {
  name: string;
  price: number;
  emoji?: string;
  categoryId: string;
  isActive?: boolean;
  stock?: number;
  trackStock?: boolean;
};

export type CategoryFormInput = {
  name: string;
};

export type AdminUser = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  isActive: boolean;
};

export type UserFormInput = {
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  isActive?: boolean;
};

export type KitchenTicketView = {
  id: string;
  ticketNumber: string;
  status: KitchenTicketStatus;
  tableNumber: number | null;
  orderNumber: string;
  createdAt: Date;
  items: { productName: string; quantity: number }[];
};
