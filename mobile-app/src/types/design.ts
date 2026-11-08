export type RoomType =
  | 'living-room'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'dining-room'
  | 'home-office'
  | 'hallway';

export type DesignStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type BudgetTier = 'essential' | 'comfort' | 'luxury' | 'ultra';

export interface BudgetOption {
  id: BudgetTier;
  label: string;
  description: string;
  rangeLabel: string;
}

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  previewImageUrl: string;
  tags: string[];
}

export interface FurnitureItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  priceUsd: number;
  pricePaisa?: number;
  currency?: 'USD' | 'PKR';
  imageUrl: string;
  productUrl?: string;
  material: string;
  dimensions: { widthCm: number; heightCm: number; depthCm: number };
}

export interface DesignRequest {
  id: string;
  roomType: RoomType;
  styleId: string;
  budgetTier: BudgetTier;
  originalImageUrl: string;
  createdAt: string;
}

export interface DesignResult {
  id: string;
  requestId: string;
  userId: string;
  title: string;
  roomType: RoomType;
  styleId: string;
  styleName: string;
  budgetTier: BudgetTier;
  originalImageUrl: string | null;
  generatedImageUrl: string;
  thumbnailUrl: string;
  status: DesignStatus;
  isFavorite: boolean;
  isDemo?: boolean;
  isMock?: boolean;
  errorMessage?: string | null;
  createdAt: string;
  suggestedFurniture: FurnitureItem[];
}
