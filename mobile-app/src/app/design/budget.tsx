import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlowHeader } from '@/components/design/flow-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { MOCK_BUDGETS } from '@/services/mock-data';
import { useDesignStore } from '@/stores/design-store';
import { BudgetTier } from '@/types/design';

const TIER_ICONS: Record<BudgetTier, { ios: string; android: string; web: string }> = {
  essential: { ios: 'leaf', android: 'eco', web: 'eco' },
  comfort:   { ios: 'star', android: 'star', web: 'star' },
  luxury:    { ios: 'crown', android: 'workspace_premium', web: 'workspace_premium' },
  ultra:     { ios: 'diamond', android: 'diamond', web: 'diamond' },
};

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { contentStyle } = useResponsiveLayout();
  const selectedTier = useDesignStore(state => state.budgetTier);
  const setBudgetTier = useDesignStore(state => state.setBudgetTier);

  function handleContinue() {
    if (!selectedTier) return;
    router.push('/design/loading');
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.three, backgroundColor: theme.ivory }]}>
      <FlowHeader title="Set Your Budget" subtitle="We'll tailor furniture recommendations to your range." step={3} totalSteps={5} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[contentStyle, { paddingBottom: insets.bottom + 120, paddingTop: Spacing.four }]}>
        <View style={styles.list}>
          {MOCK_BUDGETS.map(budget => {
            const isSelected = selectedTier === budget.id;
            const icon = TIER_ICONS[budget.id];
            return (
              <Pressable
                key={budget.id}
                style={[
                  styles.card,
                  { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                  isSelected && { borderColor: theme.gold, backgroundColor: theme.cream },
                ]}
                onPress={() => setBudgetTier(budget.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                  <Icon
                    ios={icon.ios}
                    android={icon.android}
                    web={icon.web}
                    size={22}
                    color={isSelected ? theme.textOnAccent : theme.gold}
                  />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.cardLabel, { color: theme.espresso }, isSelected && styles.cardLabelSelected]}>{budget.label}</Text>
                      <Text style={[styles.cardRange, { color: theme.taupe }, isSelected && styles.cardRangeSelected]}>{budget.rangeLabel}</Text>
                  </View>
                    <Text style={[styles.cardDesc, { color: theme.taupe }]}>{budget.description}</Text>
                </View>
                {isSelected && (
                  <SymbolView name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} size={22} tintColor={Brand.gold} />
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.note}>
          <SymbolView name={{ ios: 'info.circle', android: 'info', web: 'info' }} size={14} tintColor={Brand.taupe} weight="light" />
          <Text style={[styles.noteText, { color: theme.taupe }]}>Your budget range is sent with the design request and used to select catalogue recommendations.</Text>
        </View>
      </ScrollView>

      <View style={[styles.cta, contentStyle, { paddingBottom: insets.bottom + Spacing.three, backgroundColor: theme.ivory, borderTopColor: theme.border }]}>
        <Button label={selectedTier ? 'Generate Design' : 'Select a Budget to Continue'} onPress={handleContinue} disabled={!selectedTier} fullWidth size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ivory },
  list: { paddingHorizontal: Spacing.four, gap: Spacing.two, maxWidth: 820, width: '100%', alignSelf: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Brand.white,
    borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.three,
    borderWidth: 1.5, borderColor: Brand.beige, ...Shadow.soft,
  },
  cardSelected: { borderColor: Brand.gold, backgroundColor: Brand.cream },
  iconWrap: { width: 48, height: 48, borderRadius: Radius.full, backgroundColor: Brand.beige, alignItems: 'center', justifyContent: 'center' },
  iconWrapSelected: { backgroundColor: Brand.gold },
  cardBody: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 16, fontWeight: '600', color: Brand.espresso, fontFamily: Fonts?.serif ?? 'serif' },
  cardLabelSelected: { color: Brand.walnut },
  cardRange: { ...Typography.labelMedium, color: Brand.taupe },
  cardRangeSelected: { color: Brand.gold, fontWeight: '600' },
  cardDesc: { ...Typography.bodySmall, color: Brand.taupe },
  note: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two,
    marginHorizontal: Spacing.four, marginTop: Spacing.three,
    padding: Spacing.three, backgroundColor: Brand.cream, borderRadius: Radius.md,
  },
  noteText: { ...Typography.bodySmall, color: Brand.taupe, flex: 1 },
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three,
    backgroundColor: Brand.ivory, borderTopWidth: 1, borderTopColor: Brand.beige,
    maxWidth: 720, alignSelf: 'center', width: '100%',
  },
});
