import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlowHeader } from '@/components/design/flow-header';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { MOCK_DESIGNS, MOCK_FURNITURE } from '@/services/mock-data';
import { FurnitureItem } from '@/types/design';
import { formatPrice } from '@/utils/format';

export default function FurnitureScreen() {
  const insets = useSafeAreaInsets();
  const { resultId } = useLocalSearchParams<{ resultId?: string }>();
  const design = MOCK_DESIGNS.find(d => d.id === resultId) ?? MOCK_DESIGNS[0];
  // Merge design furniture with full catalogue for a richer list
  const items: FurnitureItem[] = design.suggestedFurniture.length > 0
    ? design.suggestedFurniture
    : MOCK_FURNITURE;

  const total = items.reduce((sum, i) => sum + i.priceUsd, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.three }]}>
      <FlowHeader title="Furniture Picks" subtitle={`${items.length} pieces curated for your design`} step={4} totalSteps={5} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {/* Category groups */}
        {['Seating', 'Tables', 'Lighting', 'Textiles'].map(category => {
          const catItems = items.filter(i => i.category === category);
          if (catItems.length === 0) return null;
          return (
            <View key={category} style={styles.section}>
              <Text style={styles.categoryLabel}>{category}</Text>
              {catItems.map(item => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.itemCard, pressed && styles.itemCardPressed]}
                  onPress={() => router.push({ pathname: '/design/furniture-detail', params: { furnitureId: item.id, resultId: design.id } })}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.itemImage} contentFit="cover" />
                  <View style={styles.itemBody}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemBrand}>{item.brand}</Text>
                    <Text style={styles.itemMaterial} numberOfLines={1}>{item.material}</Text>
                    <Text style={styles.itemPrice}>{formatPrice(item.priceUsd)}</Text>
                  </View>
                  <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={14} tintColor={Brand.taupe} weight="light" />
                </Pressable>
              ))}
            </View>
          );
        })}

        {/* Uncategorised items */}
        {(() => {
          const known = ['Seating', 'Tables', 'Lighting', 'Textiles'];
          const rest = items.filter(i => !known.includes(i.category));
          if (rest.length === 0) return null;
          return (
            <View style={styles.section}>
              <Text style={styles.categoryLabel}>Other</Text>
              {rest.map(item => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.itemCard, pressed && styles.itemCardPressed]}
                  onPress={() => router.push({ pathname: '/design/furniture-detail', params: { furnitureId: item.id, resultId: design.id } })}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.itemImage} contentFit="cover" />
                  <View style={styles.itemBody}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemBrand}>{item.brand}</Text>
                    <Text style={styles.itemPrice}>{formatPrice(item.priceUsd)}</Text>
                  </View>
                  <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={14} tintColor={Brand.taupe} weight="light" />
                </Pressable>
              ))}
            </View>
          );
        })()}
      </ScrollView>

      {/* Total + CTA */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.three }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Estimated Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
        <Button label="View Full Cost Breakdown" onPress={() => router.push({ pathname: '/design/cost', params: { resultId: design.id } })} fullWidth size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ivory },
  section: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.two },
  categoryLabel: { ...Typography.labelLarge, color: Brand.walnut, textTransform: 'uppercase', letterSpacing: 1 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Brand.white,
    borderRadius: Radius.lg, overflow: 'hidden', gap: Spacing.three, ...Shadow.soft,
  },
  itemCardPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  itemImage: { width: 88, height: 88 },
  itemBody: { flex: 1, paddingVertical: Spacing.two, gap: 3 },
  itemName: { ...Typography.labelLarge, color: Brand.espresso, fontWeight: '600' },
  itemBrand: { ...Typography.bodySmall, color: Brand.taupe },
  itemMaterial: { ...Typography.bodySmall, color: Brand.taupe, opacity: 0.8 },
  itemPrice: { ...Typography.labelLarge, color: Brand.gold, fontWeight: '600', marginTop: 2 },
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two,
    backgroundColor: Brand.ivory, borderTopWidth: 1, borderTopColor: Brand.beige,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...Typography.labelLarge, color: Brand.taupe, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontSize: 22, fontWeight: '600', color: Brand.espresso, fontFamily: Fonts?.serif ?? 'serif' },
});
