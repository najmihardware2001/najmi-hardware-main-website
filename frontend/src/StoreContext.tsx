import { useTranslation } from 'react-i18next';
import {hasPrerender} from './services/initialCatalogue';
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  loadStore, saveStore, resetStore, generateId, getCartTotal, getDefaultState
} from './store';
import type {
  StoreState, CartItem, RfqItem, RetailOrder, RfqSubmission, Product, Customer, Banner, Category, SiteSettings
} from './store';

// ── Action Types ──
type Action =
  | { type: 'RESET_STORE' }
  | { type: 'SET_STATE'; payload: StoreState }
  // Cart
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'UPDATE_CART_QTY'; payload: { productId: string; variantId: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: { productId: string; variantId: string } }
  | { type: 'CLEAR_CART' }
  // RFQ Basket
  | { type: 'ADD_TO_RFQ'; payload: RfqItem }
  | { type: 'REMOVE_FROM_RFQ'; payload: { productId: string; variantId: string; selectionKey?: string } }
  | { type: 'UPDATE_RFQ_ITEM'; payload: { productId: string; variantId: string; selectionKey?: string; quantity: number; unit?: string; notes?: string } }
  | { type: 'CLEAR_RFQ_BASKET' }
  // Orders
  | { type: 'CREATE_ORDER'; payload: Omit<RetailOrder, 'id' | 'createdAt'> }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { id: string; status: RetailOrder['status'] } }
  // RFQ Submissions
  | { type: 'SUBMIT_RFQ'; payload: Omit<RfqSubmission, 'id' | 'createdAt' | 'quotedAt'> }
  | { type: 'UPDATE_RFQ_STATUS'; payload: { id: string; status: RfqSubmission['status']; quotedTotal?: number } }
  // Products
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'TOGGLE_PRODUCT_ACTIVE'; payload: string }
  // Customers
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  // Banners
  | { type: 'UPDATE_BANNERS'; payload: Banner[] }
  // Categories
  | { type: 'UPDATE_CATEGORIES'; payload: Category[] }
  // Settings
  | { type: 'UPDATE_SETTINGS'; payload: Partial<SiteSettings> };

