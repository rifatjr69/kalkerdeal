import { Category, Product, SubCategory } from '../types';

/**
 * Safely extracts display_order (falling back to sort_order, then 0)
 * so missing database columns never cause runtime errors.
 */
export function getSafeDisplayOrder(item: unknown): number {
  if (!item || typeof item !== 'object') return 0;
  const rec = item as Record<string, unknown>;
  const displayOrder = rec.display_order;
  if (typeof displayOrder === 'number' && Number.isFinite(displayOrder)) {
    return displayOrder;
  }
  if (typeof displayOrder === 'string' && displayOrder.trim() !== '') {
    const parsed = Number(displayOrder);
    if (Number.isFinite(parsed)) return parsed;
  }
  const sortOrder = rec.sort_order;
  if (typeof sortOrder === 'number' && Number.isFinite(sortOrder)) {
    return sortOrder;
  }
  if (typeof sortOrder === 'string' && sortOrder.trim() !== '') {
    const parsed = Number(sortOrder);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

/**
 * Checks whether a product belongs to a given category slug, id, or name.
 */
export function isProductMatchingCategory(
  product: Product,
  categoryKey: string | null | undefined,
  categories: Category[] = [],
  subCategories: SubCategory[] = []
): boolean {
  if (!categoryKey || categoryKey === 'all') return true;

  const keyLower = categoryKey.toLowerCase();
  const matchedCat = categories.find(
    (c) =>
      c.slug === categoryKey ||
      c.id === categoryKey ||
      c.slug?.toLowerCase() === keyLower ||
      c.name?.toLowerCase() === keyLower
  );

  const targetId = matchedCat?.id;
  const targetSlug = matchedCat?.slug?.toLowerCase() || keyLower;
  const targetName = matchedCat?.name?.toLowerCase();

  const prodCatId = product.category_id ?? undefined;
  const prodCat = product.category?.toLowerCase();
  const nestedSlug = (product as Product & { categories?: { slug?: string } }).categories?.slug?.toLowerCase();

  if (targetId && prodCatId === targetId) return true;
  if (prodCatId && prodCatId.toLowerCase() === keyLower) return true;
  if (prodCat && (prodCat === targetSlug || prodCat === keyLower || (targetName && prodCat === targetName))) {
    return true;
  }
  if (nestedSlug && (nestedSlug === targetSlug || nestedSlug === keyLower)) return true;

  if (product.subcategory_id && subCategories.length > 0) {
    const prodSub = subCategories.find(
      (s) => s.id === product.subcategory_id || s.slug === product.subcategory_id
    );
    if (prodSub) {
      if (targetId && prodSub.category_id === targetId) return true;
      if (prodSub.category_id?.toLowerCase() === targetSlug || prodSub.category_id?.toLowerCase() === keyLower) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks whether a product belongs to a given sub-category id or slug.
 */
export function isProductMatchingSubCategory(
  product: Product,
  subCategoryKey: string | null | undefined,
  subCategories: SubCategory[] = []
): boolean {
  if (!subCategoryKey) return true;

  if (product.subcategory_id === subCategoryKey) return true;

  const keyLower = subCategoryKey.toLowerCase();
  const matchedSub = subCategories.find(
    (s) => s.id === subCategoryKey || s.slug === subCategoryKey || s.slug?.toLowerCase() === keyLower
  );

  if (matchedSub) {
    if (product.subcategory_id === matchedSub.id) return true;
    if (matchedSub.slug && product.subcategory_id?.toLowerCase() === matchedSub.slug.toLowerCase()) {
      return true;
    }
  }

  return false;
}
