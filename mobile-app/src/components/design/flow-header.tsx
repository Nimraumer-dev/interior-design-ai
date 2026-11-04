import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Fonts, Radius, Spacing, Typography } from '@/constants/theme';

interface FlowHeaderProps {
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
  onBack?: () => void;
}

export function FlowHeader({ title, subtitle, step, totalSteps, onBack }: FlowHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable
          style={styles.backBtn}
          onPress={onBack ?? (() => router.back())}
          accessibilityLabel="Go back"
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            size={20}
            tintColor={Brand.espresso}
            weight="light"
          />
        </Pressable>

        {step !== undefined && totalSteps !== undefined && (
          <View style={styles.stepRow}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[styles.stepDot, i < step ? styles.stepDotDone : i === step - 1 ? styles.stepDotActive : styles.stepDotInactive]}
              />
            ))}
          </View>
        )}

        {/* Spacer to balance back button */}
        <View style={styles.backBtn} />
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Brand.beige,
    gap: Spacing.three,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Brand.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    alignItems: 'center',
  },
  stepDot: {
    height: 4,
    borderRadius: Radius.full,
  },
  stepDotActive: {
    width: 20,
    backgroundColor: Brand.gold,
  },
  stepDotDone: {
    width: 8,
    backgroundColor: Brand.gold,
    opacity: 0.5,
  },
  stepDotInactive: {
    width: 8,
    backgroundColor: Brand.beige,
  },
  titleBlock: { gap: 4 },
  title: {
    fontSize: 26,
    fontWeight: '300',
    color: Brand.espresso,
    fontFamily: Fonts?.serif ?? 'serif',
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Brand.taupe,
  },
});
