import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const isWide = width >= 1280;
  const columns = width >= 1280 ? 4 : isTablet ? 3 : 2;
  const contentMaxWidth = isWide ? 1280 : isTablet ? 960 : width;

  return {
    width,
    isTablet,
    isDesktop,
    isWide,
    columns,
    contentMaxWidth,
    horizontalPadding: width < 400 ? 16 : isWide ? 40 : isTablet ? 32 : 24,
    contentStyle: {
      width: '100%' as const,
      maxWidth: contentMaxWidth,
      alignSelf: 'center' as const,
    },
  };
}
