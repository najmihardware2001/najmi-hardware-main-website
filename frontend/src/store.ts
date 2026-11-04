/* ============================================================
   NAJMI HARDWARE — Shared Mock Data Store
   localStorage-persisted state for demo purposes
   ============================================================ */

// ── Product Types ──
export interface ProductVariant {
  id: string;
  diameter: string;
  length: string;
  color?: string;
  unit: string;
  retailPrice: number;
  wholesaleMinQty: number;
  sku: string;
  stock?: number;
}

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  categoryTag: string;
  material: string;
  description: string;
  descriptionAr: string;
  shortDesc: string;
  shortDescAr: string;
  categoryTagAr: string;
  materialAr: string;
  images: string[];
  variants: ProductVariant[];
  tags: string[];
  tagsAr: string[];
  isVerified: boolean;
  isActive: boolean;
  stock: number;
  lowStockThreshold: number;
  createdAt: string;
  brand?: string;
  origin?: 'Manufactured' | 'Imported' | 'Own Brand';
  manufacturer?: string;
  countryOfOrigin?: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  productName?: string;
  productNameAr?: string;
  productCode?: string;
  imageUrl?: string;
  variantSku?: string;
  variantDiameter?: string | number;
  variantMeasurement?: { type: string; value: number; unit: string; lengthValue?: number; lengthUnit?: string; colour?: string };
  variantLength?: string | number;
  variantColor?: string;
  sellingUnit?: string;
  price?: number;
  isInStock?: boolean;
}

export interface RfqItem {
  variantSku?: string;
  productId: string;
  variantId: string;
  quantity: number;
  notes: string;
  selectionKey?: string;
  productName?: string;
  productNameAr?: string;
  imageUrl?: string;
  parentReference?: string;
  pageUrl?: string;
  unit?: string;
  unitOptions?: string[];
  measurementType?: string;
  measurements?: Record<string, any>;
  colour?: string;
}

export interface RetailOrder {
  id: string;
  items: CartItem[];
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
  status: 'pending' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryMethod: 'pickup' | 'delivery';
  paymentMethod: string;
  createdAt: string;
  notes: string;
}

export interface RfqSubmission {
  id: string;
  items: RfqItem[];
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  status: 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired';
  estimatedTotal: number;
  quotedTotal: number | null;
  createdAt: string;
  quotedAt: string | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'retail' | 'wholesale' | 'both';
  company?: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  icon: string;
  tag: string;
  isActive: boolean;
  order: number;
}

export interface SiteSettings {
  storeName: string;
  storeNameAr: string;
  tagline: string;
  currency: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  addressAr: string;
  crNumber: string;
  vatEnabled: boolean;
  vatRate: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  demoMode: boolean;
  mapUrl?: string;
}

export interface StoreState {
  products: Product[];
  cart: CartItem[];
  rfqBasket: RfqItem[];
  retailOrders: RetailOrder[];
  rfqSubmissions: RfqSubmission[];
  customers: Customer[];
  banners: Banner[];
  categories: Category[];
  settings: SiteSettings;
}

