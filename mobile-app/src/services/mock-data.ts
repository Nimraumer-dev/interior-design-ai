import { BudgetOption, DesignResult, FurnitureItem, StyleOption } from '@/types/design';
import { User } from '@/types/auth';

// ---------------------------------------------------------------------------
// Mock user
// ---------------------------------------------------------------------------
export const MOCK_USER: User = {
  id: 'user-001',
  email: 'sophia@example.com',
  displayName: 'Sophia Laurent',
  avatarUrl: 'https://i.pravatar.cc/150?img=47',
  provider: 'email',
  createdAt: '2024-09-01T10:00:00Z',
  generationsUsed: 4,
  generationsLimit: 10,
  plan: 'pro',
};

// ---------------------------------------------------------------------------
// Budget tiers
// ---------------------------------------------------------------------------
export const MOCK_BUDGETS: BudgetOption[] = [
  {
    id: 'essential',
    label: 'Essential',
    description: 'Functional pieces with clean design at accessible price points.',
    rangeLabel: '$500 – $2,000',
    minUsd: 500,
    maxUsd: 2000,
  },
  {
    id: 'comfort',
    label: 'Comfort',
    description: 'Quality mid-range furniture with lasting materials and style.',
    rangeLabel: '$2,000 – $8,000',
    minUsd: 2000,
    maxUsd: 8000,
  },
  {
    id: 'luxury',
    label: 'Luxury',
    description: 'Premium designer pieces and artisan craftsmanship.',
    rangeLabel: '$8,000 – $25,000',
    minUsd: 8000,
    maxUsd: 25000,
  },
  {
    id: 'ultra',
    label: 'Ultra',
    description: 'Bespoke, rare and collector-grade interior objects.',
    rangeLabel: '$25,000+',
    minUsd: 25000,
    maxUsd: 999999,
  },
];

// ---------------------------------------------------------------------------
// Interior style options
// ---------------------------------------------------------------------------
export const MOCK_STYLES: StyleOption[] = [
  {
    id: 'style-001',
    name: 'Warm Minimalist',
    description: 'Clean lines softened by warm ivory tones, natural linen and walnut accents.',
    previewImageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
    tags: ['minimal', 'warm', 'neutral'],
  },
  {
    id: 'style-002',
    name: 'Modern Luxury',
    description: 'Dramatic proportions, rich materials and a curated palette of cream and gold.',
    previewImageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80',
    tags: ['luxury', 'modern', 'gold'],
  },
  {
    id: 'style-003',
    name: 'Japandi',
    description: 'Japanese wabi-sabi meets Scandinavian simplicity — serene, earthy and functional.',
    previewImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
    tags: ['japandi', 'earthy', 'serene'],
  },
  {
    id: 'style-004',
    name: 'Mediterranean',
    description: 'Terracotta, arched doorways, linen drapes and sun-bleached natural textures.',
    previewImageUrl: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80',
    tags: ['mediterranean', 'terracotta', 'natural'],
  },
  {
    id: 'style-005',
    name: 'Art Deco',
    description: 'Bold geometry, velvet upholstery, brass fixtures and deep jewel tones.',
    previewImageUrl: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=600&q=80',
    tags: ['art-deco', 'bold', 'brass'],
  },
  {
    id: 'style-006',
    name: 'Coastal Organic',
    description: 'Bleached oak, rattan, boucle and ocean-inspired neutrals for a relaxed retreat.',
    previewImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
    tags: ['coastal', 'organic', 'rattan'],
  },
];

