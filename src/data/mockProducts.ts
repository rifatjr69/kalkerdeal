import { Product, CategoryItem, Brand, Voucher } from '../types/store';

// Helper to generate crisp SVG data URIs for all sample products matching the screenshot look
export function generateProductSvg(type: string): string {
  const svgs: Record<string, string> = {
    hard_drive: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#E2E8F0"/>
      <rect x="95" y="65" width="110" height="170" rx="14" fill="#1E293B"/>
      <rect x="105" y="75" width="90" height="150" rx="10" fill="#0F172A"/>
      <circle cx="150" cy="130" r="32" fill="#334155"/>
      <circle cx="150" cy="130" r="14" fill="#64748B"/>
      <circle cx="180" cy="210" r="4" fill="#00E5FF"/>
    </svg>`,
    router: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#F1F5F9"/>
      <line x1="100" y1="130" x2="80" y2="70" stroke="#334155" stroke-width="6" stroke-linecap="round"/>
      <line x1="130" y1="130" x2="120" y2="60" stroke="#334155" stroke-width="6" stroke-linecap="round"/>
      <line x1="170" y1="130" x2="180" y2="60" stroke="#334155" stroke-width="6" stroke-linecap="round"/>
      <line x1="200" y1="130" x2="220" y2="70" stroke="#334155" stroke-width="6" stroke-linecap="round"/>
      <rect x="80" y="130" width="140" height="60" rx="12" fill="#0F172A"/>
      <circle cx="115" cy="160" r="3.5" fill="#34D399"/>
      <circle cx="135" cy="160" r="3.5" fill="#34D399"/>
      <circle cx="155" cy="160" r="3.5" fill="#34D399"/>
      <circle cx="175" cy="160" r="3.5" fill="#34D399"/>
      <circle cx="195" cy="160" r="3.5" fill="#34D399"/>
    </svg>`,
    mouse: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#E2E8F0"/>
      <path d="M110 140 C110 90, 190 90, 190 140 L190 180 C190 220, 110 220, 110 180 Z" fill="#334155"/>
      <line x1="150" y1="92" x2="150" y2="135" stroke="#1E293B" stroke-width="3"/>
      <rect x="145" y="105" width="10" height="22" rx="5" fill="#94A3B8"/>
    </svg>`,
    keyboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#F1F5F9"/>
      <rect x="60" y="105" width="180" height="90" rx="14" fill="#0F172A"/>
      <g fill="#475569">
        <rect x="75" y="120" width="16" height="14" rx="3"/>
        <rect x="97" y="120" width="16" height="14" rx="3"/>
        <rect x="119" y="120" width="16" height="14" rx="3"/>
        <rect x="141" y="120" width="16" height="14" rx="3"/>
        <rect x="163" y="120" width="16" height="14" rx="3"/>
        <rect x="185" y="120" width="16" height="14" rx="3"/>
        <rect x="207" y="120" width="18" height="14" rx="3"/>
        <rect x="75" y="140" width="20" height="14" rx="3"/>
        <rect x="101" y="140" width="16" height="14" rx="3"/>
        <rect x="123" y="140" width="16" height="14" rx="3"/>
        <rect x="145" y="140" width="16" height="14" rx="3"/>
        <rect x="167" y="140" width="16" height="14" rx="3"/>
        <rect x="189" y="140" width="16" height="14" rx="3"/>
        <rect x="211" y="140" width="14" height="14" rx="3"/>
        <rect x="105" y="162" width="90" height="14" rx="4" fill="#F59E0B"/>
      </g>
    </svg>`,
    monitor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#E2E8F0"/>
      <rect x="65" y="80" width="170" height="110" rx="8" fill="#1E293B"/>
      <rect x="72" y="87" width="156" height="96" rx="4" fill="#0F766E"/>
      <circle cx="100" cy="115" r="8" fill="#34D399"/>
      <rect x="142" y="190" width="16" height="35" fill="#334155"/>
      <path d="M120 225 L180 225 L175 230 L125 230 Z" fill="#1E293B"/>
    </svg>`,
    laptop: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#F1F5F9"/>
      <rect x="75" y="90" width="150" height="100" rx="10" fill="#1E293B"/>
      <rect x="85" y="100" width="130" height="80" rx="6" fill="#3B82F6"/>
      <rect x="105" y="125" width="40" height="10" rx="2" fill="#FFFFFF"/>
      <path d="M55 190 L245 190 L230 205 L70 205 Z" fill="#CBD5E1"/>
      <rect x="135" y="193" width="30" height="5" rx="2" fill="#94A3B8"/>
    </svg>`,
    earbuds: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#F8FAFC"/>
      <rect x="90" y="105" width="120" height="100" rx="45" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="4"/>
      <line x1="90" y1="140" x2="210" y2="140" stroke="#E2E8F0" stroke-width="3"/>
      <circle cx="150" cy="170" r="6" fill="#0EA5E9"/>
      <path d="M115 80 C115 65, 130 65, 130 80 L130 115" stroke="#334155" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M185 80 C185 65, 170 65, 170 80 L170 115" stroke="#334155" stroke-width="8" stroke-linecap="round" fill="none"/>
    </svg>`,
    smartwatch: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#FEE2E2"/>
      <rect x="125" y="45" width="50" height="210" rx="16" fill="#FB7185"/>
      <rect x="105" y="105" width="90" height="90" rx="22" fill="#1E293B" stroke="#F43F5E" stroke-width="4"/>
      <polyline points="120,150 135,150 142,135 150,165 158,145 165,150 180,150" fill="none" stroke="#F43F5E" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    wallet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#F1F5F9"/>
      <rect x="75" y="105" width="150" height="95" rx="14" fill="#854D0E"/>
      <path d="M75 125 L225 125" stroke="#713F12" stroke-width="3"/>
      <rect x="180" y="130" width="45" height="35" rx="8" fill="#A16207"/>
      <circle cx="205" cy="148" r="5" fill="#FEF08A"/>
    </svg>`,
    tshirt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#E2E8F0"/>
      <path d="M100 85 L125 110 C135 118, 165 118, 175 110 L200 85 L240 120 L215 145 L200 135 L200 220 L100 220 L100 135 L85 145 L60 120 Z" fill="#1E293B"/>
      <rect x="125" y="145" width="50" height="25" rx="5" fill="#10B981"/>
    </svg>`,
    chips: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#FEF3C7"/>
      <polygon points="100,70 200,70 190,230 110,230" fill="#F59E0B"/>
      <circle cx="150" cy="150" r="28" fill="#E11D48"/>
      <path d="M100 70 Q150 78 200 70" stroke="#D97706" stroke-width="4" fill="none"/>
      <path d="M110 230 Q150 238 190 230" stroke="#D97706" stroke-width="4" fill="none"/>
    </svg>`,
    honey: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#FEF9C3"/>
      <rect x="110" y="75" width="80" height="25" rx="6" fill="#2563EB"/>
      <rect x="95" y="100" width="110" height="130" rx="16" fill="#F59E0B"/>
      <rect x="115" y="135" width="70" height="50" rx="8" fill="#FEF08A"/>
      <path d="M150 148 L142 165 L158 165 Z" fill="#D97706"/>
    </svg>`,
    milk_powder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#E0F2FE"/>
      <polygon points="100,105 150,70 200,105 200,230 100,230" fill="#0284C7"/>
      <polygon points="100,105 150,70 200,105" fill="#38BDF8"/>
      <rect x="140" y="55" width="20" height="20" rx="4" fill="#10B981"/>
      <circle cx="150" cy="170" r="30" fill="#FFFFFF"/>
    </svg>`,
    powerbank: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#F1F5F9"/>
      <rect x="105" y="70" width="90" height="165" rx="18" fill="#1E293B"/>
      <rect x="120" y="100" width="60" height="7" rx="3.5" fill="#F43F5E"/>
      <rect x="120" y="112" width="60" height="7" rx="3.5" fill="#F43F5E"/>
      <rect x="120" y="124" width="60" height="7" rx="3.5" fill="#F43F5E"/>
      <rect x="120" y="136" width="35" height="7" rx="3.5" fill="#F43F5E"/>
    </svg>`,
    teddy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#FEE2E2"/>
      <circle cx="110" cy="90" r="22" fill="#B45309"/>
      <circle cx="190" cy="90" r="22" fill="#B45309"/>
      <circle cx="150" cy="120" r="45" fill="#D97706"/>
      <ellipse cx="150" cy="190" rx="55" ry="45" fill="#D97706"/>
      <circle cx="138" cy="115" r="5" fill="#1E293B"/>
      <circle cx="162" cy="115" r="5" fill="#1E293B"/>
      <ellipse cx="150" cy="130" rx="14" ry="10" fill="#FEF3C7"/>
      <ellipse cx="150" cy="126" rx="6" ry="4" fill="#1E293B"/>
    </svg>`,
    diaper: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#ECFDF5"/>
      <path d="M85 110 L215 110 C215 180, 180 220, 150 220 C120 220, 85 180, 85 110 Z" fill="#FFFFFF" stroke="#059669" stroke-width="4"/>
      <circle cx="120" cy="140" r="4" fill="#059669"/>
      <circle cx="150" cy="140" r="4" fill="#059669"/>
      <circle cx="180" cy="140" r="4" fill="#059669"/>
      <circle cx="135" cy="165" r="4" fill="#059669"/>
      <circle cx="165" cy="165" r="4" fill="#059669"/>
    </svg>`,
    bottle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#F0F9FF"/>
      <path d="M140 70 C140 60, 160 60, 160 70 L160 90 L140 90 Z" fill="#FBBF24"/>
      <rect x="135" y="90" width="30" height="15" rx="4" fill="#38BDF8"/>
      <rect x="120" y="105" width="60" height="120" rx="16" fill="#FFFFFF" stroke="#BAE6FD" stroke-width="4"/>
      <line x1="140" y1="130" x2="160" y2="130" stroke="#0284C7" stroke-width="3"/>
      <line x1="140" y1="150" x2="160" y2="150" stroke="#0284C7" stroke-width="3"/>
      <line x1="140" y1="170" x2="160" y2="170" stroke="#0284C7" stroke-width="3"/>
    </svg>`,
    paint: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#FEF3C7"/>
      <path d="M90 140 C80 90, 220 90, 210 140 C200 190, 100 200, 90 140 Z" fill="#FDE68A"/>
      <circle cx="115" cy="120" r="12" fill="#EF4444"/>
      <circle cx="150" cy="110" r="12" fill="#3B82F6"/>
      <circle cx="185" cy="125" r="12" fill="#10B981"/>
      <circle cx="170" cy="160" r="12" fill="#8B5CF6"/>
      <circle cx="130" cy="165" r="12" fill="#F59E0B"/>
    </svg>`,
    notebook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#F1F5F9"/>
      <rect x="95" y="70" width="115" height="160" rx="12" fill="#059669"/>
      <rect x="95" y="70" width="20" height="160" rx="4" fill="#047857"/>
      <circle cx="95" cy="90" r="6" fill="#CBD5E1"/>
      <circle cx="95" cy="120" r="6" fill="#CBD5E1"/>
      <circle cx="95" cy="150" r="6" fill="#CBD5E1"/>
      <circle cx="95" cy="180" r="6" fill="#CBD5E1"/>
      <circle cx="95" cy="210" r="6" fill="#CBD5E1"/>
    </svg>`,
    pen: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#EFF6FF"/>
      <path d="M190 70 L210 90 L120 220 L95 225 L100 200 Z" fill="#2563EB"/>
      <path d="M95 225 L105 205 L115 215 Z" fill="#1E293B"/>
      <path d="M180 85 L195 100" stroke="#93C5FD" stroke-width="4"/>
    </svg>`,
    umbrella: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#F1F5F9"/>
      <path d="M70 150 C70 80, 230 80, 230 150 Q190 145 150 150 Q110 145 70 150 Z" fill="#1E293B"/>
      <line x1="150" y1="140" x2="150" y2="220" stroke="#64748B" stroke-width="6"/>
      <path d="M150 220 C150 235, 130 235, 130 220" stroke="#64748B" stroke-width="6" fill="none" stroke-linecap="round"/>
    </svg>`,
    kettle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#E2E8F0"/>
      <path d="M100 130 C100 110, 190 110, 190 130 L195 220 L95 220 Z" fill="#94A3B8"/>
      <path d="M190 140 C220 150, 220 200, 190 210" stroke="#1E293B" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M98 145 L70 130 L75 160 Z" fill="#64748B"/>
      <rect x="90" y="220" width="110" height="15" rx="6" fill="#1E293B"/>
    </svg>`,
    luggage: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#F1F5F9"/>
      <rect x="135" y="45" width="30" height="40" rx="4" fill="none" stroke="#64748B" stroke-width="6"/>
      <rect x="100" y="80" width="100" height="140" rx="16" fill="#0284C7"/>
      <line x1="100" y1="120" x2="200" y2="120" stroke="#0369A1" stroke-width="4"/>
      <line x1="100" y1="150" x2="200" y2="150" stroke="#0369A1" stroke-width="4"/>
      <line x1="100" y1="180" x2="200" y2="180" stroke="#0369A1" stroke-width="4"/>
      <circle cx="115" cy="225" r="8" fill="#1E293B"/>
      <circle cx="185" cy="225" r="8" fill="#1E293B"/>
    </svg>`,
    cricket: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#FEF3C7"/>
      <rect x="142" y="50" width="16" height="50" rx="4" fill="#EF4444"/>
      <path d="M135 100 L165 100 L160 230 C160 240, 140 240, 140 230 Z" fill="#D97706"/>
      <circle cx="190" cy="180" r="20" fill="#DC2626"/>
      <path d="M180 170 Q190 180 200 190" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="3,3" fill="none"/>
    </svg>`,
    coffee: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#FEF3C7"/>
      <rect x="115" y="70" width="70" height="25" rx="6" fill="#78350F"/>
      <rect x="100" y="95" width="100" height="135" rx="18" fill="#D97706"/>
      <rect x="110" y="125" width="80" height="60" rx="8" fill="#FEF3C7"/>
      <circle cx="150" cy="155" r="16" fill="#92400E"/>
    </svg>`,
    oil: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#FEF9C3"/>
      <rect x="135" y="60" width="30" height="20" rx="4" fill="#DC2626"/>
      <polygon points="120,110 180,110 170,230 130,230" fill="#EAB308"/>
      <rect x="130" y="140" width="40" height="40" rx="6" fill="#FFFFFF"/>
    </svg>`,
    tissue: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="#E0F2FE"/>
      <rect x="90" y="90" width="120" height="120" rx="20" fill="#FFFFFF" stroke="#93C5FD" stroke-width="4"/>
      <ellipse cx="150" cy="95" rx="35" ry="12" fill="#E0F2FE"/>
      <path d="M140 85 C140 60, 160 60, 160 85" stroke="#38BDF8" stroke-width="4" fill="none"/>
    </svg>`
  };

  const svg = svgs[type] || svgs.earbuds;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 14 Category tree definitions matching prompt specifications
export const CATEGORIES: CategoryItem[] = [];

// Top Brands matching prompt
export const BRANDS: Brand[] = [
  { id: '1', name: 'Voltix', letter: 'V', slug: 'voltix', color: '#0EA5E9' },
  { id: '2', name: 'Trekline', letter: 'T', slug: 'trekline', color: '#06B6D4' },
  { id: '3', name: 'Mintleaf', letter: 'M', slug: 'mintleaf', color: '#10B981' },
  { id: '4', name: 'Zephyra', letter: 'Z', slug: 'zephyra', color: '#6366F1' },
  { id: '5', name: 'Sonora', letter: 'S', slug: 'sonora', color: '#EC4899' },
  { id: '6', name: 'Oakridge', letter: 'O', slug: 'oakridge', color: '#F59E0B' },
  { id: '7', name: 'Lumera', letter: 'L', slug: 'lumera', color: '#8B5CF6' },
  { id: '8', name: 'Aurelio', letter: 'A', slug: 'aurelio', color: '#14B8A6' },
  { id: '9', name: 'Bengal Harvest', letter: 'B', slug: 'bengal-harvest', color: '#EAB308' },
  { id: '10', name: 'Pranto', letter: 'P', slug: 'pranto', color: '#EF4444' },
  { id: '11', name: 'Kirana Gold', letter: 'K', slug: 'kirana-gold', color: '#F97316' },
  { id: '12', name: 'Nordhaven', letter: 'N', slug: 'nordhaven', color: '#0284C7' },
];

// Comprehensive catalog of Products seeded directly from prompt specifications & screenshots
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: '1TB Portable Hard Drive',
    title_bn: '১টিবি পোর্টেবল হার্ড ড্রাইভ',
    slug: '1tb-portable-hard-drive',
    price: 900,
    oldPrice: 1200,
    discountPercent: 25,
    rating: 4.0,
    reviewCount: 4,
    soldCount: 187,
    stock: 55,
    image: generateProductSvg('hard_drive'),
    category: 'computers-laptops',
    subCategory: 'storage',
    brand: 'Voltix',
    isFlashSale: true,
    isFeatured: true,
    isLatestDrop: true,
    isJustForYou: true,
    isFast: true,
    isVerified: true,
    description: 'High-speed USB 3.0 portable external hard drive with seamless plug-and-play capability for PC, Mac, and gaming consoles.',
    specs: { Capacity: '1TB', Interface: 'USB 3.0', Speed: 'Up to 130MB/s', Warranty: '2 Years Replacement' },
    inStock: true
  },
  {
    id: 'prod-2',
    title: 'Dual-Band Wi-Fi Router AC1200',
    title_bn: 'ডুয়াল ব্যান্ড ওয়াই-ফাই রাউটার এসি১২০০',
    slug: 'dual-band-wifi-router-ac1200',
    price: 2750,
    oldPrice: 3200,
    discountPercent: 14,
    rating: 4.2,
    reviewCount: 5,
    soldCount: 211,
    stock: 80,
    image: generateProductSvg('router'),
    category: 'computers-laptops',
    subCategory: 'networking',
    brand: 'Trekline',
    isFlashSale: true,
    isFeatured: true,
    isLatestDrop: true,
    isJustForYou: true,
    isVerified: true,
    description: 'Lightning-fast AC1200 dual-band Wi-Fi router with 4 high-gain antennas for 360-degree home coverage without dead zones.',
    specs: { Speed: '1200 Mbps', Bands: '2.4GHz & 5GHz', Antennas: '4 External 5dBi', Ports: '4x Gigabit LAN, 1x WAN' },
    inStock: true
  },
  {
    id: 'prod-3',
    title: 'Wireless Silent Mouse',
    title_bn: 'ওয়্যারলেস সাইলেন্ট মাউস',
    slug: 'wireless-silent-mouse',
    price: 850,
    oldPrice: 1100,
    discountPercent: 23,
    rating: 3.8,
    reviewCount: 5,
    soldCount: 133,
    stock: 120,
    image: generateProductSvg('mouse'),
    category: 'computers-laptops',
    subCategory: 'computer-accessories',
    brand: 'Voltix',
    isFlashSale: true,
    isFeatured: true,
    isLatestDrop: true,
    isJustForYou: true,
    isVerified: true,
    description: 'Ergonomic 2.4GHz wireless mouse with 90% sound reduction on click noise. Features 18-month battery life and auto-sleep.',
    specs: { DPI: '1600 DPI', Connection: '2.4GHz USB Nano Receiver', Battery: '1x AA', Range: '10 Meters' },
    inStock: true
  },
  {
    id: 'prod-4',
    title: 'Mechanical Keyboard RGB',
    title_bn: 'মেকানিক্যাল কিবোর্ড আরজিবি',
    slug: 'mechanical-keyboard-rgb',
    price: 3490,
    oldPrice: 4200,
    discountPercent: 17,
    rating: 2.0,
    reviewCount: 1,
    soldCount: 258,
    stock: 42,
    image: generateProductSvg('keyboard'),
    category: 'computers-laptops',
    subCategory: 'computer-accessories',
    brand: 'Zephyra',
    isFlashSale: true,
    isFeatured: true,
    isLatestDrop: true,
    isJustForYou: true,
    isFast: true,
    isVerified: true,
    description: 'Full-size mechanical gaming keyboard with tactile blue switches, 16.8M RGB backlighting profiles, and anti-ghosting keys.',
    specs: { Switches: 'Blue Mechanical', Keycaps: 'Double-shot ABS', Cable: '1.8m Braided USB-C', AntiGhosting: '100% N-Key Rollover' },
    inStock: true
  },
  {
    id: 'prod-5',
    title: '27″ IPS Monitor 75Hz',
    title_bn: '২৭ ইঞ্চি আইপিএস মনিটর ৭৫ হার্টজ',
    slug: '27-ips-monitor-75hz',
    price: 18900,
    oldPrice: 21500,
    discountPercent: 12,
    rating: 4.2,
    reviewCount: 6,
    soldCount: 200,
    stock: 18,
    image: generateProductSvg('monitor'),
    category: 'computers-laptops',
    subCategory: 'monitors',
    brand: 'Lumera',
    isFlashSale: true,
    isFeatured: true,
    isLatestDrop: true,
    isJustForYou: true,
    promoBadge: 'BUY 3, FREE DELIVERY',
    description: 'Ultra-slim bezel 27-inch Full HD (1920x1080) IPS display with 75Hz refresh rate and AMD FreeSync for smooth viewing.',
    specs: { Panel: 'IPS', Resolution: '1920 x 1080', RefreshRate: '75Hz', Ports: 'HDMI 1.4, VGA, Audio Out' },
    inStock: true
  },
  {
    id: 'prod-6',
    title: '14″ Ultrabook Laptop i5 16GB/512GB',
    title_bn: '১৪ ইঞ্চি আল্ট্রাবুক ল্যাপটপ আই৫ ১৬জিবি/৫১২জিবি',
    slug: '14-ultrabook-laptop-i5',
    price: 72900,
    oldPrice: 78500,
    discountPercent: 7,
    rating: 4.0,
    reviewCount: 1,
    soldCount: 45,
    stock: 12,
    image: generateProductSvg('laptop'),
    category: 'computers-laptops',
    subCategory: 'laptops',
    brand: 'Voltix',
    isFeatured: true,
    isLatestDrop: true,
    isJustForYou: true,
    isVerified: true,
    description: 'Featherlight aluminum chassis ultrabook featuring Intel Core i5 processor, 16GB DDR5 RAM, and 512GB NVMe SSD with back-lit keyboard.',
    specs: { Processor: 'Intel Core i5-1335U', RAM: '16GB LPDDR5', Storage: '512GB M.2 PCIe SSD', Battery: 'Up to 11 Hours' },
    inStock: true
  },
  {
    id: 'prod-7',
    title: 'Plush Teddy Bear 40cm',
    title_bn: 'নরম টেডি বিয়ার ৪০ সেমি',
    slug: 'plush-teddy-bear-40cm',
    price: 990,
    oldPrice: 1200,
    discountPercent: 18,
    rating: 3.5,
    reviewCount: 4,
    soldCount: 92,
    stock: 65,
    image: generateProductSvg('teddy'),
    category: 'mother-baby',
    subCategory: 'baby-toys',
    brand: 'Sonora',
    isBestseller: true,
    isJustForYou: true,
    isFast: true,
    isVerified: true,
    description: 'Super huggable 40cm plush teddy bear crafted from hypoallergenic ultra-soft fleece. Perfect for gifts and little ones.',
    specs: { Height: '40 cm', Material: 'Hypoallergenic Plush Fabric', Washable: 'Yes (Machine Wash Cold)' },
    inStock: true
  },
  {
    id: 'prod-8',
    title: 'Ultra-Soft Baby Diapers M 64pcs',
    title_bn: 'আল্ট্রা সফট বেবি ডায়াপার এম ৬৪ পিস',
    slug: 'ultra-soft-baby-diapers-m-64pcs',
    price: 1450,
    oldPrice: 1650,
    discountPercent: 12,
    rating: 4.0,
    reviewCount: 8,
    soldCount: 410,
    stock: 150,
    image: generateProductSvg('diaper'),
    category: 'mother-baby',
    subCategory: 'diapers-wipes',
    brand: 'Nordhaven',
    isBestseller: true,
    isJustForYou: true,
    isVerified: true,
    description: 'Japanese diamond-weave technology baby diapers with 12-hour leak-lock protection, wetness indicator, and breathable cotton waistband.',
    specs: { Size: 'Medium (6-11 kg)', Count: '64 Pieces', Absorbency: 'Up to 12 Hours' },
    inStock: true
  },
  {
    id: 'prod-9',
    title: 'Anti-Colic Baby Feeding Bottle 260ml',
    title_bn: 'অ্যান্টি-কোলিক বেবি ফিডিং বোতল ২৬০ মিলি',
    slug: 'anti-colic-baby-feeding-bottle-260ml',
    price: 560,
    oldPrice: 650,
    discountPercent: 14,
    rating: 3.5,
    reviewCount: 2,
    soldCount: 160,
    stock: 85,
    image: generateProductSvg('bottle'),
    category: 'mother-baby',
    subCategory: 'baby-feeding',
    brand: 'Nordhaven',
    isJustForYou: true,
    isVerified: true,
    description: 'BPA-free clinical anti-colic feeding bottle with natural silicone nipple resembling breastfeeding feel for easy latch.',
    specs: { Volume: '260 ml', Material: 'BPA-Free Polypropylene & Food Grade Silicone', Flow: 'Medium Flow (1m+)' },
    inStock: true
  },
  {
    id: 'prod-10',
    title: 'Watercolor Paint Set 24 Colors',
    title_bn: 'ওয়াটারকালার পেইন্ট সেট ২৪ কালার',
    slug: 'watercolor-paint-set-24-colors',
    price: 950,
    oldPrice: 1150,
    discountPercent: 17,
    rating: 4.3,
    reviewCount: 4,
    soldCount: 115,
    stock: 50,
    image: generateProductSvg('paint'),
    category: 'stationery-crafts',
    subCategory: 'art-supplies',
    brand: 'Aurelio',
    isJustForYou: true,
    isFast: true,
    isVerified: true,
    description: 'Artist-grade solid watercolor pan set with 24 vibrant shades, refillable water brush pen, and integrated mixing palette.',
    specs: { Colors: '24 Half-Pans', Includes: '1 Water Brush Pen, 1 Sponge', NonToxic: 'ASTM D-4236 Certified' },
    inStock: true
  },
  {
    id: 'prod-11',
    title: 'A5 Hardcover Dotted Notebook',
    title_bn: 'এ৫ হার্ডকভার ডটেড নোটবুক',
    slug: 'a5-hardcover-dotted-notebook',
    price: 330,
    oldPrice: 380,
    discountPercent: 13,
    rating: 4.0,
    reviewCount: 1,
    soldCount: 195,
    stock: 140,
    image: generateProductSvg('notebook'),
    category: 'stationery-crafts',
    subCategory: 'notebooks-paper',
    brand: 'Oakridge',
    isJustForYou: true,
    isVerified: true,
    description: '100gsm bleed-proof ivory paper bullet journal notebook with emerald green vegan leather cover, ribbon bookmark, and back pocket.',
    specs: { Size: 'A5 (148 x 210 mm)', Pages: '192 Dotted Pages', Paper: '100gsm Acid-Free' },
    inStock: true
  },
  {
    id: 'prod-12',
    title: 'Gel Ink Pen Pack of 12',
    title_bn: 'জেল ইঙ্ক পেন প্যাক ১২টি',
    slug: 'gel-ink-pen-pack-of-12',
    price: 210,
    oldPrice: 240,
    discountPercent: 13,
    rating: 3.5,
    reviewCount: 4,
    soldCount: 380,
    stock: 200,
    image: generateProductSvg('pen'),
    category: 'stationery-crafts',
    subCategory: 'writing',
    brand: 'Oakridge',
    isJustForYou: true,
    isVerified: true,
    description: '0.5mm ultra-fine Japanese rollerball gel pens with quick-drying smudge-proof ink and ergonomic rubber comfort grip.',
    specs: { Tip: '0.5 mm Fine Point', Ink: 'Black Waterproof Gel Ink', Quantity: '12 Pens per Box' },
    inStock: true
  },
  {
    id: 'prod-13',
    title: 'ANC Wireless Earbuds Pro',
    title_bn: 'এএনসি ওয়্যারলেস ইয়ারবাডস প্রো',
    slug: 'anc-wireless-earbuds-pro',
    price: 3490,
    oldPrice: 4500,
    discountPercent: 22,
    rating: 3.8,
    reviewCount: 4,
    soldCount: 340,
    stock: 45,
    image: generateProductSvg('earbuds'),
    category: 'mobiles-cameras',
    subCategory: 'audio',
    brand: 'Voltix',
    isDeal: true,
    isBestseller: true,
    isJustForYou: true,
    isFast: true,
    isVerified: true,
    description: 'Active Noise Cancelling earbuds with 35dB noise reduction, transparency mode, 12mm graphene dynamic bass drivers, and 32hr playback.',
    specs: { Bluetooth: '5.3', ANC: '-35dB Hybrid', Battery: '7h (32h with Case)', WaterResistance: 'IPX5' },
    inStock: true
  },
  {
    id: 'prod-14',
    title: 'Fitness Smart Watch with SpO2',
    title_bn: 'ফিটনেস স্মার্ট ওয়াচ উইথ এসপিও২',
    slug: 'fitness-smart-watch-with-spo2',
    price: 3290,
    oldPrice: 4200,
    discountPercent: 22,
    rating: 4.0,
    reviewCount: 5,
    soldCount: 290,
    stock: 38,
    image: generateProductSvg('smartwatch'),
    category: 'mobiles-cameras',
    subCategory: 'mobile-accessories',
    brand: 'Voltix',
    isDeal: true,
    isBestseller: true,
    isJustForYou: true,
    isVerified: true,
    description: '1.85" HD AMOLED curved display smartwatch with 24/7 heart rate, blood oxygen monitor, Bluetooth phone calling, and 100+ sports modes.',
    specs: { Display: '1.85" HD Touch', BatteryLife: 'Up to 10 Days', Sensors: 'SpO2, PPG Heart Rate, Sleep Tracking', Calling: 'HD Bluetooth Calling' },
    inStock: true
  },
  {
    id: 'prod-15',
    title: "Men's Leather Bifold Wallet",
    title_bn: 'পুরুষদের লেদার বাইফোল্ড ওয়ালেট',
    slug: 'mens-leather-bifold-wallet',
    price: 950,
    oldPrice: 1200,
    discountPercent: 21,
    rating: 4.3,
    reviewCount: 6,
    soldCount: 220,
    stock: 60,
    image: generateProductSvg('wallet'),
    category: 'mens-fashion',
    subCategory: 'mens-accessories',
    brand: 'Pranto',
    isDeal: true,
    isJustForYou: true,
    isVerified: true,
    description: 'Genuine full-grain cowhide leather slim wallet with RFID-blocking security shield, 8 card slots, and dual currency compartments.',
    specs: { Material: '100% Genuine Leather', RFID: 'Active Blocking Shield', Dimensions: '11 x 9 x 1.5 cm' },
    inStock: true
  },
  {
    id: 'prod-16',
    title: "Men's Cotton Crew-Neck T-Shirt",
    title_bn: 'পুরুষদের কটন ক্রু-নেক টি-শার্ট',
    slug: 'mens-cotton-crew-neck-tshirt',
    price: 520,
    oldPrice: 650,
    discountPercent: 20,
    rating: 4.5,
    reviewCount: 2,
    soldCount: 460,
    stock: 90,
    image: generateProductSvg('tshirt'),
    category: 'mens-fashion',
    subCategory: 'tshirts-polos',
    brand: 'Trekline',
    isDeal: true,
    isJustForYou: true,
    description: '180 GSM comb-compacted organic cotton crew-neck t-shirt with bio-wash finish for superior breathability and shrink resistance.',
    specs: { Fabric: '100% Combed Cotton', GSM: '180 GSM', Fit: 'Regular Comfort Fit', Sizes: 'M, L, XL, XXL' },
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Charcoal', 'Navy', 'Olive', 'Black'],
    inStock: true
  },
  {
    id: 'prod-17',
    title: 'Salted Potato Chips Family Pack',
    title_bn: 'সল্টেড পটেটো চিপস ফ্যামিলি প্যাক',
    slug: 'salted-potato-chips-family-pack',
    price: 120,
    stock: 180,
    rating: 4.0,
    reviewCount: 3,
    soldCount: 650,
    image: generateProductSvg('chips'),
    category: 'groceries-essentials',
    subCategory: 'snacks',
    brand: 'Mintleaf',
    isBestseller: true,
    isGrocery: true,
    isJustForYou: true,
    isVerified: true,
    description: 'Crispy golden potato kettle chips lightly dusted with natural Himalayan sea salt for the ultimate crunch.',
    specs: { NetWeight: '150g', ShelfLife: '6 Months', Flavor: 'Classic Salted' },
    inStock: true
  },
  {
    id: 'prod-18',
    title: 'Natural Sundarban Honey 500g',
    title_bn: 'প্রাকৃতিক সুন্দরবন মধু ৫০০ গ্রাম',
    slug: 'natural-sundarban-honey-500g',
    price: 690,
    oldPrice: 750,
    discountPercent: 8,
    rating: 3.8,
    reviewCount: 5,
    soldCount: 310,
    stock: 75,
    image: generateProductSvg('honey'),
    category: 'groceries-essentials',
    subCategory: 'breakfast',
    brand: 'Bengal Harvest',
    isBestseller: true,
    isGrocery: true,
    isJustForYou: true,
    isFast: true,
    isVerified: true,
    description: '100% raw unpasteurized forest flower honey harvested ethically from the deep mangroves of the Sundarbans.',
    specs: { NetWeight: '500g', Purity: '100% Raw Honey', Origin: 'Sundarbans, Bangladesh' },
    inStock: true
  },
  {
    id: 'prod-19',
    title: 'Full Cream Milk Powder 1kg',
    title_bn: 'ফুল ক্রিম মিল্ক পাউডার ১ কেজি',
    slug: 'full-cream-milk-powder-1kg',
    price: 915,
    oldPrice: 960,
    discountPercent: 5,
    rating: 3.5,
    reviewCount: 2,
    soldCount: 520,
    stock: 110,
    image: generateProductSvg('milk_powder'),
    category: 'groceries-essentials',
    subCategory: 'beverages',
    brand: 'Nordhaven',
    isBestseller: true,
    isGrocery: true,
    isJustForYou: true,
    isVerified: true,
    description: 'Rich and creamy pasture-raised full cream milk powder fortified with Vitamin A & D for daily family nutrition.',
    specs: { NetWeight: '1 kg', FatContent: '28% Min', VitaminFortified: 'Vitamin A & D3' },
    inStock: true
  },
  {
    id: 'prod-20',
    title: '20000mAh Fast-Charge Power Bank',
    title_bn: '২০০০০ এমএএইচ ফাস্ট চার্জ পাওয়ার ব্যাংক',
    slug: '20000mah-fast-charge-power-bank',
    price: 2150,
    oldPrice: 2600,
    discountPercent: 17,
    rating: 4.0,
    reviewCount: 3,
    soldCount: 420,
    stock: 90,
    image: generateProductSvg('powerbank'),
    category: 'mobiles-cameras',
    subCategory: 'mobile-accessories',
    brand: 'Voltix',
    isBestseller: true,
    isJustForYou: true,
    isVerified: true,
    description: 'Heavy-duty 22.5W QC & PD fast-charging portable power bank with dual USB-A and USB-C bidirectional output.',
    specs: { Capacity: '20000mAh (74Wh)', Output: '22.5W Max (PD3.0 + QC4.0)', Ports: '2x USB-A, 1x Type-C, 1x Micro-USB' },
    inStock: true
  },
  {
    id: 'prod-21',
    title: 'Premium 12-Rib Auto Umbrella',
    title_bn: 'প্রিমিয়াম ১২-রিব অটো ছাতা',
    slug: 'premium-12-rib-auto-umbrella',
    price: 890,
    oldPrice: 1100,
    discountPercent: 19,
    rating: 4.4,
    reviewCount: 7,
    soldCount: 280,
    stock: 65,
    image: generateProductSvg('umbrella'),
    category: 'lifestyle-tools',
    subCategory: 'umbrellas-rain-gear',
    brand: 'Oakridge',
    isJustForYou: true,
    isVerified: true,
    description: 'Reinforced 12-rib windproof fiberglass frame with one-click automatic open & close button and Teflon water-repellent coating.',
    specs: { Ribs: '12 Fiberglass Ribs', Canopy: '210T Dupont Teflon Coated', Mechanism: 'Auto Open & Close' },
    inStock: true
  },
  {
    id: 'prod-22',
    title: 'Electric Kettle 1.8L Stainless',
    title_bn: 'ইলেকট্রিক কেটলি ১.৮ লিটার স্টেইনলেস',
    slug: 'electric-kettle-1-8l-stainless',
    price: 1390,
    oldPrice: 1650,
    discountPercent: 16,
    rating: 4.1,
    reviewCount: 4,
    soldCount: 190,
    stock: 35,
    image: generateProductSvg('kettle'),
    category: 'tv-appliances',
    subCategory: 'kitchen-appliances',
    brand: 'Zephyra',
    isJustForYou: true,
    description: 'Food-grade 304 stainless steel rapid boiling 1500W electric kettle with auto shut-off, boil-dry protection, and 360-degree swivel base.',
    specs: { Capacity: '1.8 Liters', Power: '1500 Watts', Material: 'Food-Grade SUS304 Stainless Steel' },
    inStock: true
  },
  {
    id: 'prod-23',
    title: 'Hard-Shell Cabin Trolley 20″',
    title_bn: 'হার্ড-শেল কেবিন ট্রলি ২০ ইঞ্চি',
    slug: 'hard-shell-cabin-trolley-20',
    price: 7450,
    oldPrice: 8900,
    discountPercent: 16,
    rating: 4.6,
    reviewCount: 9,
    soldCount: 88,
    stock: 20,
    image: generateProductSvg('luggage'),
    category: 'watches-bags',
    subCategory: 'bags',
    brand: 'Lumera',
    isJustForYou: true,
    description: 'Airline approved 20-inch carry-on luggage with shatterproof polypropylene shell, TSA combination lock, and 360-degree silent spinner wheels.',
    specs: { Size: '20" Cabin (55 x 35 x 23 cm)', Weight: '2.6 kg', Lock: 'Integrated TSA Lock', Wheels: '4x Dual Silent Spinners' },
    inStock: true
  },
  {
    id: 'prod-24',
    title: 'English Willow Cricket Bat',
    title_bn: 'ইংলিশ উইলো ক্রিকেট ব্যাট',
    slug: 'english-willow-cricket-bat',
    price: 4990,
    oldPrice: 5800,
    discountPercent: 14,
    rating: 4.7,
    reviewCount: 11,
    soldCount: 65,
    stock: 15,
    image: generateProductSvg('cricket'),
    category: 'sports-outdoors',
    subCategory: 'team-sports',
    brand: 'Trekline',
    isJustForYou: true,
    description: 'Grade 2 hand-crafted English Willow cricket bat with massive edges, slight bow, and Singapore cane handle for superior shock absorption.',
    specs: { Willow: 'Grade 2 English Willow', Weight: '1160 - 1190g', Handle: 'Round 9-Piece Cane Handle' },
    inStock: true
  },
  {
    id: 'prod-25',
    title: 'Classic Instant Coffee Jar 200g',
    title_bn: 'ক্লাসিক ইনস্ট্যান্ট কফি জার ২০০ গ্রাম',
    slug: 'classic-instant-coffee-jar-200g',
    price: 640,
    oldPrice: 690,
    discountPercent: 7,
    rating: 4.3,
    reviewCount: 5,
    soldCount: 310,
    stock: 80,
    image: generateProductSvg('coffee'),
    category: 'groceries-essentials',
    subCategory: 'beverages',
    brand: 'Mintleaf',
    isGrocery: true,
    isJustForYou: true,
    description: 'Premium medium-dark roasted Arabica and Robusta instant coffee granules delivering rich aroma and full-bodied taste.',
    specs: { NetWeight: '200g', Roast: 'Medium-Dark', Beans: 'Arabica & Robusta Blend' },
    inStock: true
  },
  {
    id: 'prod-26',
    title: 'Mustard Oil Cold Pressed 1L',
    title_bn: 'সরিষার তেল কোল্ড প্রেসড ১ লিটার',
    slug: 'mustard-oil-cold-pressed-1l',
    price: 355,
    oldPrice: 380,
    discountPercent: 7,
    rating: 4.5,
    reviewCount: 8,
    soldCount: 530,
    stock: 120,
    image: generateProductSvg('oil'),
    category: 'groceries-essentials',
    subCategory: 'baking-cooking',
    brand: 'Bengal Harvest',
    isGrocery: true,
    isJustForYou: true,
    description: 'Traditional wood-pressed ghani mustard oil from pure indigenous yellow mustard seeds with intense pungent aroma.',
    specs: { Volume: '1 Liter', Process: 'Cold Pressed (Wood Ghani)', ShelfLife: '12 Months' },
    inStock: true
  },
  {
    id: 'prod-27',
    title: 'Soft Tissue Roll 10-Pack',
    title_bn: 'সফট টিস্যু রোল ১০ প্যাক',
    slug: 'soft-tissue-roll-10-pack',
    price: 399,
    oldPrice: 450,
    discountPercent: 11,
    rating: 4.1,
    reviewCount: 3,
    soldCount: 410,
    stock: 95,
    image: generateProductSvg('tissue'),
    category: 'groceries-essentials',
    subCategory: 'laundry-household',
    brand: 'Kirana Gold',
    isGrocery: true,
    isJustForYou: true,
    description: '3-ply virgin wood pulp bathroom tissue rolls with soft embossed texture and high flushable absorbency.',
    specs: { PackSize: '10 Rolls', Layers: '3-Ply', SheetCount: '200 Sheets per Roll' },
    inStock: true
  },
  {
    id: 'prod-28',
    title: 'Multi-Surface Floor Cleaner 2L',
    title_bn: 'মাল্টি-সারফেস ফ্লোর ক্লিনার ২ লিটার',
    slug: 'multi-surface-floor-cleaner-2l',
    price: 380,
    stock: 0,
    rating: 4.0,
    reviewCount: 2,
    soldCount: 150,
    image: generateProductSvg('bottle'),
    category: 'groceries-essentials',
    subCategory: 'laundry-household',
    brand: 'Kirana Gold',
    isGrocery: true,
    isJustForYou: true,
    description: 'Anti-bacterial disinfectant floor cleaner with refreshing lavender fragrance that kills 99.9% of germs on marble and tiles.',
    specs: { Volume: '2 Liters', Fragrance: 'Fresh Lavender', GermKill: '99.9%' },
    inStock: false
  }
];

