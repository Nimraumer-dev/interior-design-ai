import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { MOCK_FURNITURE } from '@/services/mock-data';
import { formatPrice } from '@/utils/format';

function DimRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dimRow}>
      <Text style={styles.dimLabel}>{label}</Text>
      <Text style={styles.dimValue}>{value}</Text>
    </View>
  );
}

export default function FurnitureDetailScreen() {
  const insets = useSafeAreaInsets();
  const { furnitureId, resultId } = useLocalSearchParams<{ furnitureId?: string; resultId?: string }>();
  const item = MOCK_FURNITURE.find(f => f.id === furnitureId) ?? MOCK_FURNITURE[0];
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()} accessibilityLabel="Go back">
          <SymbolView name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }} size={18} tintColor={Brand.espresso} weight="light" />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>{item.name}</Text>
        <Pressable style={styles.iconBtn} onPress={() => setWishlisted(v => !v)} accessibilityLabel="Wishlist">
          <SymbolView
            name={wishlisted ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' } : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
            size={18}
            tintColor={wishlisted ? Brand.gold : Brand.taupe}
          />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {/* Hero image */}
        <Image source={{ uri: item.imageUrl }} style={styles.heroImage} contentFit="cover" />

        <View style={styles.body}>
          {/* Header */}
          <View style={styles.itemHeader}>
            <View style={styles.itemHeaderLeft}>
              <Badge label={item.category} variant="default" />
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemBrand}>{item.brand}</Text>
            </View>
            <Text style={styles.itemPrice}>{formatPrice(item.priceUsd)}</Text>
          </View>

          {/* Material */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Material</Text>
            <View style={styles.materialRow}>
              <SymbolView name={{ ios: 'leaf', android: 'eco', web: 'eco' }} size={16} tintColor={Brand.gold} weight="light" />
              <Text style={styles.materialText}>{item.material}</Text>
            </View>
          </View>

          {/* Dimensions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dimensions</Text>
            <View style={styles.dimsCard}>
              <DimRow label="Width" value={`${item.dimensions.widthCm} cm`} />
              <View style={styles.dimDivider} />
              <DimRow label="Height" value={`${item.dimensions.heightCm} cm`} />
              <View style={styles.dimDivider} />
              <DimRow label="Depth" value={`${item.dimensions.depthCm} cm`} />
            </View>
          </View>

          {/* Why it fits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why It Fits Your Design</Text>
            <View style={styles.fitCard}>
              <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={16} tintColor={Brand.gold} weight="light" />
              <Text style={styles.fitText}>
                This piece was selected by our AI because its proportions, material and colour palette complement your chosen style and room dimensions.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.three }]}>
        <Button label="View on Retailer Website" onPress={() => {}} fullWidth size="lg" />
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
  },
});
