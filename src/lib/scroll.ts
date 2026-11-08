export function scrollToProducts(sectionId = 'products-section'): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Allow React state updates (e.g. tab switch / modal close) to flush before measuring
  window.requestAnimationFrame(() => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    const headerEl = document.querySelector('header');
    const headerOffset = headerEl ? headerEl.getBoundingClientRect().height + 12 : 120;
    const elementTop = el.getBoundingClientRect().top + window.scrollY;
    const targetTop = Math.max(0, elementTop - headerOffset);

    window.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    });
  });
}
