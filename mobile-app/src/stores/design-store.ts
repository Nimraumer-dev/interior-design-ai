import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MOCK_DESIGNS, MOCK_STYLES, MOCK_USER } from '@/services/mock-data';
import { deleteDesignOriginalImage } from '@/services/local-design-images';
import { BudgetTier, DesignResult, RoomType } from '@/types/design';
import { AppearancePreference } from '@/types/preferences';

interface DesignStore {
  roomType: RoomType | null;
  styleId: string | null;
  budgetTier: BudgetTier | null;
  imageUri: string | null;
  designs: DesignResult[];
  displayName: string;
  preferredStyleId: string;
  notificationsEnabled: boolean;
  appearancePreference: AppearancePreference;
  hasHydrated: boolean;
  hydrationError: string | null;
  setRoomType: (roomType: RoomType | null) => void;
  setStyleId: (styleId: string | null) => void;
  setBudgetTier: (budgetTier: BudgetTier | null) => void;
  setImageUri: (imageUri: string | null) => void;
  resetDesignFlow: () => void;
  addDesign: (design: DesignResult) => void;
  toggleDesignSaved: (designId: string) => void;
  deleteDesign: (designId: string) => Promise<void>;
  setDisplayName: (displayName: string) => void;
  setPreferredStyleId: (styleId: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setAppearancePreference: (preference: AppearancePreference) => void;
  setHydrationStatus: (hasHydrated: boolean, error: string | null) => void;
}

type PersistedDesignState = Pick<
  DesignStore,
  'designs' | 'displayName' | 'preferredStyleId' | 'notificationsEnabled' | 'appearancePreference'
>;

const initialDesigns = () => MOCK_DESIGNS.map(design => ({ ...design }));
const serverStorage: StateStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};

export const useDesignStore = create<DesignStore>()(persist((set) => ({
  roomType: null,
  styleId: null,
  budgetTier: null,
  imageUri: null,
  designs: initialDesigns(),
  displayName: MOCK_USER.displayName,
  preferredStyleId: MOCK_STYLES[0].id,
  notificationsEnabled: true,
  appearancePreference: 'system',
  hasHydrated: false,
  hydrationError: null,
  setRoomType: roomType => set({ roomType }),
  setStyleId: styleId => set({ styleId }),
  setBudgetTier: budgetTier => set({ budgetTier }),
  setImageUri: imageUri => set({ imageUri }),
  resetDesignFlow: () => set({ roomType: null, styleId: null, budgetTier: null, imageUri: null }),
  addDesign: design =>
    set(state => ({ designs: [design, ...state.designs.filter(item => item.id !== design.id)] })),
  toggleDesignSaved: designId =>
    set(state => ({
      designs: state.designs.map(design =>
        design.id === designId ? { ...design, isFavorite: !design.isFavorite } : design,
      ),
    })),
  deleteDesign: async designId => {
    const design = useDesignStore.getState().designs.find(item => item.id === designId);
    set(state => ({ designs: state.designs.filter(item => item.id !== designId) }));
    if (design) await deleteDesignOriginalImage(design.originalImageUrl);
  },
  setDisplayName: displayName => set({ displayName }),
  setPreferredStyleId: preferredStyleId => set({ preferredStyleId }),
  setNotificationsEnabled: notificationsEnabled => set({ notificationsEnabled }),
  setAppearancePreference: appearancePreference => set({ appearancePreference }),
  setHydrationStatus: (hasHydrated, hydrationError) => set({ hasHydrated, hydrationError }),
}), {
  name: 'atelier.local-designs-and-preferences',
  storage: createJSONStorage(() => typeof window === 'undefined' ? serverStorage : AsyncStorage),
  version: 1,
  skipHydration: true,
  partialize: (state): PersistedDesignState => ({
    designs: state.designs,
    displayName: state.displayName,
    preferredStyleId: state.preferredStyleId,
    notificationsEnabled: state.notificationsEnabled,
    appearancePreference: state.appearancePreference,
  }),
  onRehydrateStorage: state => (hydratedState, error) => {
    state?.setHydrationStatus(
      true,
      error ? 'Saved designs and preferences could not be loaded from this device.' : null,
    );
    hydratedState?.setHydrationStatus(
      true,
      error ? 'Saved designs and preferences could not be loaded from this device.' : null,
    );
  },
}));
