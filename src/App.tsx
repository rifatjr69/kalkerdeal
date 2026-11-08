import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';

// Header components
import { TopPromoBar } from './components/header/TopPromoBar';
import { UtilityBar } from './components/header/UtilityBar';
import { MainHeader } from './components/header/MainHeader';
import { CategoryNav } from './components/header/CategoryNav';

// Footer components
import { Footer } from './components/footer/Footer';
import { MobileBottomNav } from './components/footer/MobileBottomNav';

// Modals and Drawers
import { CartDrawer } from './components/modals/CartDrawer';
import { AuthModal } from './components/modals/AuthModal';
import { QuickViewModal } from './components/common/QuickViewModal';

// Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { WishlistPage } from './pages/WishlistPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { SellWithUsPage } from './pages/SellWithUsPage';
import { StaticPages } from './pages/StaticPages';

// Admin Dashboard & Gate
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAccessGate } from './components/AdminAccessGate';

/**
 * Global mobile guard:
 * - পেজে কোনো হরাইজন্টাল স্ক্রল বার যাতে না আসে
 * - মোবাইলে টেক্সট সাইজ অটো-বড় হওয়া বন্ধ
 * - ইমেজ/ভিডিও কখনো স্ক্রিনের বাইরে যাবে না
 * `overflow-x: clip` ব্যবহার করা হয়েছে, কারণ `hidden` দিলে sticky হেডার ভেঙে যায়।
 */
const GLOBAL_MOBILE_CSS = `
  html, body, #root {
    width: 100%;
    max-width: 100%;
    overflow-x: clip;
  }
  html {
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }
  body {
    overscroll-behavior-x: none;
  }
  img, video, svg, canvas, iframe {
    max-width: 100%;
  }
  input, select, textarea {
    max-width: 100%;
  }
  /* iOS এ ইনপুটে ট্যাপ করলে জুম হওয়া বন্ধ */
  @media (max-width: 767px) {
    input, select, textarea {
      font-size: 16px;
    }
  }
`;

const useGlobalMobileGuard = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-mobile-guard', 'true');
    style.innerHTML = GLOBAL_MOBILE_CSS;
    document.head.appendChild(style);

    // viewport meta ঠিক আছে কিনা নিশ্চিত করা
    let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';

    return () => {
      style.remove();
    };
  }, []);
};

/**
 * Main Application Viewport Router
 * Listens to currentRoute from StoreContext (driven by clean URL hashes)
 */
