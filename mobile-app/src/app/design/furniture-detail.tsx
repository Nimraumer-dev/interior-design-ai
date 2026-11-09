import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useTheme } from '@/hooks/use-theme';
import { furniturePriceLabel } from '@/utils/format';
import { useDesignStore } from '@/stores/design-store';

function DimRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.dimRow}>
      <Text style={[styles.dimLabel, { color: theme.taupe }]}>{label}</Text>
      <Text style={[styles.dimValue, { color: theme.espresso }]}>{value}</Text>
    </View>
  );
}

export default function FurnitureDetailScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { contentStyle, isDesktop } = useResponsiveLayout();
  const { furnitureId, resultId } = useLocalSearchParams<{ furnitureId?: string; resultId?: string }>();
  const designs = useDesignStore(state => state.designs);
  const design = designs.find(result => result.id === resultId);
  const item = design?.suggestedFurniture.find(furniture => furniture.id === furnitureId);
  const [wishlisted, setWishlisted] = useState(false);

  async function openRetailer() {
    if (!item) return;
    if (!item.productUrl) {
      Alert.alert('Pending integration', 'A retailer link is not available for this furniture item yet.');
      return;
    }

    try {
      await Linking.openURL(item.productUrl);
    } catch {
      Alert.alert('Unable to open link', 'The retailer website could not be opened.');
    }
  }

  if (!item) {
    return (
      <View style={[styles.root, styles.emptyResult, { paddingTop: insets.top, backgroundColor: theme.ivory }]}>
        <Text style={[styles.itemName, { color: theme.espresso }]}>Furniture unavailable</Text>
        <Text style={[styles.itemBrand, { color: theme.taupe }]}>This item is not in this design&apos;s current recommendations.</Text>
        <Button label="Go to My Designs" onPress={() => router.replace('/(tabs)/designs')} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: theme.ivory }]}>
      {/* Top bar */}
      <View style={[styles.topBar, contentStyle, { borderBottomColor: theme.border }]}>
        <Pressable style={[styles.iconBtn, { backgroundColor: theme.beige }]} onPress={() => router.back()} accessibilityLabel="Go back">
          <SymbolView name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }} size={18} tintColor={theme.espresso} weight="light" />
        </Pressable>
        <Text style={[styles.topTitle, { color: theme.espresso }]} numberOfLines={1}>{item.name}</Text>
        <Pressable style={[styles.iconBtn, { backgroundColor: theme.beige }]} onPress={() => setWishlisted(v => !v)} accessibilityLabel="Wishlist">
          <SymbolView
            name={wishlisted ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' } : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
            size={18}
            tintColor={wishlisted ? Brand.gold : Brand.taupe}
          />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[contentStyle, { paddingBottom: insets.bottom + 120 }]}>
        {/* Hero image */}
        <Image source={{ uri: item.imageUrl }} style={[styles.heroImage, isDesktop && styles.heroImageDesktop]} contentFit="cover" />

        <View style={[styles.body, { maxWidth: 820, alignSelf: 'center', width: '100%' }]}>
          {/* Header */}
          <View style={styles.itemHeader}>
            <View style={styles.itemHeaderLeft}>
              <Badge label={item.category} variant="default" />
              <Text style={[styles.itemName, { color: theme.espresso }]}>{item.name}</Text>
              <Text style={[styles.itemBrand, { color: theme.taupe }]}>{item.brand}</Text>
            </View>
            <Text style={[styles.itemPrice, { color: theme.gold }]}>{furniturePriceLabel(item)}</Text>
          </View>

          {/* Material */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.walnut }]}>Material</Text>
            <View style={[styles.materialRow, { backgroundColor: theme.cream }]}>
              <SymbolView name={{ ios: 'leaf', android: 'eco', web: 'eco' }} size={16} tintColor={Brand.gold} weight="light" />
              <Text style={[styles.materialText, { color: theme.espresso }]}>{item.material}</Text>
            </View>
          </View>

          {/* Dimensions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.walnut }]}>Dimensions</Text>
            <View style={[styles.dimsCard, { backgroundColor: theme.surfaceElevated }]}>
              <DimRow label="Width" value={`${item.dimensions.widthCm} cm`} />
              <View style={styles.dimDivider} />
              <DimRow label="Height" value={`${item.dimensions.heightCm} cm`} />
              <View style={styles.dimDivider} />
              <DimRow label="Depth" value={`${item.dimensions.depthCm} cm`} />
            </View>
          </View>

          {/* Why it fits */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.walnut }]}>Why It Fits Your Design</Text>
            <View style={[styles.fitCard, { backgroundColor: theme.cream }]}>
              <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={16} tintColor={Brand.gold} weight="light" />
              <Text style={[styles.fitText, { color: theme.taupe }]}>
                Recommended for your {design?.styleName ?? 'selected'} room design. Product availability and retailer links depend on catalogue setup.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.cta, contentStyle, { paddingBottom: insets.bottom + Spacing.three, backgroundColor: theme.ivory, borderTopColor: theme.border }]}>
        <Button label="View on Retailer Website" onPress={openRetailer} fullWidth size="lg" />
        <Button
          label="Back to Furniture List"
          variant="secondary"
          onPress={() => router.back()}
          fullWidth
          size="md"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ivory },
  emptyResult: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.four, gap: Spacing.three },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.two,
    borderBottomWidth: 1, borderBottomColor: Brand.beige,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Brand.beige, alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { flex: 1, textAlign: 'center', ...Typography.labelLarge, color: Brand.espresso, marginHorizontal: Spacing.two },
  heroImage: { width: '100%', height: 280 },
  heroImageDesktop: { height: 440 },
  body: { padding: Spacing.four, gap: Spacing.four },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.three },
  itemHeaderLeft: { flex: 1, gap: Spacing.one },
  itemName: { fontSize: 22, fontWeight: '300', color: Brand.espresso, fontFamily: Fonts?.serif ?? 'serif' },
  itemBrand: { ...Typography.bodySmall, color: Brand.taupe },
  itemPrice: { fontSize: 22, fontWeight: '600', color: Brand.gold, fontFamily: Fonts?.serif ?? 'serif' },
  section: { gap: Spacing.two },
  sectionTitle: { ...Typography.labelLarge, color: Brand.walnut, textTransform: 'uppercase', letterSpacing: 1 },
  materialRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: Brand.cream, borderRadius: Radius.md, padding: Spacing.three },
  materialText: { ...Typography.bodyMedium, color: Brand.espresso, flex: 1 },
  dimsCard: { backgroundColor: Brand.white, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.soft },
  dimRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  dimLabel: { ...Typography.bodyMedium, color: Brand.taupe },
  dimValue: { ...Typography.labelLarge, color: Brand.espresso, fontWeight: '600' },
  dimDivider: { height: 1, backgroundColor: Brand.beige, marginHorizontal: Spacing.three },
  fitCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, backgroundColor: Brand.cream, borderRadius: Radius.md, padding: Spacing.three },
  fitText: { ...Typography.bodySmall, color: Brand.taupe, flex: 1 },
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two,
    backgroundColor: Brand.ivory, borderTopWidth: 1, borderTopColor: Brand.beige,
    maxWidth: 720, alignSelf: 'center', width: '100%',
  },
});
