import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlowHeader } from '@/components/design/flow-header';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useTheme } from '@/hooks/use-theme';
import { CostEstimate, estimateCost } from '@/services/design-api';
import { formatPrice } from '@/utils/format';
import { useDesignStore } from '@/stores/design-store';

const budgetLimitPaisa = {
  essential: 2_500_000,
  comfort: 10_000_000,
  luxury: 50_000_000,
  ultra: 50_000_000,
} as const;

const EMPTY_FURNITURE: readonly never[] = [];

export default function CostScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { contentStyle } = useResponsiveLayout();
  const { resultId } = useLocalSearchParams<{ resultId?: string }>();
  const design = useDesignStore(state => state.designs.find(item => item.id === resultId));
  const items = design?.suggestedFurniture ?? EMPTY_FURNITURE;
  const requestKey = design ? `${design.id}:${items.map(item => item.id).join(',')}` : '';
  const [estimateResult, setEstimateResult] = useState<{
    requestKey: string;
    estimate?: CostEstimate;
    error?: string;
  } | null>(null);
  const currentEstimateResult = estimateResult?.requestKey === requestKey ? estimateResult : null;
  const estimate = currentEstimateResult?.estimate ?? null;
  const estimateError = currentEstimateResult?.error ?? null;
  const isEstimating = Boolean(items.length > 0 && !currentEstimateResult);

  useEffect(() => {
    if (!design || items.length === 0) return;

    const controller = new AbortController();
    void estimateCost(items.map(item => ({ itemId: item.id, qty: 1 })), controller.signal)
      .then(value => setEstimateResult({ requestKey, estimate: value }))
      .catch(error => {
        if (!controller.signal.aborted) {
          setEstimateResult({
            requestKey,
            error: error instanceof Error
              ? error.message
              : 'The estimate could not be calculated.',
          });
        }
      });
    return () => controller.abort();
  }, [design, items, requestKey]);

  if (!design) {
    return (
      <View style={[styles.root, styles.emptyResult, { paddingTop: insets.top }]}>
        <Text style={styles.emptyTitle}>Design unavailable</Text>
        <Text style={styles.demoNotice}>This design may have been deleted from this device.</Text>
        <Button label="Go to My Designs" onPress={() => router.replace('/(tabs)/designs')} />
      </View>
    );
  }
  const withinBudget = estimate !== null && estimate.totalPaisa <= budgetLimitPaisa[design.budgetTier];
  const estimateLines = new Map((estimate?.items ?? []).map(item => [item.itemId, item]));
  const total = (estimate?.totalPaisa ?? 0) / 100;
  const budgetLabel = `Up to ${formatPrice(budgetLimitPaisa[design.budgetTier] / 100, 'PKR')}`;

  // Group by category
  const categories = [...new Set(items.map(i => i.category))];

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.three, backgroundColor: theme.ivory }]}>
      <FlowHeader title="Cost Breakdown" subtitle="Estimated total for your redesign" step={5} totalSteps={5} />
      <Text style={[styles.demoNotice, contentStyle, { color: theme.taupe }]}>This estimate uses current catalogue prices from the backend; it is a furniture subtotal only.</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[contentStyle, { paddingBottom: insets.bottom + 120 }]}>
        {estimateError ? (
          <Text style={[styles.demoNotice, styles.errorText]}>{estimateError}</Text>
        ) : null}
        {items.length === 0 ? (
          <Text style={[styles.demoNotice, { color: theme.taupe }]}>No catalogue recommendations are available to estimate.</Text>
        ) : null}

        {/* ── Budget status ─────────────────────────────────────────── */}
        {estimate ? <View style={[
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
              {design.budgetTier} tier · {budgetLabel}
            </Text>
          </View>
        </View> : null}

        {/* ── Grand total ───────────────────────────────────────────── */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Estimated Total</Text>
          {isEstimating ? (
            <ActivityIndicator color={Brand.gold} />
          ) : (
            <Text style={styles.totalValue}>
              {estimate ? formatPrice(total, estimate.currency) : 'Unavailable'}
            </Text>
          )}
          <Text style={styles.totalSub}>{items.length} catalogue items · excludes tax and delivery</Text>
        </View>

        {/* ── Category breakdown ────────────────────────────────────── */}
        {categories.map(category => {
          const catItems = items.filter(i => i.category === category);
          const catTotalPaisa = catItems.reduce((sum, item) => sum + (estimateLines.get(item.id)?.lineTotalPaisa ?? 0), 0);
          const catTotal = catTotalPaisa / 100;
          const pct = total > 0 ? catTotal / total : 0;
          return (
            <View key={category} style={styles.section}>
              <View style={styles.catHeader}>
                <Text style={[styles.catLabel, { color: theme.walnut }]}>{category}</Text>
                  <Text style={[styles.catTotal, { color: theme.espresso }]}>{formatPrice(catTotal, estimate?.currency ?? 'PKR')}</Text>
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
                    <Text style={styles.itemPrice}>
                      {estimateLines.has(item.id)
                        ? formatPrice((estimateLines.get(item.id)?.unitPricePaisa ?? 0) / 100, estimate?.currency ?? 'PKR')
                        : 'Unavailable'}
                    </Text>
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
            Catalogue prices are server-sourced estimates, not retailer quotes. Taxes and delivery are not included.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.cta, contentStyle, { paddingBottom: insets.bottom + Spacing.three, backgroundColor: theme.ivory, borderTopColor: theme.border }]}>
        <Button label="Browse Recommended Items" onPress={() => router.push({ pathname: '/design/furniture', params: { resultId: design.id } })} fullWidth size="lg" />
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
  errorText: { color: '#A33B2E' },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    width: '92%', maxWidth: 820, alignSelf: 'center', marginTop: Spacing.three,
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
    width: '92%', maxWidth: 820, alignSelf: 'center', marginTop: Spacing.three,
    backgroundColor: Brand.espresso, borderRadius: Radius.xl,
    padding: Spacing.four, alignItems: 'center', gap: Spacing.one, ...Shadow.medium,
  },
  totalLabel: { ...Typography.overline, color: Brand.gold, letterSpacing: 3 },
  totalValue: { fontSize: 40, fontWeight: '300', color: Brand.ivory, fontFamily: Fonts?.serif ?? 'serif' },
  totalSub: { ...Typography.bodySmall, color: Brand.taupe, textAlign: 'center' },
  section: { width: '100%', maxWidth: 820, alignSelf: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.two },
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
    width: '92%', maxWidth: 820, alignSelf: 'center', marginTop: Spacing.three,
    padding: Spacing.three, backgroundColor: Brand.cream, borderRadius: Radius.md,
  },
  disclaimerText: { ...Typography.bodySmall, color: Brand.taupe, flex: 1 },
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two,
    backgroundColor: Brand.ivory, borderTopWidth: 1, borderTopColor: Brand.beige,
    maxWidth: 720, alignSelf: 'center', width: '100%',
  },
});
