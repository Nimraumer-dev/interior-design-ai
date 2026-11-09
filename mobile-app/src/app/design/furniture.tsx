import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlowHeader } from '@/components/design/flow-header';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useTheme } from '@/hooks/use-theme';
import { FurnitureItem } from '@/types/design';
import { formatPrice, furniturePriceAmount, furniturePriceLabel } from '@/utils/format';
import { useDesignStore } from '@/stores/design-store';

export default function FurnitureScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { contentStyle, isDesktop } = useResponsiveLayout();
  const { resultId } = useLocalSearchParams<{ resultId?: string }>();
  const design = useDesignStore(state => state.designs.find(item => item.id === resultId));
  if (!design) {
    return (
      <View style={[styles.root, styles.emptyResult, { paddingTop: insets.top }]}>
        <Text style={styles.emptyTitle}>Design unavailable</Text>
        <Text style={styles.demoNotice}>This design may have been deleted from this device.</Text>
        <Button label="Go to My Designs" onPress={() => router.replace('/(tabs)/designs')} />
      </View>
    );
  }
  const items: FurnitureItem[] = design.suggestedFurniture;

  const currency = items[0]?.currency ?? 'PKR';
  const total = items.reduce((sum, item) => sum + furniturePriceAmount(item), 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.three, backgroundColor: theme.ivory }]}>
      <FlowHeader title="Furniture Picks" subtitle={`${items.length} pieces curated for your design`} step={4} totalSteps={5} />
      <Text style={[styles.demoNotice, contentStyle, { color: theme.taupe }]}>Recommendations and prices come from your backend catalogue; retailer availability may vary.</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[contentStyle, { paddingBottom: insets.bottom + 120 }]}>
        {items.length === 0 ? (
          <Text style={[styles.demoNotice, { color: theme.taupe }]}>No catalogue recommendations were returned for this design.</Text>
        ) : null}
        {/* Category groups */}
        {['Seating', 'Tables', 'Lighting', 'Textiles'].map(category => {
          const catItems = items.filter(i => i.category === category);
          if (catItems.length === 0) return null;
          return (
            <View key={category} style={styles.section}>
              <Text style={[styles.categoryLabel, { color: theme.walnut }]}>{category}</Text>
              <View style={isDesktop && styles.itemsGrid}>
              {catItems.map(item => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.itemCard,
                    isDesktop && styles.itemCardDesktop,
                    { backgroundColor: theme.surfaceElevated },
                    pressed && styles.itemCardPressed,
                  ]}
                  onPress={() => router.push({ pathname: '/design/furniture-detail', params: { furnitureId: item.id, resultId: design.id } })}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.itemImage} contentFit="cover" />
                  <View style={styles.itemBody}>
                    <Text style={[styles.itemName, { color: theme.espresso }]}>{item.name}</Text>
                    <Text style={[styles.itemBrand, { color: theme.taupe }]}>{item.brand}</Text>
                    <Text style={[styles.itemMaterial, { color: theme.taupe }]} numberOfLines={1}>{item.material}</Text>
                    <Text style={styles.itemPrice}>{furniturePriceLabel(item)}</Text>
                  </View>
                  <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={14} tintColor={theme.taupe} weight="light" />
                </Pressable>
              ))}
              </View>
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
              <View style={isDesktop && styles.itemsGrid}>
              {rest.map(item => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.itemCard,
                    isDesktop && styles.itemCardDesktop,
                    { backgroundColor: theme.surfaceElevated },
                    pressed && styles.itemCardPressed,
                  ]}
                  onPress={() => router.push({ pathname: '/design/furniture-detail', params: { furnitureId: item.id, resultId: design.id } })}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.itemImage} contentFit="cover" />
                  <View style={styles.itemBody}>
                    <Text style={[styles.itemName, { color: theme.espresso }]}>{item.name}</Text>
                    <Text style={[styles.itemBrand, { color: theme.taupe }]}>{item.brand}</Text>
                    <Text style={styles.itemPrice}>{furniturePriceLabel(item)}</Text>
                  </View>
                  <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={14} tintColor={theme.taupe} weight="light" />
                </Pressable>
              ))}
              </View>
            </View>
          );
        })()}
      </ScrollView>

      {/* Total + CTA */}
      <View style={[styles.cta, contentStyle, { paddingBottom: insets.bottom + Spacing.three, backgroundColor: theme.ivory, borderTopColor: theme.border }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.taupe }]}>Estimated Total</Text>
          <Text style={[styles.totalValue, { color: theme.espresso }]}>{formatPrice(total, currency)}</Text>
        </View>
        <Button label="View Full Cost Breakdown" onPress={() => router.push({ pathname: '/design/cost', params: { resultId: design.id } })} fullWidth size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ivory },
  emptyResult: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.four, gap: Spacing.three },
  emptyTitle: { ...Typography.headingSmall, color: Brand.espresso },
  demoNotice: { ...Typography.bodySmall, color: Brand.taupe, textAlign: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  section: { width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.two },
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  categoryLabel: { ...Typography.labelLarge, color: Brand.walnut, textTransform: 'uppercase', letterSpacing: 1 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Brand.white,
    borderRadius: Radius.lg, overflow: 'hidden', gap: Spacing.three, ...Shadow.soft,
  },
  itemCardPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  itemCardDesktop: { width: '49%', minWidth: 0 },
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
    maxWidth: 720, alignSelf: 'center', width: '100%',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...Typography.labelLarge, color: Brand.taupe, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontSize: 22, fontWeight: '600', color: Brand.espresso, fontFamily: Fonts?.serif ?? 'serif' },
});