// ---------------------------------------------------------------------------
// Furniture items
// ---------------------------------------------------------------------------
export const MOCK_FURNITURE: FurnitureItem[] = [
  {
    id: 'furn-001',
    name: 'Boucle Cloud Sofa',
    brand: 'Restoration Hardware',
    category: 'Seating',
    priceUsd: 3200,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    material: 'Boucle fabric, solid walnut legs',
    dimensions: { widthCm: 220, heightCm: 82, depthCm: 95 },
  },
  {
    id: 'furn-002',
    name: 'Travertine Side Table',
    brand: 'CB2',
    category: 'Tables',
    priceUsd: 890,
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
    material: 'Natural travertine stone',
    dimensions: { widthCm: 45, heightCm: 55, depthCm: 45 },
  },
  {
    id: 'furn-003',
    name: 'Walnut Dining Table',
    brand: 'Article',
    category: 'Tables',
    priceUsd: 1650,
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&q=80',
    material: 'Solid American walnut',
    dimensions: { widthCm: 180, heightCm: 76, depthCm: 90 },
  },
  {
    id: 'furn-004',
    name: 'Linen Accent Chair',
    brand: 'West Elm',
    category: 'Seating',
    priceUsd: 720,
    imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&q=80',
    material: 'Belgian linen, brass legs',
    dimensions: { widthCm: 75, heightCm: 85, depthCm: 80 },
  },
  {
    id: 'furn-005',
    name: 'Rattan Floor Lamp',
    brand: 'Serena & Lily',
    category: 'Lighting',
    priceUsd: 480,
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80',
    material: 'Natural rattan, linen shade',
    dimensions: { widthCm: 40, heightCm: 165, depthCm: 40 },
  },
  {
    id: 'furn-006',
    name: 'Marble Coffee Table',
    brand: 'RH Modern',
    category: 'Tables',
    priceUsd: 2400,
    imageUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&q=80',
    material: 'Calacatta marble, brushed brass base',
    dimensions: { widthCm: 120, heightCm: 38, depthCm: 60 },
  },
  {
    id: 'furn-007',
    name: 'Velvet Chaise Lounge',
    brand: 'Anthropologie',
    category: 'Seating',
    priceUsd: 1890,
    imageUrl: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400&q=80',
    material: 'Champagne velvet, gold legs',
    dimensions: { widthCm: 160, heightCm: 78, depthCm: 70 },
  },
  {
    id: 'furn-008',
    name: 'Linen Curtain Panel',
    brand: 'Pottery Barn',
    category: 'Textiles',
    priceUsd: 320,
    imageUrl: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400&q=80',
    material: 'Belgian linen, blackout lining',
    dimensions: { widthCm: 140, heightCm: 270, depthCm: 1 },
  },
];

// ---------------------------------------------------------------------------
// Saved design results
// ---------------------------------------------------------------------------
export const MOCK_DESIGNS: DesignResult[] = [
  {
    id: 'design-001',
    requestId: 'req-001',
    userId: 'user-001',
    title: 'Warm Minimalist Living Room',
    roomType: 'living-room',
    styleId: 'style-001',
    styleName: 'Warm Minimalist',
    budgetTier: 'luxury',
    originalImageUrl: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80',
    generatedImageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
    status: 'completed',
    isFavorite: true,
    isDemo: true,
    createdAt: '2025-06-10T14:30:00Z',
    suggestedFurniture: [MOCK_FURNITURE[0], MOCK_FURNITURE[1], MOCK_FURNITURE[5], MOCK_FURNITURE[7]],
  },
  {
    id: 'design-002',
    requestId: 'req-002',
    userId: 'user-001',
    title: 'Modern Luxury Bedroom',
    roomType: 'bedroom',
    styleId: 'style-002',
    styleName: 'Modern Luxury',
    budgetTier: 'ultra',
    originalImageUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
    generatedImageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&q=80',
    status: 'completed',
    isFavorite: false,
    isDemo: true,
    createdAt: '2025-06-08T09:15:00Z',
    suggestedFurniture: [MOCK_FURNITURE[3], MOCK_FURNITURE[6]],
  },
  {
    id: 'design-003',
    requestId: 'req-003',
    userId: 'user-001',
    title: 'Japandi Home Office',
    roomType: 'home-office',
    styleId: 'style-003',
    styleName: 'Japandi',
    budgetTier: 'comfort',
    originalImageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80',
    generatedImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    status: 'completed',
    isFavorite: true,
    isDemo: true,
    createdAt: '2025-06-05T16:45:00Z',
    suggestedFurniture: [MOCK_FURNITURE[2], MOCK_FURNITURE[4]],
  },
  {
    id: 'design-004',
    requestId: 'req-004',
    userId: 'user-001',
    title: 'Coastal Organic Kitchen',
    roomType: 'kitchen',
    styleId: 'style-006',
    styleName: 'Coastal Organic',
    budgetTier: 'comfort',
    originalImageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    generatedImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80',
    status: 'completed',
    isFavorite: false,
    isDemo: true,
    createdAt: '2025-06-01T11:00:00Z',
    suggestedFurniture: [],
  },
];