// Mock Vouchers
export const MOCK_VOUCHERS: Voucher[] = [
  { code: 'CARTAPP250', title: '৳250 Off on First App Order', discount: 250, type: 'fixed', minOrder: 1500 },
  { code: 'BKASH15', title: '15% Off with bKash Prepay', discount: 15, type: 'percent', minOrder: 999 },
  { code: 'FLASH50', title: '৳50 Off Flash Voucher', discount: 50, type: 'fixed', minOrder: 700 }
];

// Hero Carousel Slides
export const HERO_SLIDES = [
  {
    id: 1,
    tag: 'MEGA SALE',
    title: 'Up to 70% off\non 1000+ items',
    subtitle: 'Gadgets, fashion, groceries and more',
    btnText: 'Shop now →',
    btnLink: '/shop?filter=on-sale',
    bgGradient: 'from-[#831843] via-[#701A75] to-[#4C1D95]',
    accentColor: '#F59E0B',
    previewItems: [
      { name: 'Earbuds', image: generateProductSvg('earbuds') },
      { name: 'Power Bank', image: generateProductSvg('powerbank') },
      { name: 'Smart Watch', image: generateProductSvg('smartwatch') }
    ]
  },
  {
    id: 2,
    tag: 'FRESH ESSENTIALS',
    title: 'Daily Groceries\nDelivered in 2 Hours',
    subtitle: 'Rice, oil, spices, dairy & snacks at best wholesale prices',
    btnText: 'Order Groceries →',
    btnLink: '/shop?category=groceries-essentials',
    bgGradient: 'from-[#065F46] via-[#047857] to-[#0D9488]',
    accentColor: '#34D399',
    previewItems: [
      { name: 'Milk Powder', image: generateProductSvg('milk_powder') },
      { name: 'Pure Honey', image: generateProductSvg('honey') },
      { name: 'Potato Chips', image: generateProductSvg('chips') }
    ]
  },
  {
    id: 3,
    tag: 'LATEST DROPS',
    title: 'Tech & Gadgets\nFor Your Everyday Life',
    subtitle: 'Smartwatches, ANC earbuds, routers & PC peripherals',
    btnText: 'Explore Gadgets →',
    btnLink: '/shop?category=computers-laptops',
    bgGradient: 'from-[#1E3A8A] via-[#1D4ED8] to-[#0284C7]',
    accentColor: '#38BDF8',
    previewItems: [
      { name: 'Mechanical Keys', image: generateProductSvg('keyboard') },
      { name: 'Wi-Fi Router', image: generateProductSvg('router') },
      { name: 'Hard Drive', image: generateProductSvg('hard_drive') }
    ]
  },
  {
    id: 4,
    tag: 'FASHION & HOME',
    title: 'Upgrade Your Style\n& Living Comfort',
    subtitle: 'Quality apparel, genuine leather goods & kitchen essentials',
    btnText: 'Browse Collection →',
    btnLink: '/shop?category=mens-fashion',
    bgGradient: 'from-[#831843] via-[#9F1239] to-[#E11D48]',
    accentColor: '#FDE047',
    previewItems: [
      { name: 'Crew T-Shirt', image: generateProductSvg('tshirt') },
      { name: 'Leather Wallet', image: generateProductSvg('wallet') },
      { name: 'Auto Umbrella', image: generateProductSvg('umbrella') }
    ]
  }
];

// Districts in Bangladesh for Checkout
export const BD_DISTRICTS = [
  'Dhaka (Inside City)',
  'Dhaka Suburb (Savar, Gazipur, Narayanganj)',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Cumilla',
  'Bogura',
  'Jessore',
  'Cox\'s Bazar',
  'Tangail',
  'Pabna',
  'Dinajpur',
  'Faridpur',
  'Kushtia',
  'Brahmanbaria',
  'Noakhali',
  'Feni',
  'Other District (Outside Dhaka)'
];