const AppContent: React.FC = () => {
  const {
    currentRoute,
    isAdmin,
    products,
    categories,
    banners,
    deliveryZones,
    refreshProducts,
    refreshCategories,
    refreshBanners,
    refreshDeliveryZones,
    logout,
    navigateTo
  } = useStore();

  useGlobalMobileGuard();

  const isFullAdminView = (currentRoute === '/admin' || currentRoute === '#admin' || currentRoute.startsWith('/admin')) && isAdmin;

  if (isFullAdminView) {
    return (
      <AdminDashboard
        isOpen={true}
        onClose={() => navigateTo('/')}
        onLogout={() => {
          logout();
          navigateTo('/');
        }}
        products={products.map((p) => ({
          id: p.id,
          name: p.title,
          name_bn: p.title_bn,
          slug: p.slug,
          price: p.price,
          old_price: p.oldPrice,
          discount_percent: p.discountPercent || (p.oldPrice && p.oldPrice > p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : undefined),
          rating: p.rating,
          review_count: p.reviewCount,
          stock: p.stock,
          image_url: p.image,
          images: p.images || [p.image],
          category: p.category,
          description: p.description,
          description_bn: p.description_bn,
          is_featured: p.isFeatured,
          is_flash_sale: p.isFlashSale
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          name_bn: c.name_bn || '',
          slug: c.slug,
          icon: c.iconName,
          image_url: c.image,
          sub_label: '',
          sort_order: 1,
          is_active: true
        }))}
        banners={banners.map((b) => ({
          id: b.id,
          image_url: b.image_url,
          title: b.title,
          link_url: b.link_url,
          sort_order: b.sort_order,
          is_active: b.is_active
        }))}
        deliveryZones={deliveryZones}
        onRefreshProducts={refreshProducts}
        onRefreshCategories={refreshCategories}
        onRefreshBanners={refreshBanners}
        onRefreshDeliveryZones={refreshDeliveryZones}
      />
    );
  }

  const renderCurrentPage = () => {
    // 0. Admin Access Gate (if non-admin tries to open /admin)
    if (currentRoute === '/admin' || currentRoute === '#admin' || currentRoute.startsWith('/admin')) {
      return <AdminAccessGate />;
    }

    // 1. Product Detail Page (PDP)
    if (currentRoute.startsWith('/product/')) {
      const slug = currentRoute.replace('/product/', '').split('?')[0];
      return <ProductDetailPage slug={slug} />;
    }

    // 2. Shop / Catalog / Search Page
    if (currentRoute === '/shop' || currentRoute.startsWith('/shop?')) {
      return <ShopPage />;
    }

    // 3. Cart Page
    if (currentRoute === '/cart') {
      return <CartPage />;
    }

    // 4. Checkout Page
    if (currentRoute === '/checkout') {
      return <CheckoutPage />;
    }

    // 5. Wishlist Page
    if (currentRoute === '/wishlist') {
      return <WishlistPage />;
    }

    // 6. Track Order Page
    if (currentRoute === '/track-order' || currentRoute === '/tracking') {
      return <OrderTrackingPage />;
    }

    // 7. Sell With Us Page
    if (currentRoute === '/sell-with-us') {
      return <SellWithUsPage />;
    }

    // 8. Help Center & FAQs
    if (currentRoute === '/help-center' || currentRoute === '/help' || currentRoute === '/faq') {
      return <StaticPages initialTab="help" />;
    }

    // 9. About Us
    if (currentRoute === '/about-us' || currentRoute === '/about') {
      return <StaticPages initialTab="about" />;
    }

    // 10. Return & Refund Policy
    if (currentRoute === '/policies/returns' || currentRoute === '/return-policy') {
      return <StaticPages initialTab="return" />;
    }

    // 11. Warranty Policy
    if (currentRoute === '/policies/warranty' || currentRoute === '/warranty-policy') {
      return <StaticPages initialTab="warranty" />;
    }

    // 12. EMI Policy
    if (currentRoute === '/policies/emi' || currentRoute === '/emi-policy') {
      return <StaticPages initialTab="emi" />;
    }

    // 13. Privacy Policy
    if (currentRoute === '/policies/privacy' || currentRoute === '/privacy-policy') {
      return <StaticPages initialTab="privacy" />;
    }

    // 14. Terms & Conditions
    if (currentRoute === '/policies/terms' || currentRoute === '/terms' || currentRoute === '/policies/cookies') {
      return <StaticPages initialTab="terms" />;
    }

    // Default: Home Page (Strict 18-part structure matching reference)
    return <HomePage />;
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-white text-slate-900 flex flex-col font-sans selection:bg-[#FF2B74]/20 selection:text-[#FF2B74]">
      {/* 1. Top Announcement Promo Bar */}
      <TopPromoBar />

      {/* 2. Desktop Utility Bar */}
      <UtilityBar />

      {/* 3. Sticky Main Header with Logo, Search Dropdown, User Account, Wishlist, Cart */}
      <MainHeader />

      {/* Active Page Route Body
          min-w-0 দেওয়া জরুরি: flex child এর ভেতরের কন্টেন্ট প্রশস্ত হলে যেন পুরো পেজ চওড়া না হয়ে যায় */}
      <main className="flex-1 min-w-0 w-full max-w-full pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {renderCurrentPage()}
      </main>

      {/* 17. Comprehensive Marketplace Footer */}
      <Footer />

      {/* 18. Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Global Slide-Over Cart Drawer */}
      <CartDrawer />

      {/* Global 3-in-1 Sign In / Register / Forgot Password Modal */}
      <AuthModal />

      {/* Instant Product Quick View Modal */}
      <QuickViewModal />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}