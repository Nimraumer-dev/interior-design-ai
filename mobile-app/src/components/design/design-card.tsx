import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Brand, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DesignResult } from '@/types/design';
import { formatRelativeDate, roomTypeLabel } from '@/utils/format';

interface DesignCardProps {
  design: DesignResult;
  onPress?: () => void;
  /** 'grid' = square compact card, 'row' = wide horizontal card */
  layout?: 'grid' | 'row';
}

export function DesignCard({ design, onPress, layout = 'grid' }: DesignCardProps) {
  const theme = useTheme();
  if (layout === 'row') {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.rowCard,
          { backgroundColor: theme.surfaceElevated },
          pressed && styles.pressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <Image source={{ uri: design.thumbnailUrl }} style={styles.rowImage} contentFit="cover" />
        <View style={styles.rowContent}>
          <View style={styles.badgeRow}>
            <Badge label={design.styleName} variant="default" />
            {design.isDemo && <Badge label="Demo" variant="accent" />}
          </View>
          <Text style={[styles.rowTitle, { color: theme.espresso }]} numberOfLines={2}>{design.title}</Text>
          <Text style={[styles.rowMeta, { color: theme.taupe }]}>
            {roomTypeLabel(design.roomType)} · {formatRelativeDate(design.createdAt)}
          </Text>
        </View>
        {design.isFavorite && (
          <View style={styles.heartWrapRow}>
            <SymbolView
              name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
              size={14}
              tintColor={Brand.gold}
            />
          </View>
        )}
        {design.isDemo && (
          <View style={styles.demoBadge}>
            <Badge label="Demo" variant="accent" />
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Image source={{ uri: design.thumbnailUrl }} style={styles.gridImage} contentFit="cover" />
      <View style={styles.gridOverlay} />
      {design.isFavorite && (
        <View style={styles.heartWrapGrid}>
          <SymbolView
            name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
            size={14}
            tintColor={Brand.gold}
          />
        </View>
      )}
      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={1}>{design.title}</Text>
        <Text style={styles.gridMeta}>{roomTypeLabel(design.roomType)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.soft,
  },
  gridImage: { ...StyleSheet.absoluteFill },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Brand.espresso,
    opacity: 0.35,
  },
  heartWrapGrid: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
  },
  gridContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.two,
    paddingBottom: Spacing.three,
  },
  gridTitle: { ...Typography.labelLarge, color: Brand.ivory, fontWeight: '600' },
  gridMeta: { ...Typography.labelSmall, color: Brand.beige, opacity: 0.85, marginTop: 2 },
  rowCard: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    ...Shadow.soft,
  },
  rowImage: { width: 88, height: 88 },
  rowContent: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 4,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  demoBadge: { position: 'absolute', top: Spacing.two, left: Spacing.two },
  rowTitle: { ...Typography.labelLarge, fontWeight: '600' },
  rowMeta: { ...Typography.bodySmall },
  heartWrapRow: { paddingRight: Spacing.three },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
});
