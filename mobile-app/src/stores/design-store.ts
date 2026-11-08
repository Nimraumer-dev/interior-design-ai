import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { MOCK_STYLES, MOCK_USER } from '@/services/mock-data';
import { deleteDesignOriginalImage } from '@/services/local-design-images';
import { BudgetTier, DesignResult, RoomType } from '@/types/design';
import { AppearancePreference } from '@/types/preferences';

interface DesignStore {
  roomType: RoomType | null;
  styleId: string | null;
  budgetTier: BudgetTier | null;
  imageUri: string | null;
  designs: DesignResult[];
  savedDesignIds: string[];
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
  replaceDesigns: (designs: DesignResult[]) => void;
  clearDesigns: () => void;
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
  'savedDesignIds' | 'displayName' | 'preferredStyleId' | 'notificationsEnabled' | 'appearancePreference'
>;

const browserStorage: StateStorage = {
  getItem: name => typeof window === 'undefined' ? null : window.localStorage.getItem(name),
  setItem: (name, value) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(name, value);
  },
  removeItem: name => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(name);
  },
};

export const useDesignStore = create<DesignStore>()(persist((set) => ({
  roomType: null,
  styleId: null,
  budgetTier: null,
  imageUri: null,
  designs: [],
  savedDesignIds: [],
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
    set(state => ({
      designs: [
        { ...design, isFavorite: state.savedDesignIds.includes(design.id) || design.isFavorite },
        ...state.designs.filter(item => item.id !== design.id),
      ],
    })),
  replaceDesigns: designs =>
    set({
      designs,
      savedDesignIds: designs.filter(design => design.isFavorite).map(design => design.id),
    }),
  clearDesigns: () => set({ designs: [], savedDesignIds: [] }),
  toggleDesignSaved: designId =>
    set(state => {
      const saved = state.savedDesignIds.includes(designId);
      return {
        savedDesignIds: saved
          ? state.savedDesignIds.filter(id => id !== designId)
          : [...state.savedDesignIds, designId],
        designs: state.designs.map(design =>
          design.id === designId ? { ...design, isFavorite: !saved } : design,
        ),
      };
    }),
  deleteDesign: async designId => {
    const design = useDesignStore.getState().designs.find(item => item.id === designId);
    set(state => ({
      designs: state.designs.filter(item => item.id !== designId),
      savedDesignIds: state.savedDesignIds.filter(id => id !== designId),
    }));
    if (design) await deleteDesignOriginalImage(design.originalImageUrl);
  },
  setDisplayName: displayName => set({ displayName }),
  setPreferredStyleId: preferredStyleId => set({ preferredStyleId }),
  setNotificationsEnabled: notificationsEnabled => set({ notificationsEnabled }),
  setAppearancePreference: appearancePreference => set({ appearancePreference }),
  setHydrationStatus: (hasHydrated, hydrationError) => set({ hasHydrated, hydrationError }),
}), {
  name: 'atelier.local-designs-and-preferences',
  storage: createJSONStorage(() => Platform.OS === 'web' ? browserStorage : AsyncStorage),
  version: 3,
  skipHydration: true,
  migrate: (persistedState, version) => {
    const persisted = typeof persistedState === 'object' && persistedState !== null
      ? persistedState as Record<string, unknown>
      : {};
    const savedDesignIds = Array.isArray(persisted.savedDesignIds)
      ? persisted.savedDesignIds.filter((id): id is string => typeof id === 'string')
      : [];
    return {
      savedDesignIds: version < 3 ? [] : savedDesignIds,
      displayName: typeof persisted.displayName === 'string' ? persisted.displayName : MOCK_USER.displayName,
      preferredStyleId: typeof persisted.preferredStyleId === 'string'
        ? persisted.preferredStyleId
        : MOCK_STYLES[0].id,
      notificationsEnabled: typeof persisted.notificationsEnabled === 'boolean'
        ? persisted.notificationsEnabled
        : true,
      appearancePreference: persisted.appearancePreference === 'light' ||
        persisted.appearancePreference === 'dark' ||
        persisted.appearancePreference === 'system'
        ? persisted.appearancePreference
        : 'system',
    };
  },
  partialize: (state): PersistedDesignState => ({
    savedDesignIds: state.savedDesignIds,
    displayName: state.displayName,
    preferredStyleId: state.preferredStyleId,
    notificationsEnabled: state.notificationsEnabled,
    appearancePreference: state.appearancePreference,
  }),
  onRehydrateStorage: () => (_hydratedState, error) => {
    useDesignStore.getState().setHydrationStatus(
      true,
      error ? 'Saved designs and preferences could not be loaded from this device. Retry to try again.' : null,
    );
  },
}));
