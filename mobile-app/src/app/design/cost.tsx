import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlowHeader } from '@/components/design/flow-header';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MOCK_BUDGETS, MOCK_FURNITURE } from '@/services/mock-data';
import { FurnitureItem } from '@/types/design';
import { formatPrice } from '@/utils/format';
import { useDesignStore } from '@/stores/design-store';

export default function CostScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
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
  const items: FurnitureItem[] = design.suggestedFurniture.length > 0 ? design.suggestedFurniture : MOCK_FURNITURE;

  const budget = MOCK_BUDGETS.find(b => b.id === design.budgetTier) ?? MOCK_BUDGETS[1];
  const total = items.reduce((sum, i) => sum + i.priceUsd, 0);
  const withinBudget = total <= budget.maxUsd;

  // Group by category
  const categories = [...new Set(items.map(i => i.category))];

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.three, backgroundColor: theme.ivory }]}>
      <FlowHeader title="Cost Breakdown" subtitle="Estimated total for your redesign" step={5} totalSteps={5} />
      <Text style={[styles.demoNotice, { color: theme.taupe }]}>Demo estimate using sample furniture prices. Not a live quote.</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>

        {/* ── Budget status ─────────────────────────────────────────── */}
        <View style={[
          styles.statusCard,
          withinBudget ? styles.statusGood : styles.statusOver,
          theme.background === '#000000' && styles.statusCardDark,
        ]}>
          <SymbolView
            name={withinBudget
              ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
              : { ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' }}
            size={22}
            tintColor={withinBudget ? '#155724' : '#721C24'}
          />
          <View style={styles.statusText}>
            <Text style={[
              styles.statusTitle,
              { color: theme.background === '#000000'
                ? (withinBudget ? '#BDE4C7' : '#F4B8B8')
                : (withinBudget ? '#155724' : '#721C24') },
            ]}>
              {withinBudget ? 'Within your budget' : 'Slightly over budget'}
            </Text>
            <Text style={[styles.statusSub, { color: theme.taupe }]}>
              {budget.label} tier · {budget.rangeLabel}
            </Text>
          </View>
        </View>

        {/* ── Grand total ───────────────────────────────────────────── */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Estimated Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          <Text style={styles.totalSub}>{items.length} furniture pieces · excludes delivery & installation</Text>
        </View>

        {/* ── Category breakdown ────────────────────────────────────── */}
        {categories.map(category => {
          const catItems = items.filter(i => i.category === category);
          const catTotal = catItems.reduce((s, i) => s + i.priceUsd, 0);
          const pct = total > 0 ? catTotal / total : 0;
          return (
            <View key={category} style={styles.section}>
              <View style={styles.catHeader}>
                <Text style={[styles.catLabel, { color: theme.walnut }]}>{category}</Text>
                  <Text style={[styles.catTotal, { color: theme.espresso }]}>{formatPrice(catTotal)}</Text>
              </View>
              {/* Progress bar */}
              <View style={styles.catTrack}>
                <View style={[styles.catFill, { width: `${pct * 100}%` }]} />
              </View>
              {/* Items */}
              <View style={[styles.itemList, { backgroundColor: theme.surfaceElevated }]}>
                {catItems.map(item => (
                  <View key={item.id} style={[styles.itemRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.itemName, { color: theme.espresso }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.itemBrand, { color: theme.taupe }]}>{item.brand}</Text>
                    <Text style={styles.itemPrice}>{formatPrice(item.priceUsd)}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {/* ── Disclaimer ────────────────────────────────────────────── */}
        <View style={[styles.disclaimer, { backgroundColor: theme.cream }]}>
          <SymbolView name={{ ios: 'info.circle', android: 'info', web: 'info' }} size={13} tintColor={theme.taupe} weight="light" />
          <Text style={[styles.disclaimerText, { color: theme.taupe }]}>
            Illustrative demo prices only, not live retailer listings. Delivery, installation and taxes are not included; real pricing requires integration.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.three, backgroundColor: theme.ivory, borderTopColor: theme.border }]}>
        <Button label="Browse Sample Items" onPress={() => router.push({ pathname: '/design/furniture', params: { resultId: design.id } })} fullWidth size="lg" />
        <Button label="Back to Result" variant="secondary" onPress={() => router.back()} fullWidth size="md" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ivory },
  emptyResult: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.four, gap: Spacing.three },
  emptyTitle: { ...Typography.headingSmall, color: Brand.espresso },
  demoNotice: { ...Typography.bodySmall, color: Brand.taupe, textAlign: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    marginHorizontal: Spacing.four, marginTop: Spacing.three,
    padding: Spacing.three, borderRadius: Radius.lg,
    backgroundColor: '#D4EDDA',
  },
  statusGood: { backgroundColor: '#D4EDDA' },
  statusOver: { backgroundColor: '#F8D7DA' },
  statusCardDark: { backgroundColor: '#29221B' },
  statusText: { flex: 1, gap: 2 },
  statusTitle: { ...Typography.labelLarge, color: '#155724', fontWeight: '600' },
  statusTitleOver: { color: '#721C24' },
  statusSub: { ...Typography.bodySmall, color: Brand.taupe },
  totalCard: {
    marginHorizontal: Spacing.four, marginTop: Spacing.three,
    backgroundColor: Brand.espresso, borderRadius: Radius.xl,
    padding: Spacing.four, alignItems: 'center', gap: Spacing.one, ...Shadow.medium,
  },
  totalLabel: { ...Typography.overline, color: Brand.gold, letterSpacing: 3 },
  totalValue: { fontSize: 40, fontWeight: '300', color: Brand.ivory, fontFamily: Fonts?.serif ?? 'serif' },
  totalSub: { ...Typography.bodySmall, color: Brand.taupe, textAlign: 'center' },
  section: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.two },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catLabel: { ...Typography.labelLarge, color: Brand.walnut, textTransform: 'uppercase', letterSpacing: 1 },
  catTotal: { ...Typography.labelLarge, color: Brand.espresso, fontWeight: '600' },
  catTrack: { height: 4, backgroundColor: Brand.beige, borderRadius: Radius.full, overflow: 'hidden' },
  catFill: { height: 4, backgroundColor: Brand.gold, borderRadius: Radius.full },
  itemList: { backgroundColor: Brand.white, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.soft },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three, borderBottomWidth: 1, borderBottomColor: Brand.beige,
    gap: Spacing.two,
  },
  itemName: { flex: 1, ...Typography.bodyMedium, color: Brand.espresso },
  itemBrand: { ...Typography.bodySmall, color: Brand.taupe },
  itemPrice: { ...Typography.labelLarge, color: Brand.gold, fontWeight: '600' },
  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two,
    marginHorizontal: Spacing.four, marginTop: Spacing.three,
    padding: Spacing.three, backgroundColor: Brand.cream, borderRadius: Radius.md,
  },
  disclaimerText: { ...Typography.bodySmall, color: Brand.taupe, flex: 1 },
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two,
    backgroundColor: Brand.ivory, borderTopWidth: 1, borderTopColor: Brand.beige,
  },
});
