import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { Category, SubCategory, Product } from '../types';
import { scrollToProducts } from '../lib/scroll';
import {
  getSafeDisplayOrder,
  isProductMatchingCategory,
  isProductMatchingSubCategory,
} from '../lib/categoryUtils';

export interface HeaderCategoryNavProps {
  categories?: Category[];
  subCategories?: SubCategory[];
  products?: Product[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedSubCategory?: string | null;
  setSelectedSubCategory?: (subId: string | null) => void;
  activeTab: 'home' | 'shop';
  setActiveTab: (tab: 'home' | 'shop') => void;
  closeProductDetail?: () => void;
  onOpenTracking?: () => void;
  isLoading?: boolean;
}

interface CategoryTreeNode {
  category: Category;
  children: SubCategory[];
  isHighlightedPill: boolean;
  pillColorIndex: number;
}

const PLAIN_CATEGORY_LIMIT = 5;

const PILL_STYLES = [
  'bg-[#FD0160] hover:bg-[#e00156] text-white',
  'bg-[#EC2A6B] hover:bg-[#d6225f] text-white',
  'bg-[#D91B60] hover:bg-[#bf1653] text-white',
  'bg-[#185824] hover:bg-[#12431C] text-white',
  'bg-[#E5A016] hover:bg-[#D49010] text-slate-900',
];

const HIGHLIGHT_KEYWORDS = ['ব্যাগ', 'প্রিমিয়াম ইয়ারবাড', 'অফার', 'ফ্ল্যাশ', 'এক্সক্লুসিভ'];

const HIDE_SCROLLBAR = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

const FALLBACK_SUBCATEGORY_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none">
      <rect width="96" height="96" rx="22" fill="#EBF6ED"/>
      <rect x="24" y="28" width="48" height="40" rx="10" stroke="#185824" stroke-width="4" fill="#FFFFFF"/>
      <circle cx="38" cy="43" r="5" fill="#E5A016"/>
      <path d="M26 62L41 49L52 58L60 51L70 62" stroke="#185824" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  );

const toBnDigits = (n: number | string) =>
  String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