// ── Product Images (from Stitch export) ──
const IMAGES = {
  nylonSpool: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD62OoYqOyVmoH8W4vXct3TBhuSKcceJiNVUZu_ZikLKtzmR-iEEzaRYg21TJuNfAG_XKMGuqg06UQ_KgpSA7YcA_MieosQJEt1pemZKU8VYmL_Iv1Ha-gcTmnkel3kCR3TXgdVWvCLi7qQGSqLa8IQ5BNWJgI-sENAOaqRcMmmHM__D1RYfUGDfNEgJQBYily6fakIXVX8O2Q1A9Xz6zeoAeVTSetbf8zBipPWXyoh1xHqMtn4uFM0',
  nylonDetail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxn6Jhp23JYwndVyM39uMp0utigthWBj26LxAx2LsWH1yscjhQSy3_zt4kvCHGlb9z4WVLDX2wejUkqcMdFANidZUC0YVqLtvdUrEyxTTl7u2I1dXHJirlg5cgU4A__1Tj1swWxPDpDMdwmTispKhIzLZqc8x5TrdlU8UQNBCEPuaOvtgJw99SMtF1b7tbmJBMB0cuBAne5zuh5Vd19RZ0_hsrfsKfwkPiy3QXYASukD6jCaoomFoh',
  nylonThumb1: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4he-LQZ6rI9TvbwL4dsfTnIWA8DjVR0LLz0-ALidj_alRkBPuPwBN_9OXCmjJYSlRmKLMym8Mj5DteY8C8Psf6Aspl58K3b_OsMw7Fj90AZJrtIgobeqUdOeKq9BRhcANqYCCXt4yJbkibv439AZGhhhJs7KNQeCYxJZebIGakDrDHksUcaZit6m7HyyKNVXkZFTeadlWwCZUzQm69jQkJYYcn5dmo61p_8QC5YVHoDNlBssJkTEX',
  nylonThumb2: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCy2FJkcyY5daqE4tYxziasT6g7v8zMc0gQtIs4q7VjSyFD44l0LWImE_fZkd2OCVCvyQcfhu1hdKt_vWcKqptXpIPMb6_A0CbJdT-h2bBbihK22jUuML7tP6l0QtvCfiWqN5myr28w8IWYI5IWO95oQHEBnVnxgl0uUWp5UjWHOkP1sfMw0hrMggyYEeMKu7CkOySgUc9BITd9lP-WnnxW0E3Q3Gs0bz5A2X8W7cNAVSyxYmaCDe1x',
  nylonThumb3: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5XhVjI9U3VY1LWdFIfz_FGoQ-l8Zm7VpL1U3Dyugwzcv-dzsjMdA_z2IVAGKvJEYsI-DZzNWu-5S0X74T6v8OSubWeCba8AjSlm2fhlyAlLMrudRtBR_VhmgETSuqMYVB1JKVAVIswu0T-ppA9Y96PcULCn5weYbmvVDo6rdQm0i61IZkHhLjQD-Wv_S9HcFpu6mlxwj7obxIjcvaefN02WrJmdwsFnVaKxkHczaUjsdLr-LmRKYp',
  nylonAdmin: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHbqDhQ094230dXww-Lw39Juq3MTY4-tVzINXWJ-aeQ4d6chfyS9hyua5QxG-oBjXB77gVNVLs6-9Ry68zfpHzLFjgiwlyVS6l1lkeW8Y8ilvueB7Gi-eIVoKrZKDJJ-RKbTuIc42UqEo0uPNFiQ7arN6LN4GBoEOKq4BDTTSk4ipbA8iQruMeVFFM4YMkVUcZ3ygygCd6YlDRpvs2jS3-KDqS07tQqsi1Pa7IkkRI-b3AP0DR-_cQ',
  cottonSash: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABDen8Rj247UWhq190BSDql7ftB-2pTZcUv_hpuOI9R3daQs8WJ4VL9UM-T-8Nu6far4HSjuSaGTDSlTyms7frgYkZUQv5JURPKL1F3Fq4RzHd1Z-vuor-2feejVCCzzR6nz5Y_cKKHCGR9ehMse2vzufEhGQBzO9ejzcJUK9ZHU8jMKa1E4080VAjp02m1CP2ic3AwxB49ZvCDthQB6581GRvFG4XTCoTzgZ4NbYwi0JlPmBYgz_E',
  cottonAdmin: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzAxwIeo2XQgO49pFAn68rpZR9q8WqUFVRg2bE-cVmaQm1GlseCR9vp0WQlFFiXUnRrp7eR6ntEg9ce9rVLqJj2nf05j9nhCpRxfdcYqqGLuQwjfdhfNSMu5YkkN9rLjmjfLScMR73E-2f7BTp0ZM5INtwx_cnGJlcFB2T5jC6VlnX-v5LOpQOfuUmQfrVBJCZXablz14ZrTSJcfFXwhj8nGvi2KGQaztE4VvxXT55bQ_ODOdc3StV',
  cartNylon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCsf0btJc6h5klDEqhmzb7Pur6w0sYY9kUZ4Bn6o2ZDJuxfN8OVpOSCcQnxXGDtQxoyicYieE7O5F--YTrP4NsLjfnfHrKc2d6ucMG9V9ebJVMXXuYwiSBuULthlOLhdebhk9rvm3ivYNr8wm8lbRyGG4Ssui2Bb5tCMA8tNdU38bVXg8pxr7bn-qnke7xEUfHwY-oYQxz0_9N0jo6g4oCXMbjRxzjOXJtXc-T-PT0tnzQKFpII2qp',
  cartCotton: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_qGoIJE5oANyy2mkMovKoPdvJWGdGgaecPS-oW-vJu9kRaveU_zrHRjt3w1tAcU2dBJcSum8ezyqaoywns1VRviSzFOdAvieC94cFpDyq-yNDim9Hi9rZmskttmcfc7G-xi_znKz4gkwGyMQb5waFY5Uj2HnItOT2CHVVg9kaBO9fxg0nX1f8WtLKagI_KxABiFT_KNPufFheOEIf14WUfHtCuJu2MjKOn-oRqC03mIVICHlmXGKe',
  heroRopes: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaMyZ_giY5ZB4-n6QS3ovTnASKj5D5OxPRrlQCT_NF261OXtdmd7mQWxal7SXyxmpZdD4vthHKM9MEPuXw5-YKSmfDbp4tUrNtpvGYaS-n3cAN7NwXf00V193fKMb1N5AdakkKysuA0DOrujav71TZdm1c5XiSUG3zdl_ZjtsQkDmI1KOyjgHTMNlmllhzbKKkUqCtJSuhWjcg63sen9305p7zBmGoPEleRpLplBCckrWg_6cCNVic',
  warehouse: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC58MM7BwLr_kvBr2BYHAu1SaRm-n2jT5xlyV1p-4xRCHUofW819R87yEKBe3HBsC-7zpk0sSeFarYZWY0hrSXJtTNUOldEKTmH0VOKQWJ-t0W_LkDMWkDnw88Mw67S5vivQHs6KvAIHTTskKwy9wCgn1_bgU2dW15hstovBiGWghiCOtY3Frz9ElXv04t27Uyop-jqO24rtGOFAUUMTCpCHRASBqnzUeBwbVpJ62n8CAz11lJuhm1p',
  logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcrfJXrSfPaDE-0C2dnneH8GWGPL6znlCrdDDd4jvJ5SPn3r2rMY9-st2Ub2AyUkhDzcAgiN3Pm9smOICDbkJeiajv-6YQUcp67wZEgJBnEuoJ_LzjlMT1PYNb28ImAr9BV4QncgFaOKrH2mp66fehaE7np2-rV2rIzpaQK-tIosT4R6e6ChWOLUs6KvwmKU95sF2javNimiQjwt0j2MseKs2Oxh6-ZiGsehnYcWnGFk7bu8fnhD2A',
};

