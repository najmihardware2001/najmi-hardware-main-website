import { lazy, Suspense, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route } from 'react-router-dom';
import StorefrontLayout from './layouts/StorefrontLayout';
import AdminLayout from './layouts/AdminLayout';
const FinderPage=lazy(()=>import('./pages/storefront/FinderPage'));
const ComparePage=lazy(()=>import('./pages/storefront/ComparePage'));
const BulkQuotePage=lazy(()=>import('./pages/storefront/BulkQuotePage'));
import HomePage from './pages/storefront/HomePage';
import GuidePage from './pages/storefront/GuidePage';
import ShopPage from './pages/storefront/ShopPage';
import ProductPage from './pages/storefront/ProductPage';
const CartPage = lazy(() => import('./pages/storefront/CartPage'));
const CheckoutPage = lazy(() => import('./pages/storefront/CheckoutPage'));
const OrderConfirmation = lazy(() => import('./pages/storefront/OrderConfirmation'));
const WholesalePage = lazy(() => import('./pages/storefront/WholesalePage'));
const RfqBasketPage = lazy(() => import('./pages/storefront/RfqBasketPage'));
const AccountPage = lazy(() => import('./pages/storefront/AccountPage'));
const AboutPage = lazy(() => import('./pages/storefront/AboutPage'));
const ContactPage = lazy(() => import('./pages/storefront/ContactPage'));
const StarRopePage = lazy(() => import('./pages/storefront/StarRopePage'));
const ManufacturingPage = lazy(() => import('./pages/storefront/ManufacturingPage'));
const IndustriesPage = lazy(() => import('./pages/storefront/IndustriesPage'));
const NotFoundPage = lazy(() => import('./pages/storefront/NotFoundPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminRfqs = lazy(() => import('./pages/admin/AdminRfqs'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

const QuotationViewPage = lazy(() => import('./pages/storefront/QuotationViewPage'));

function PageLoading() {
  const { i18n } = useTranslation();
  return <div role="status" style={{ padding: '64px 24px', textAlign: 'center', minHeight: 240 }}>
    <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
    <p>{i18n.language === 'ar-KW' ? 'جارٍ تحميل الصفحة…' : 'Loading page…'}</p>
  </div>;
}
const page = (Page: ComponentType) => <Suspense fallback={<PageLoading />}><Page /></Suspense>;

function App() {
  return (
    <Routes>
      {/* Storefront Routes */}
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={page(HomePage)} />
        <Route path="/shop" element={page(ShopPage)} />
        <Route path="/collections/:collectionSlug" element={page(ShopPage)} />
        <Route path="/guides/:guideSlug" element={page(GuidePage)} />
        <Route path="/find" element={page(FinderPage)} />
        <Route path="/compare" element={page(ComparePage)} />
        <Route path="/bulk-quote" element={page(BulkQuotePage)} />
        <Route path="/shop/:category" element={page(ShopPage)} />
        <Route path="/product/:id" element={page(ProductPage)} />
        <Route path="/cart" element={page(CartPage)} />
        <Route path="/checkout" element={page(CheckoutPage)} />
        <Route path="/order-confirmation/:id" element={page(OrderConfirmation)} />
        <Route path="/wholesale" element={page(WholesalePage)} />
        <Route path="/rfq-basket" element={page(RfqBasketPage)} />
        <Route path="/quote/:rfqNumber" element={page(QuotationViewPage)} />
        <Route path="/account" element={page(AccountPage)} />
        <Route path="/about" element={page(AboutPage)} />
        <Route path="/contact" element={page(ContactPage)} />
        <Route path="/brands/star-rope" element={page(StarRopePage)} />
        <Route path="/manufacturing" element={page(ManufacturingPage)} />
        <Route path="/industries" element={page(IndustriesPage)} />
        <Route path="*" element={page(NotFoundPage)} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={page(AdminDashboard)} />
        <Route path="products" element={page(AdminProducts)} />
        <Route path="orders" element={page(AdminOrders)} />
        <Route path="rfqs" element={page(AdminRfqs)} />
        <Route path="inventory" element={page(AdminInventory)} />
        <Route path="customers" element={page(AdminCustomers)} />
        <Route path="banners" element={page(AdminBanners)} />
        <Route path="categories" element={page(AdminCategories)} />
        <Route path="settings" element={page(AdminSettings)} />
      </Route>
    </Routes>
  );
}

export default App;
