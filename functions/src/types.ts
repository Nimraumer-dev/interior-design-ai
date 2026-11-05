import { Timestamp } from "firebase-admin/firestore";

export type UserRole = "customer" | "admin";

export type DesignStatus = "queued" | "processing" | "completed" | "failed";

export interface UserProfile {
  name: string;
  email: string;
  credits: number;
  role: UserRole;
  createdAt: Timestamp;
}

export interface DesignDocument {
  ownerId: string;
  roomType: string;
  style: string;
  budgetRange: string;
  originalImagePath: string;
  status: DesignStatus;
  results: DesignResult[] | null;
  palette: ColorSwatch[] | null;
  recommendations: string[] | null;
  errorMessage: string | null;
  createdAt: Timestamp;
}

export interface DesignResult {
  label: string;
  imagePath: string;   // Storage path, never a raw external URL
  isMock: boolean;     // true until real AI integration replaces this
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

// Payload sent by the client when calling generateDesign
export interface GenerateDesignPayload {
  designId: string;
}

// ── Catalog ───────────────────────────────────────────────────────────────────

export type FurnitureCategory =
  | "seating"
  | "tables"
  | "storage"
  | "lighting"
  | "decor";

export type DesignStyle =
  | "modern"
  | "minimalist"
  | "traditional"
  | "bohemian"
  | "industrial";

export interface CatalogItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  styles: DesignStyle[];       // which design styles this item suits
  price: number;               // always PKR
  currency: "PKR";
  dimensionsCm: { w: number; d: number; h: number };
  colors: string[];
  modelPath: string;           // Storage path for 3D model
  thumbPath: string;           // Storage path for thumbnail
  isActive: boolean;
}

// ── Recommendations & cost estimation ────────────────────────────────────────

export interface RecommendationResult {
  item: CatalogItem;
  score: number;               // 0–1 relevance score
  reason: string;
}

export interface CostEstimate {
  items: Array<{ itemId: string; name: string; price: number; currency: "PKR" }>;
  subtotalPKR: number;
  budgetRange: string;
  withinBudget: boolean;
  note: string;
}

export interface EstimateCostPayload {
  designId: string;
  selectedItemIds: string[];
}

// ── AI integration ────────────────────────────────────────────────────────────

export interface AiGenerationInput {
  roomType: string;
  style: string;
  budgetRange: string;
  imageStoragePath: string;    // path in Firebase Storage, not a public URL
}

export interface AiGenerationOutput {
  results: DesignResult[];
  palette: ColorSwatch[];
  recommendations: string[];
  isMock: boolean;
}