// ── Reducer ──
function storeReducer(state: StoreState, action: Action): StoreState {
  let newState: StoreState;

  switch (action.type) {
    case 'RESET_STORE':
      newState = resetStore();
      break;

    case 'SET_STATE':
      newState = action.payload;
      break;

    // ── Cart ──
    case 'ADD_TO_CART': {
      const existing = state.cart.find(
        i => i.productId === action.payload.productId && i.variantId === action.payload.variantId
      );
      if (existing) {
        newState = {
          ...state,
          cart: state.cart.map(i =>
            i.productId === action.payload.productId && i.variantId === action.payload.variantId
              ? { ...i, ...action.payload, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      } else {
        newState = { ...state, cart: [...state.cart, action.payload] };
      }
      break;
    }

    case 'UPDATE_CART_QTY':
      newState = {
        ...state,
        cart: state.cart.map(i =>
          i.productId === action.payload.productId && i.variantId === action.payload.variantId
            ? { ...i, quantity: Math.max(1, action.payload.quantity) }
            : i
        ),
      };
      break;

    case 'REMOVE_FROM_CART':
      newState = {
        ...state,
        cart: state.cart.filter(
          i => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId)
        ),
      };
      break;

    case 'CLEAR_CART':
      newState = { ...state, cart: [] };
      break;

    // ── RFQ Basket ──
    case 'ADD_TO_RFQ': {
      const existingRfq = state.rfqBasket.find(
        i => i.productId === action.payload.productId && (i.selectionKey || i.variantId) === (action.payload.selectionKey || action.payload.variantId)
      );
      if (existingRfq) {
        newState = {
          ...state,
          rfqBasket: state.rfqBasket.map(i =>
            i.productId === action.payload.productId && (i.selectionKey || i.variantId) === (action.payload.selectionKey || action.payload.variantId)
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      } else {
        newState = { ...state, rfqBasket: [...state.rfqBasket, action.payload] };
      }
      break;
    }

    case 'REMOVE_FROM_RFQ':
      newState = {
        ...state,
        rfqBasket: state.rfqBasket.filter(
          i => !(i.productId === action.payload.productId && (i.selectionKey || i.variantId) === (action.payload.selectionKey || action.payload.variantId))
        ),
      };
      break;

    case 'UPDATE_RFQ_ITEM':
      newState = { ...state, rfqBasket: state.rfqBasket.map(i => i.productId === action.payload.productId && (i.selectionKey || i.variantId) === (action.payload.selectionKey || action.payload.variantId) ? { ...i, quantity: Math.max(1, Math.min(9999, action.payload.quantity)), ...(action.payload.unit !== undefined ? {unit: action.payload.unit} : {}), ...(action.payload.notes !== undefined ? {notes: action.payload.notes} : {}) } : i) };
      break;

    case 'CLEAR_RFQ_BASKET':
      newState = { ...state, rfqBasket: [] };
      break;

    // ── Orders ──
    case 'CREATE_ORDER': {
      const order: RetailOrder = {
        ...action.payload,
        id: generateId('ORD'),
        createdAt: new Date().toISOString(),
      };
      newState = {
        ...state,
        retailOrders: [order, ...state.retailOrders],
        cart: [],
      };
      break;
    }

    case 'UPDATE_ORDER_STATUS':
      newState = {
        ...state,
        retailOrders: state.retailOrders.map(o =>
          o.id === action.payload.id ? { ...o, status: action.payload.status } : o
        ),
      };
      break;

    // ── RFQ Submissions ──
    case 'SUBMIT_RFQ': {
      const rfq: RfqSubmission = {
        ...action.payload,
        id: generateId('RFQ'),
        createdAt: new Date().toISOString(),
        quotedAt: null,
      };
      newState = {
        ...state,
        rfqSubmissions: [rfq, ...state.rfqSubmissions],
        rfqBasket: [],
      };
      break;
    }

    case 'UPDATE_RFQ_STATUS':
      newState = {
        ...state,
        rfqSubmissions: state.rfqSubmissions.map(r =>
          r.id === action.payload.id
            ? {
                ...r,
                status: action.payload.status,
                quotedTotal: action.payload.quotedTotal ?? r.quotedTotal,
                quotedAt: action.payload.status === 'quoted' ? new Date().toISOString() : r.quotedAt,
              }
            : r
        ),
      };
      break;

    // ── Products ──
    case 'ADD_PRODUCT':
      newState = { ...state, products: [...state.products, action.payload] };
      break;

    case 'UPDATE_PRODUCT':
      newState = {
        ...state,
        products: state.products.map(p => (p.id === action.payload.id ? action.payload : p)),
      };
      break;

    case 'DELETE_PRODUCT':
      newState = {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };
      break;

    case 'TOGGLE_PRODUCT_ACTIVE':
      newState = {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload ? { ...p, isActive: !p.isActive } : p
        ),
      };
      break;

    // ── Customers ──
    case 'ADD_CUSTOMER':
      newState = { ...state, customers: [...state.customers, action.payload] };
      break;

    case 'UPDATE_CUSTOMER':
      newState = {
        ...state,
        customers: state.customers.map(c => (c.id === action.payload.id ? action.payload : c)),
      };
      break;

    // ── Banners ──
    case 'UPDATE_BANNERS':
      newState = { ...state, banners: action.payload };
      break;

    // ── Categories ──
    case 'UPDATE_CATEGORIES':
      newState = { ...state, categories: action.payload };
      break;

    // ── Settings ──
    case 'UPDATE_SETTINGS':
      newState = { ...state, settings: { ...state.settings, ...action.payload } };
      break;

    default:
      return state;
  }

  saveStore(newState);
  return newState;
}

// ── Context ──
interface StoreContextType {
  state: StoreState;
  dispatch: React.Dispatch<Action>;
  cartTotal: number;
  showToast: (message: string, icon?: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

// ── Toast State ──
interface ToastState {
  message: string;
  icon: string;
  visible: boolean;
}

// ── Provider ──
export function StoreProvider({ children }: { children: ReactNode }) {
  const {i18n}=useTranslation();
  const [state, dispatch] = useReducer(storeReducer, undefined, ()=>hasPrerender()?getDefaultState():loadStore());
  React.useEffect(()=>{if(hasPrerender()&&localStorage.getItem('najmi-demo-store'))React.startTransition(()=>dispatch({type:'SET_STATE',payload:loadStore()}))},[]);
  const [toast, setToast] = React.useState<ToastState>({ message: '', icon: 'check_circle', visible: false });
  const toastTimeoutRef = React.useRef<number | null>(null);

  const cartTotal = getCartTotal(state);

  const showToast = useCallback((message: string, icon: string = 'check_circle') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, icon, visible: true });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(t => ({ ...t, visible: false }));
    }, 2800);
  }, []);

  return (
    <StoreContext.Provider value={{ state, dispatch, cartTotal, showToast }}>
      {children}
      {/* Global Toast */}
      <div className={`toast ${toast.visible ? 'show' : ''}`} role="status" aria-live="polite" aria-hidden={!toast.visible}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--tertiary-fixed-dim)' }}>
            {toast.icon}
          </span>
          <span className="text-body-sm" style={{ fontWeight: 500 }}>{toast.message}</span>
        </div>
        <span className="text-label-sm" style={{ color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{i18n.language==='ar-KW'?'تم':'Done'}</span>
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