export const HeaderCategoryNav: React.FC<HeaderCategoryNavProps> = ({
  categories = [],
  subCategories = [],
  products = [],
  selectedCategory,
  setSelectedCategory,
  selectedSubCategory = null,
  setSelectedSubCategory,
  activeTab,
  setActiveTab,
  closeProductDetail,
  onOpenTracking,
  isLoading = false,
}) => {
  const [desktopOpenCatId, setDesktopOpenCatId] = useState<string | null>(null);
  const [mobileExpandedCatKey, setMobileExpandedCatKey] = useState<string | null>(null);

  const navContainerRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointerTypeRef = useRef<string>('mouse');

  // Build parent -> children tree safely in useMemo (supports both subcategories.category_id and optional parent_id)
  const categoryTree = useMemo<CategoryTreeNode[]>(() => {
    const activeCats = (categories || []).filter((c) => c.is_active !== false);
    const activeSubs = (subCategories || []).filter((s) => s.is_active !== false);

    const childCatsByParent = new Map<string, SubCategory[]>();
    const topLevelCats: Category[] = [];

    activeCats.forEach((cat) => {
      const parentId = (cat as Category & { parent_id?: string | null }).parent_id;
      if (parentId) {
        const list = childCatsByParent.get(parentId) || [];
        list.push({
          id: cat.id || cat.slug,
          category_id: parentId,
          name: cat.name,
          name_bn: cat.name_bn,
          slug: cat.slug,
          image_url: cat.image_url,
          display_order: getSafeDisplayOrder(cat),
          is_active: cat.is_active,
        });
        childCatsByParent.set(parentId, list);
      } else {
        topLevelCats.push(cat);
      }
    });

    const sortedParents = [...topLevelCats].sort(
      (a, b) => getSafeDisplayOrder(a) - getSafeDisplayOrder(b)
    );

    let pillCounter = 0;

    return sortedParents.map((parent, idx) => {
      const parentId = parent.id || '';
      const parentSlug = parent.slug;

      const directSubs = activeSubs.filter(
        (sub) =>
          (parentId && sub.category_id === parentId) ||
          (parentSlug && sub.category_id === parentSlug)
      );

      const nestedCatSubs = parentId ? childCatsByParent.get(parentId) || [] : [];

      const mergedMap = new Map<string, SubCategory>();
      [...directSubs, ...nestedCatSubs].forEach((s) => {
        if (s.id && !mergedMap.has(s.id)) {
          mergedMap.set(s.id, s);
        }
      });

      const sortedChildren = Array.from(mergedMap.values()).sort(
        (a, b) => getSafeDisplayOrder(a) - getSafeDisplayOrder(b)
      );

      const label = `${parent.name_bn || ''} ${parent.name || ''}`.toLowerCase();
      const matchesKeyword = HIGHLIGHT_KEYWORDS.some((kw) => label.includes(kw.toLowerCase()));
      const isHighlightedPill = idx >= PLAIN_CATEGORY_LIMIT || matchesKeyword;
      const pillColorIndex = isHighlightedPill ? pillCounter++ : 0;

      return {
        category: parent,
        children: sortedChildren,
        isHighlightedPill,
        pillColorIndex,
      };
    });
  }, [categories, subCategories]);

  // Sync mobile sub-category strip when selectedCategory changes externally
  useEffect(() => {
    if (!selectedCategory || selectedCategory === 'all') {
      setMobileExpandedCatKey(null);
      return;
    }
    const matchingNode = categoryTree.find(
      (n) =>
        n.category.slug === selectedCategory ||
        n.category.id === selectedCategory
    );
    if (matchingNode && matchingNode.children.length > 0) {
      setMobileExpandedCatKey(matchingNode.category.id || matchingNode.category.slug);
    } else {
      setMobileExpandedCatKey(null);
    }
  }, [selectedCategory, categoryTree]);

  // Close desktop dropdown on outside click and Escape key
  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (
        navContainerRef.current &&
        !navContainerRef.current.contains(e.target as Node)
      ) {
        setDesktopOpenCatId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDesktopOpenCatId(null);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const openDesktopMenu = useCallback(
    (catKey: string | null) => {
      clearHoverTimer();
      setDesktopOpenCatId(catKey);
    },
    [clearHoverTimer]
  );

  const scheduleCloseDesktopMenu = useCallback(() => {
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => {
      setDesktopOpenCatId(null);
    }, 150);
  }, [clearHoverTimer]);

  const isCategorySelected = useCallback(
    (cat: Category) => {
      if (!selectedCategory || selectedCategory === 'all') return false;
      const sel = selectedCategory.toLowerCase();
      return (
        selectedCategory === cat.slug ||
        selectedCategory === cat.id ||
        cat.slug?.toLowerCase() === sel ||
        cat.name?.toLowerCase() === sel
      );
    },
    [selectedCategory]
  );

  const isHomeActive = activeTab === 'home' && (!selectedCategory || selectedCategory === 'all');

  const handleGoHome = () => {
    setActiveTab('home');
    setSelectedCategory('all');
    setSelectedSubCategory?.(null);
    closeProductDetail?.();
    setDesktopOpenCatId(null);
    setMobileExpandedCatKey(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMainCategory = (node: CategoryTreeNode, isMobile = false) => {
    const { category, children } = node;
    const catKey = category.id || category.slug;

    setActiveTab('shop');
    setSelectedCategory(category.slug);
    setSelectedSubCategory?.(null);
    closeProductDetail?.();

    if (isMobile) {
      setDesktopOpenCatId(null);
      if (children.length > 0) {
        setMobileExpandedCatKey((prev) => (prev === catKey ? prev : catKey));
      } else {
        setMobileExpandedCatKey(null);
      }
    } else if (lastPointerTypeRef.current === 'touch' && children.length > 0) {
      // On touch tablets at desktop viewport width, allow tap to toggle mega-menu
      setDesktopOpenCatId((prev) => (prev === catKey ? null : catKey));
    } else {
      setDesktopOpenCatId(null);
    }

    scrollToProducts();
  };

  const handleSelectSubCategory = (parentCat: Category, sub: SubCategory) => {
    setActiveTab('shop');
    setSelectedCategory(parentCat.slug);
    setSelectedSubCategory?.(sub.id);
    closeProductDetail?.();
    setDesktopOpenCatId(null);
    scrollToProducts();
  };

  const activeDesktopNode = useMemo(
    () =>
      desktopOpenCatId
        ? categoryTree.find(
            (n) => (n.category.id || n.category.slug) === desktopOpenCatId && n.children.length > 0
          ) || null
        : null,
    [desktopOpenCatId, categoryTree]
  );

  const activeMobileNode = useMemo(
    () =>
      mobileExpandedCatKey
        ? categoryTree.find(
            (n) => (n.category.id || n.category.slug) === mobileExpandedCatKey && n.children.length > 0
          ) || null
        : null,
    [mobileExpandedCatKey, categoryTree]
  );

  const showSkeleton = isLoading && categoryTree.length === 0;

  return (
    <div
      ref={navContainerRef}
      onMouseLeave={scheduleCloseDesktopMenu}
      onMouseEnter={clearHoverTimer}
      className="relative w-full bg-white border-t border-slate-100"
    >
      {/* ===================== DESKTOP CATEGORY BAR ===================== */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="প্রধান ক্যাটাগরি নেভিগেশন"
          className={`flex items-center justify-center gap-1.5 lg:gap-2 overflow-x-auto whitespace-nowrap py-2 ${HIDE_SCROLLBAR}`}
        >
          {/* Home Link */}
          <button
            type="button"
            onClick={handleGoHome}
            onMouseEnter={() => openDesktopMenu(null)}
            aria-current={isHomeActive ? 'page' : undefined}
            className={`relative shrink-0 inline-flex items-center text-[13px] font-bold px-3 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#185824] ${
              isHomeActive
                ? 'text-[#185824]'
                : 'text-slate-700 hover:text-[#185824] hover:bg-emerald-50/50'
            }`}
          >
            <span>হোম</span>
            {isHomeActive && (
              <span className="absolute left-3 right-3 -bottom-0.5 h-[2.5px] rounded-full bg-[#185824]" />
            )}
          </button>

          {/* Loading Skeletons */}
          {showSkeleton &&
            Array.from({ length: 6 }).map((_, i) => (
              <span
                key={`desk-skel-${i}`}
                aria-hidden="true"
                className="shrink-0 h-7 w-24 rounded-full bg-slate-100 animate-pulse"
              />
            ))}

          {/* Dynamic Parent Categories */}
          {!showSkeleton &&
            categoryTree.map((node) => {
              const { category, children, isHighlightedPill, pillColorIndex } = node;
              const catKey = category.id || category.slug;
              const hasSubs = children.length > 0;
              const selected = isCategorySelected(category);
              const isOpen = desktopOpenCatId === catKey && hasSubs;
              const label = category.name_bn || category.name;

              const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
                if (hasSubs && e.key === 'ArrowDown') {
                  e.preventDefault();
                  openDesktopMenu(catKey);
                } else if (e.key === 'Escape') {
                  setDesktopOpenCatId(null);
                }
              };

              if (isHighlightedPill) {
                const pillTone = PILL_STYLES[pillColorIndex % PILL_STYLES.length];
                return (
                  <div
                    key={catKey}
                    className="relative shrink-0 flex items-center"
                    onMouseEnter={() => openDesktopMenu(hasSubs ? catKey : null)}
                  >
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        lastPointerTypeRef.current = e.pointerType || 'mouse';
                      }}
                      onClick={() => handleSelectMainCategory(node, false)}
                      onKeyDown={handleKeyDown}
                      aria-label={label}
                      aria-haspopup={hasSubs ? 'true' : undefined}
                      aria-expanded={hasSubs ? isOpen : undefined}
                      aria-controls={hasSubs ? `mega-menu-${catKey}` : undefined}
                      className={`shrink-0 inline-flex items-center gap-1 text-xs font-extrabold tracking-wide px-4 py-1.5 rounded-full shadow-2xs transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#185824] focus-visible:ring-offset-1 ${pillTone} ${
                        selected ? 'ring-2 ring-[#185824] ring-offset-2' : ''
                      }`}
                    >
                      <span>{label}</span>
                      {hasSubs && (
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={catKey}
                  className="relative shrink-0 flex items-center"
                  onMouseEnter={() => openDesktopMenu(hasSubs ? catKey : null)}
                >
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      lastPointerTypeRef.current = e.pointerType || 'mouse';
                    }}
                    onClick={() => handleSelectMainCategory(node, false)}
                    onKeyDown={handleKeyDown}
                    aria-label={label}
                    aria-haspopup={hasSubs ? 'true' : undefined}
                    aria-expanded={hasSubs ? isOpen : undefined}
                    aria-controls={hasSubs ? `mega-menu-${catKey}` : undefined}
                    className={`relative shrink-0 inline-flex items-center gap-1 text-[13px] font-bold px-3 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#185824] ${
                      selected || isOpen
                        ? 'text-[#185824] bg-emerald-50/60'
                        : 'text-slate-700 hover:text-[#185824] hover:bg-emerald-50/40'
                    }`}
                  >
                    <span>{label}</span>
                    {hasSubs && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#185824]' : 'text-slate-400'
                        }`}
                      />
                    )}
                    {selected && (
                      <span className="absolute left-3 right-3 -bottom-0.5 h-[2.5px] rounded-full bg-[#185824]" />
                    )}
                  </button>
                </div>
              );
            })}

          {/* Empty state fallback if categories array is completely empty */}
          {!showSkeleton && categoryTree.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('shop');
                setSelectedCategory('all');
                setSelectedSubCategory?.(null);
                closeProductDetail?.();
                scrollToProducts();
              }}
              className="shrink-0 text-[13px] font-bold px-3 py-1.5 rounded-lg text-slate-700 hover:text-[#185824] transition-colors cursor-pointer"
            >
              সকল প্রোডাক্ট
            </button>
          )}

          {/* Compact Track Order link on medium screens */}
          {onOpenTracking && (
            <button
              type="button"
              onClick={onOpenTracking}
              onMouseEnter={() => openDesktopMenu(null)}
              className="shrink-0 text-[13px] font-bold px-3 py-1.5 rounded-lg text-slate-700 hover:text-[#185824] transition-colors lg:hidden cursor-pointer"
            >
              অর্ডার ট্র্যাক
            </button>
          )}
        </nav>
      </div>

      {/* ===================== DESKTOP MEGA-MENU DROPDOWN ===================== */}
      <div
        id={activeDesktopNode ? `mega-menu-${activeDesktopNode.category.id || activeDesktopNode.category.slug}` : undefined}
        role="region"
        aria-label={
          activeDesktopNode
            ? `${activeDesktopNode.category.name_bn || activeDesktopNode.category.name} সাব-ক্যাটাগরি`
            : 'সাব-ক্যাটাগরি মেনু'
        }
        onMouseEnter={clearHoverTimer}
        onMouseLeave={scheduleCloseDesktopMenu}
        className={`hidden md:block absolute left-0 right-0 top-full z-40 bg-white border-t border-slate-100 border-b border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.14)] transition-all duration-200 ease-out origin-top ${
          activeDesktopNode
            ? 'opacity-100 translate-y-0 visible pointer-events-auto'
            : 'opacity-0 -translate-y-1.5 invisible pointer-events-none'
        }`}
      >
        {activeDesktopNode && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            {/* Mega-menu header */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold text-[#185824] truncate">
                  {activeDesktopNode.category.name_bn || activeDesktopNode.category.name}
                </h3>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap tabular-nums">
                  {toBnDigits(activeDesktopNode.children.length)}টি সাব-ক্যাটাগরি
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleSelectMainCategory(activeDesktopNode, false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold text-[#185824] bg-[#E5A016]/15 hover:bg-[#E5A016]/25 transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#185824]"
              >
                <span>সব দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Responsive 4-6 column sub-category grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {activeDesktopNode.children.map((sub) => {
                const isSubSelected =
                  selectedSubCategory === sub.id &&
                  isCategorySelected(activeDesktopNode.category);

                const subCount = products.filter(
                  (p) =>
                    isProductMatchingCategory(p, activeDesktopNode.category.slug, categories) &&
                    isProductMatchingSubCategory(p, sub.id, subCategories)
                ).length;

                const subLabel = sub.name_bn || sub.name;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelectSubCategory(activeDesktopNode.category, sub)}
                    aria-label={subLabel}
                    className={`group flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#185824] ${
                      isSubSelected
                        ? 'border-[#185824] bg-emerald-50/50 shadow-2xs'
                        : 'border-slate-100 bg-white hover:border-[#185824]/40 hover:bg-emerald-50/25 hover:-translate-y-0.5 hover:shadow-xs'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#EBF6ED] border border-emerald-900/10 flex items-center justify-center shrink-0 p-0.5">
                      <img
                        src={sub.image_url || FALLBACK_SUBCATEGORY_IMAGE}
                        alt={subLabel}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.onerror = null;
                          img.src = FALLBACK_SUBCATEGORY_IMAGE;
                        }}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span
                        className={`block text-[13px] font-bold leading-snug truncate transition-colors ${
                          isSubSelected
                            ? 'text-[#185824] underline decoration-[#185824] decoration-2 underline-offset-4'
                            : 'text-slate-800 group-hover:text-[#185824]'
                        }`}
                      >
                        {subLabel}
                      </span>
                      {subCount > 0 && (
                        <span className="block text-[11px] text-slate-400 mt-0.5 tabular-nums">
                          {toBnDigits(subCount)}টি পণ্য
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===================== MOBILE CATEGORY + SUB-CATEGORY BARS ===================== */}
      <div className="md:hidden bg-white">
        {/* Row 1: Horizontally scrollable snap strip for main categories */}
        <nav
          aria-label="মোবাইল ক্যাটাগরি নেভিগেশন"
          className={`flex items-center gap-2 overflow-x-auto snap-x snap-mandatory px-3 py-2 ${HIDE_SCROLLBAR}`}
        >
          {/* Home item */}
          <button
            type="button"
            onClick={handleGoHome}
            aria-current={isHomeActive ? 'page' : undefined}
            className={`snap-start shrink-0 relative px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#185824] ${
              isHomeActive
                ? 'bg-[#185824] text-white border-[#185824]'
                : 'bg-white text-slate-700 border-slate-200 hover:border-[#185824]/50'
            }`}
          >
            হোম
          </button>

          {/* Mobile Skeletons */}
          {showSkeleton &&
            Array.from({ length: 5 }).map((_, i) => (
              <span
                key={`mob-skel-${i}`}
                aria-hidden="true"
                className="snap-start shrink-0 h-7 w-20 rounded-full bg-slate-100 animate-pulse"
              />
            ))}

          {/* Dynamic Categories on Mobile */}
          {!showSkeleton &&
            categoryTree.map((node) => {
              const { category, children, isHighlightedPill, pillColorIndex } = node;
              const catKey = category.id || category.slug;
              const hasSubs = children.length > 0;
              const selected = isCategorySelected(category);
              const isExpanded = mobileExpandedCatKey === catKey && hasSubs;
              const label = category.name_bn || category.name;

              const onMobileTap = () => {
                if (hasSubs && selected) {
                  setMobileExpandedCatKey((prev) => (prev === catKey ? null : catKey));
                } else {
                  handleSelectMainCategory(node, true);
                }
              };

              if (isHighlightedPill) {
                const pillTone = PILL_STYLES[pillColorIndex % PILL_STYLES.length];
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={onMobileTap}
                    aria-label={label}
                    aria-expanded={hasSubs ? isExpanded : undefined}
                    className={`snap-start shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#185824] ${pillTone} ${
                      selected ? 'ring-2 ring-[#185824] ring-offset-1' : ''
                    }`}
                  >
                    <span>{label}</span>
                    {hasSubs && (
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={onMobileTap}
                  aria-label={label}
                  aria-expanded={hasSubs ? isExpanded : undefined}
                  className={`snap-start shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#185824] ${
                    selected
                      ? 'bg-emerald-50 text-[#185824] border-[#185824] font-extrabold'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#185824]/40'
                  }`}
                >
                  <span>{label}</span>
                  {hasSubs && (
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-[#185824]' : 'text-slate-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
        </nav>

        {/* Row 2: Smooth second scrollable sub-category row for active/tapped parent category */}
        {activeMobileNode && activeMobileNode.children.length > 0 && (
          <div className="border-t border-slate-100 bg-emerald-50/30 transition-all duration-200 ease-out">
            <div
              className={`flex items-center gap-2 overflow-x-auto snap-x snap-mandatory px-3 py-2 ${HIDE_SCROLLBAR}`}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTab('shop');
                  setSelectedCategory(activeMobileNode.category.slug);
                  setSelectedSubCategory?.(null);
                  closeProductDetail?.();
                  scrollToProducts();
                }}
                className={`snap-start shrink-0 px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-colors cursor-pointer ${
                  isCategorySelected(activeMobileNode.category) && !selectedSubCategory
                    ? 'bg-[#185824] text-white border-[#185824]'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                সব ({activeMobileNode.category.name_bn || activeMobileNode.category.name})
              </button>

              {activeMobileNode.children.map((sub) => {
                const isSubOn =
                  selectedSubCategory === sub.id &&
                  isCategorySelected(activeMobileNode.category);
                const subLabel = sub.name_bn || sub.name;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelectSubCategory(activeMobileNode.category, sub)}
                    className={`snap-start shrink-0 inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-colors cursor-pointer ${
                      isSubOn
                        ? 'bg-white text-[#185824] border-[#185824] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#185824]/40'
                    }`}
                  >
                    <img
                      src={sub.image_url || FALLBACK_SUBCATEGORY_IMAGE}
                      alt={subLabel}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = FALLBACK_SUBCATEGORY_IMAGE;
                      }}
                      className="w-5 h-5 rounded-md object-cover bg-[#EBF6ED] shrink-0"
                    />
                    <span>{subLabel}</span>
                    <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
