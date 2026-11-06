import { MOCK_FURNITURE, MOCK_STYLES } from '@/services/mock-data';
import { BudgetTier, DesignResult, RoomType } from '@/types/design';
import { roomTypeLabel } from '@/utils/format';

export function createDemoDesign({
  roomType,
  styleId,
  budgetTier,
  imageUri,
}: {
  roomType: RoomType;
  styleId: string;
  budgetTier: BudgetTier;
  imageUri: string;
}): DesignResult {
  const style = MOCK_STYLES.find(option => option.id === styleId);
  if (!style) {
    throw new Error('Choose a valid style to prepare the demo preview.');
  }

  const createdAt = new Date().toISOString();
  const id = `demo-${Date.now()}`;

  return {
    id,
    requestId: id,
    userId: 'local-demo-user',
    title: `${style.name} ${roomTypeLabel(roomType)}`,
    roomType,
    styleId,
    styleName: style.name,
    budgetTier,
    originalImageUrl: imageUri,
    generatedImageUrl: style.previewImageUrl,
    thumbnailUrl: style.previewImageUrl,
    status: 'completed',
    isFavorite: false,
    isDemo: true,
    createdAt,
    suggestedFurniture: MOCK_FURNITURE.slice(0, 4),
  };
}
