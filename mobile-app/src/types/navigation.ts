import { BudgetTier, RoomType } from './design';

export interface DesignFlowParams {
  roomType?: RoomType;
  styleId?: string;
  budgetTier?: BudgetTier;
  imageUri?: string;
}

export interface ResultScreenParams {
  resultId: string;
}

export interface FurnitureDetailParams {
  furnitureId: string;
  resultId: string;
}

export interface PreviewScreenParams {
  resultId: string;
}
