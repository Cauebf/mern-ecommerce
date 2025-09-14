export type Category = {
  href: string;
  name: string;
  imageUrl: string;
};

export type User = {
  _id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

export type UserStore = {
  user: User | null;
  loading: boolean;
  checkingAuth: boolean;
  signup: (params: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<string | undefined>;
  login: (email: string, password: string) => Promise<string | undefined>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
};

export type Product = {
  _id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isFeatured?: boolean;
};

export type ProductStore = {
  products: Product[];
  loading: boolean;
  setProducts: (products: Product[]) => void;
  createProduct: (productData: Product) => Promise<void>;
  fetchAllProducts: () => Promise<void>;
  fetchProductsByCategory: (category: string) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  toggleFeaturedProduct: (productId: string) => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
};

export type CartItem = Product & {
  quantity: number;
};

type Coupon = {
  code: string;
  discountPercentage: number;
};

export type CartStore = {
  cart: CartItem[];
  coupon: Coupon | null;
  subtotal: number;
  total: number;
  isCouponApplied: boolean;

  getMyCoupon: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  getCartItems: () => Promise<void>;
  clearCart: () => Promise<void>;
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  calculateTotals: () => void;
};
