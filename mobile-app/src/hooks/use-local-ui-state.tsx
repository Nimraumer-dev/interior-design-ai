import { useDesignStore } from '@/stores/design-store';

export function useLocalUiState() {
  const displayName = useDesignStore(state => state.displayName);
  const setDisplayName = useDesignStore(state => state.setDisplayName);
  const preferredStyleId = useDesignStore(state => state.preferredStyleId);
  const setPreferredStyleId = useDesignStore(state => state.setPreferredStyleId);
  const designs = useDesignStore(state => state.designs);
  const toggleDesignSaved = useDesignStore(state => state.toggleDesignSaved);
  const savedDesignIds = designs.filter(design => design.isFavorite).map(design => design.id);

  return {
    displayName,
    setDisplayName,
    preferredStyleId,
    setPreferredStyleId,
    savedDesignIds,
    isDesignSaved: (designId: string) => designs.some(design => design.id === designId && design.isFavorite),
    toggleDesignSaved,
  };
}