// The real storefront catalogue is loaded through the public API. Legacy
// fixture sources remain on disk, but are not bundled into every shopping session.

// ── Default Data ──
const DEFAULT_PRODUCTS: Product[] = [];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-nylon', name: 'Nylon Rope', nameAr: 'حبل نايلون', description: 'High-tensile & elastic recovery', icon: 'straighten', tag: 'Synthetic', isActive: true, order: 1 },
  { id: 'cat-cotton', name: 'Cotton Sash Cord', nameAr: 'حبل قطني', description: 'Smooth braided tactile finish', icon: 'fiber_manual_record', tag: 'Natural Fiber', isActive: true, order: 2 },
  { id: 'cat-pp', name: 'Polypropylene Rope', nameAr: 'حبل بولي بروبيلين', description: 'Lightweight, floats, rot-resistant', icon: 'waves', tag: 'Synthetic', isActive: true, order: 3 },
  { id: 'cat-manila', name: 'Manila Hemp Rope', nameAr: 'حبل قنب مانيلا', description: 'Traditional natural fiber with excellent grip', icon: 'nature', tag: 'Natural Fiber', isActive: true, order: 4 },
];

const DEFAULT_CUSTOMERS: Customer[] = [];

const DEFAULT_ORDERS: RetailOrder[] = [];

const DEFAULT_RFQS: RfqSubmission[] = [];

