import { Config } from '@/constants/config';
import { apiRequest } from '@/services/api';
import { MOCK_STYLES } from '@/services/mock-data';
import { useDesignStore } from '@/stores/design-store';
import { BudgetTier, DesignResult, FurnitureItem, RoomType } from '@/types/design';
import { Platform } from 'react-native';

interface ApiFurniture {
  id: string;
  name: string;
  category: string;
  pricePaisa: number;
  currency: 'PKR';
  dimensionsCm?: { w: number; h: number; d: number };
  colors?: string[];
  thumbUrl?: string | null;
}

interface ApiDesign {
  id: string;
  roomType: string;
  style: string;
  budgetRange: 'low' | 'medium' | 'high' | 'ultra';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  isMock: boolean;
  isFavorite?: boolean;
  originalImageUrl?: string | null;
  results: { variant: number; url: string; thumbUrl: string }[];
  recommendedFurniture?: ApiFurniture[];
  errorMessage?: string | null;
  createdAt: string;
}

interface ApiDesignResponse {
  design: ApiDesign;
}

interface ApiHistoryResponse {
  designs: ApiDesign[];
  pagination: { page: number; pages: number };
}

export interface CostEstimate {
  currency: 'PKR';
  totalPaisa: number;
  items: { itemId: string; qty: number; unitPricePaisa: number; lineTotalPaisa: number }[];
}

interface CreateDesignInput {
  roomType: RoomType;
  styleId: string;
  budgetTier: BudgetTier;
  imageUri: string;
  idempotencyKey: string;
  signal?: AbortSignal;
}

const roomTypeToApi: Record<RoomType, string> = {
  'living-room': 'living_room',
  bedroom: 'bedroom',
  kitchen: 'kitchen',
  bathroom: 'bathroom',
  'dining-room': 'dining_room',
  'home-office': 'office',
  hallway: 'other',
};

const roomTypeFromApi: Record<string, RoomType> = {
  living_room: 'living-room',
  bedroom: 'bedroom',
  kitchen: 'kitchen',
  bathroom: 'bathroom',
  dining_room: 'dining-room',
  office: 'home-office',
  other: 'hallway',
};

const styleToApi: Record<string, string> = {
  'style-001': 'minimalist',
  'style-002': 'modern',
  'style-003': 'scandinavian',
  'style-004': 'traditional',
  'style-005': 'contemporary',
  'style-006': 'coastal',
};

const budgetToApi: Record<BudgetTier, 'low' | 'medium' | 'high' | 'ultra'> = {
  essential: 'low',
  comfort: 'medium',
  luxury: 'high',
  ultra: 'ultra',
};

const budgetFromApi: Record<ApiDesign['budgetRange'], BudgetTier> = {
  low: 'essential',
  medium: 'comfort',
  high: 'luxury',
  ultra: 'ultra',
};

const styleFromApi = Object.fromEntries(
  Object.entries(styleToApi).map(([id, style]) => [style, id]),
);

function mapFurniture(item: ApiFurniture): FurnitureItem {
  const category: Record<string, string> = {
    sofa: 'Seating',
    bed: 'Seating',
    table: 'Tables',
    chair: 'Seating',
    wardrobe: 'Other',
    lamp: 'Lighting',
    rug: 'Textiles',
    decor: 'Other',
  };
  const dimensions = item.dimensionsCm;
  return {
    id: item.id,
    name: item.name,
    brand: 'Catalogue',
    category: category[item.category] ?? 'Other',
    priceUsd: 0,
    pricePaisa: item.pricePaisa,
    currency: item.currency,
    imageUrl: item.thumbUrl || '',
    material: item.colors?.join(', ') || 'See catalogue details',
    dimensions: {
      widthCm: dimensions?.w ?? 0,
      heightCm: dimensions?.h ?? 0,
      depthCm: dimensions?.d ?? 0,
    },
  };
}

export function mapApiDesign(
  apiDesign: ApiDesign,
  previous?: DesignResult,
  originalImageUrl: string | null = previous?.originalImageUrl ?? null,
): DesignResult {
  const styleId = styleFromApi[apiDesign.style] ?? '';
  const style = MOCK_STYLES.find(item => item.id === styleId);
  const styleName = style?.name ?? apiDesign.style
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const roomType = roomTypeFromApi[apiDesign.roomType] ?? 'hallway';
  const result = apiDesign.results[0];
  const generatedImageUrl = result?.url || previous?.generatedImageUrl || '';
  const status = apiDesign.status === 'queued' ? 'pending' : apiDesign.status;

  return {
    id: apiDesign.id,
    requestId: apiDesign.id,
    userId: previous?.userId ?? '',
    title: `${styleName} ${roomType.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}`,
    roomType,
    styleId,
    styleName,
    budgetTier: budgetFromApi[apiDesign.budgetRange],
    originalImageUrl: apiDesign.originalImageUrl || originalImageUrl,
    generatedImageUrl,
    thumbnailUrl: result?.thumbUrl || generatedImageUrl,
    status,
    isFavorite: apiDesign.isFavorite ?? previous?.isFavorite ?? false,
    isDemo: apiDesign.isMock,
    isMock: apiDesign.isMock,
    errorMessage: apiDesign.errorMessage,
    createdAt: apiDesign.createdAt,
    suggestedFurniture: (apiDesign.recommendedFurniture ?? []).map(mapFurniture),
  };
}

async function makeImagePart(uri: string, signal?: AbortSignal): Promise<Blob | { uri: string; name: string; type: string }> {
  if (Platform.OS === 'web' || /^(https?:\/\/|blob:|data:)/i.test(uri)) {
    const response = await fetch(uri, { signal });
    if (!response.ok) throw new Error('The sample room image could not be downloaded.');
    const blob = await response.blob();
    if (!blob.size) throw new Error('The selected room image is empty.');
    return blob;
  }
  return { uri, name: 'room.jpg', type: 'image/jpeg' };
}

export async function createDesign(input: CreateDesignInput): Promise<string> {
  const formData = new FormData();
  const imagePart = await makeImagePart(input.imageUri, input.signal);
  if (imagePart instanceof Blob) {
    formData.append('image', imagePart, 'room.jpg');
  } else {
    const nativeFormData = formData as FormData & {
      append(name: string, value: { uri: string; name: string; type: string }): void;
    };
    nativeFormData.append('image', imagePart);
  }
  formData.append('roomType', roomTypeToApi[input.roomType]);
  formData.append('style', styleToApi[input.styleId] ?? '');
  formData.append('budgetRange', budgetToApi[input.budgetTier]);
  formData.append('colors', JSON.stringify([]));
  formData.append('numVariants', '1');

  const response = await apiRequest<{ designId: string; status: string }>('/designs', {
    method: 'POST',
    headers: { 'Idempotency-Key': input.idempotencyKey },
    body: formData,
    signal: input.signal,
  });
  return response.designId;
}

export async function getDesign(
  designId: string,
  signal?: AbortSignal,
): Promise<ApiDesign> {
  const response = await apiRequest<ApiDesignResponse>(`/designs/${encodeURIComponent(designId)}`, {
    signal,
  });
  return response.design;
}

export async function waitForDesign(
  designId: string,
  signal: AbortSignal,
): Promise<ApiDesign> {
  const deadline = Date.now() + Config.generationTimeoutMs;
  while (Date.now() < deadline) {
    if (signal.aborted) throw new DOMException('Request cancelled.', 'AbortError');
    const design = await getDesign(designId, signal);
    if (design.status === 'completed') return design;
    if (design.status === 'failed') {
      throw new DesignGenerationError(
        design.errorMessage || 'Design generation failed. No credit was charged.',
        true,
      );
    }
    await new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('Request cancelled.', 'AbortError'));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, Config.generationPollingIntervalMs);
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }
  throw new Error('Design generation is still running. Check My Designs in a moment.');
}

export class DesignGenerationError extends Error {
  constructor(message: string, readonly canStartNewRequest: boolean) {
    super(message);
    this.name = 'DesignGenerationError';
  }
}

export async function refreshDesignHistory(signal?: AbortSignal): Promise<void> {
  useDesignStore.getState().replaceDesigns(await fetchDesignHistory(signal));
}

export async function fetchDesignHistory(signal?: AbortSignal): Promise<DesignResult[]> {
  const allDesigns: ApiDesign[] = [];
  let page = 1;
  let pages = 1;
  do {
    const response = await apiRequest<ApiHistoryResponse>(`/designs?page=${page}&limit=100`, { signal });
    allDesigns.push(...response.designs);
    pages = response.pagination.pages;
    page += 1;
  } while (page <= pages);

  const previous = useDesignStore.getState().designs;
  const previousById = new Map(previous.map(design => [design.id, design]));
  return allDesigns.map(design => mapApiDesign(design, previousById.get(design.id)));
}

export async function refreshDesign(
  designId: string,
  signal?: AbortSignal,
): Promise<void> {
  const design = await getDesign(designId, signal);
  const previous = useDesignStore.getState().designs.find(item => item.id === designId);
  useDesignStore.getState().addDesign(mapApiDesign(design, previous));
}

export async function deleteRemoteDesign(designId: string): Promise<void> {
  await apiRequest<void>(`/designs/${encodeURIComponent(designId)}`, { method: 'DELETE' });
}

export async function setDesignFavorite(designId: string, saved: boolean): Promise<void> {
  await apiRequest(`/designs/${encodeURIComponent(designId)}/favorite`, {
    method: 'PATCH',
    body: JSON.stringify({ saved }),
  });
}

export async function estimateCost(
  items: { itemId: string; qty: number }[],
  signal?: AbortSignal,
): Promise<CostEstimate> {
  return apiRequest<CostEstimate>('/cost/estimate', {
    method: 'POST',
    body: JSON.stringify({ items }),
    signal,
  });
}