const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'banner-1',
    title: 'Kuwait Rope & Cordage Specialist',
    subtitle: 'Est. 2001 — The Right Rope. Ready for the Job.',
    imageUrl: IMAGES.heroRopes,
    linkUrl: '/shop',
    isActive: true,
    order: 1,
  },
  {
    id: 'banner-2',
    title: 'Wholesale & B2B Quotations',
    subtitle: 'Get tailored pricing for contractor supplies and commercial orders.',
    imageUrl: IMAGES.warehouse,
    linkUrl: '/wholesale',
    isActive: true,
    order: 2,
  },
];

const DEFAULT_SETTINGS: SiteSettings = {
  storeName: 'NAJMI — Al-Najm Hardware Est.',
  storeNameAr: 'مؤسسة النجم للمواد الإنشائية',
  tagline: 'Kuwait Rope & Cordage Specialist • Est. 2001',
  currency: 'KWD',
  phone: '+965 24827860',
  mobile: '+965 99652718',
  email: 'sales@najmihardware.com',
  address: 'Shop No. 12, Al-Juwan Commercial Complex, Khalifa Al-Jassem St, Shuwaikh, Kuwait',
  addressAr: 'محل رقم ١٢، مجمع الجوعان التجاري، شارع خليفة الجاسم، الشويخ، الكويت',
  crNumber: '81741',
  vatEnabled: false,
  vatRate: 0,
  deliveryFee: 1.500,
  freeDeliveryThreshold: 15.000,
  demoMode: false,
  mapUrl: 'https://www.google.com/maps?q=Al-Najm+Hardware+Establishment,Shop+No.+12,Al-Juwan+Commercial+Complex,Khalifa+Al-Jassem+Street,Shuwaikh+Industrial+Area,Kuwait&output=embed',
};

// ── Storage Keys ──
const STORAGE_KEY = 'najmi-demo-store';

// ── Store Functions ──
export function getDefaultState(): StoreState {
  return {
    products: DEFAULT_PRODUCTS,
    cart: [],
    rfqBasket: [],
    retailOrders: DEFAULT_ORDERS,
    rfqSubmissions: DEFAULT_RFQS,
    customers: DEFAULT_CUSTOMERS,
    banners: DEFAULT_BANNERS,
    categories: DEFAULT_CATEGORIES,
    settings: DEFAULT_SETTINGS,
  };
}

export function loadStore(): StoreState {
  if(typeof localStorage==='undefined')return getDefaultState();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const defaultState = getDefaultState();
      
      // Preserve any saved legacy product snapshots used by older cart lines.
      // Never replace a customer's stored product list based on its item count.
      if (!Array.isArray(parsed.products)) parsed.products = [];

      // Merge with defaults to handle any new fields
      return { ...defaultState, ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings, email: parsed.settings?.email === 'sales@najmihardware.net' ? DEFAULT_SETTINGS.email : (parsed.settings?.email || DEFAULT_SETTINGS.email) } };
    }
  } catch (e) {
    console.warn('Failed to load store from localStorage:', e);
  }
  return getDefaultState();
}

export function saveStore(state: StoreState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save store to localStorage:', e);
  }
}

export function resetStore(): StoreState {
  localStorage.removeItem(STORAGE_KEY);
  return getDefaultState();
}

// ── Helper Getters ──
export function getProduct(state: StoreState, id: string): Product | undefined {
  return state.products.find(p => p.id === id);
}

export function getVariant(product: Product, variantId: string): ProductVariant | undefined {
  return product.variants.find(v => v.id === variantId);
}

export function getCategory(state: StoreState, id: string): Category | undefined {
  return state.categories.find(c => c.id === id);
}

export function getCartTotal(state: StoreState): number {
  return state.cart.reduce((total, item) => {
    if (typeof item.price === 'number') {
      return total + item.price * item.quantity;
    }
    const product = getProduct(state, item.productId);
    if (!product) return total;
    const variant = getVariant(product, item.variantId);
    if (!variant) return total;
    return total + variant.retailPrice * item.quantity;
  }, 0);
}

export function getCartItemCount(state: StoreState): number {
  return state.cart.reduce((count, item) => count + item.quantity, 0);
}

export function getRfqItemCount(state: StoreState): number {
  return state.rfqBasket.length;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
}

export { IMAGES, DEFAULT_SETTINGS };
