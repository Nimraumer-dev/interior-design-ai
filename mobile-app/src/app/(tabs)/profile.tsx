import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { MOCK_DESIGNS, MOCK_USER } from '@/services/mock-data';

type SymbolName = { ios: string; android: string; web: string };

interface SettingsRowProps {
  icon: SymbolName;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingsRow({ icon, label, value, onPress, destructive = false }: SettingsRowProps) {
  const iconColor = destructive ? '#C0392B' : Brand.taupe;
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsRow, pressed && styles.settingsRowPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.settingsLeft}>
        <View style={styles.iconWrap}>
          <Icon ios={icon.ios} android={icon.android} web={icon.web} size={18} color={iconColor} />
        </View>
        <Text style={[styles.settingsLabel, destructive && styles.destructiveLabel]}>{label}</Text>
      </View>
      <View style={styles.settingsRight}>
        {value && <Text style={styles.settingsValue}>{value}</Text>}
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={14}
          tintColor={Brand.taupe}
          weight="light"
        />
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const totalDesigns = MOCK_DESIGNS.length;
  const favoriteDesigns = MOCK_DESIGNS.filter(d => d.isFavorite).length;
  const quotaPct = Math.round((MOCK_USER.generationsUsed / MOCK_USER.generationsLimit) * 100);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={[styles.headerBg, { paddingTop: insets.top + Spacing.three }]}>
        <Text style={styles.wordmark}>ATELIER</Text>
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: MOCK_USER.avatarUrl }} style={styles.avatar} contentFit="cover" />
          <View style={styles.avatarBorder} />
        </View>
        <Text style={styles.displayName}>{MOCK_USER.displayName}</Text>
        <Text style={styles.email}>{MOCK_USER.email}</Text>
        <View style={styles.planRow}>
          <Badge label={`${MOCK_USER.plan} plan`} variant="accent" />
        </View>
      </View>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalDesigns}</Text>
          <Text style={styles.statLabel}>Designs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{favoriteDesigns}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{MOCK_USER.generationsUsed}</Text>
          <Text style={styles.statLabel}>Generated</Text>
        </View>
      </View>

      {/* ── Generation quota ────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.quotaCard}>
          <View style={styles.quotaHeader}>
            <Text style={styles.quotaTitle}>Monthly Generations</Text>
            <Text style={styles.quotaFraction}>
              {MOCK_USER.generationsUsed}/{MOCK_USER.generationsLimit}
            </Text>
          </View>
          <View style={styles.quotaTrack}>
            <View style={[styles.quotaFill, { width: `${quotaPct}%` }]} />
          </View>
          <Text style={styles.quotaHint}>
            {MOCK_USER.generationsLimit - MOCK_USER.generationsUsed} generations remaining
          </Text>
        </View>
      </View>

      {/* ── Account ─────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingsCard}>
          <SettingsRow
            icon={{ ios: 'person', android: 'person', web: 'person' }}
            label="Edit Profile"
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
            label="Notifications"
            value="On"
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon={{ ios: 'paintpalette', android: 'palette', web: 'palette' }}
            label="Preferred Style"
            value="Warm Minimalist"
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon={{ ios: 'moon', android: 'dark_mode', web: 'dark_mode' }}
            label="Appearance"
            value="System"
          />
        </View>
      </View>

      {/* ── Subscription ────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.settingsCard}>
          <SettingsRow
            icon={{ ios: 'star', android: 'star', web: 'star' }}
            label="Upgrade to Studio"
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon={{ ios: 'doc.text', android: 'description', web: 'description' }}
            label="Billing & Invoices"
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon={{ ios: 'creditcard', android: 'credit_card', web: 'credit_card' }}
            label="Manage Plan"
            value="Pro"
          />
        </View>
      </View>

      {/* ── Support ─────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.settingsCard}>
          <SettingsRow
            icon={{ ios: 'message', android: 'chat', web: 'chat' }}
            label="Help & Support"
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon={{ ios: 'lock.shield', android: 'privacy_tip', web: 'privacy_tip' }}
            label="Privacy Policy"
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon={{ ios: 'doc', android: 'article', web: 'article' }}
            label="Terms of Service"
          />
        </View>
      </View>

      {/* ── Sign out ────────────────────────────────────────────────── */}
      <View style={[styles.section, { marginBottom: Spacing.four }]}>
        <View style={styles.settingsCard}>
          <SettingsRow
            icon={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
            label="Sign Out"
            destructive
            onPress={() => {
              logout();
              router.replace('/(auth)/login');
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ivory },
  headerBg: {
    backgroundColor: Brand.espresso,
    alignItems: 'center',
    paddingBottom: Spacing.five,
    gap: Spacing.one,
  },
  wordmark: {
    fontSize: 14,
    fontWeight: '300',
    color: Brand.beige,
    letterSpacing: 6,
    fontFamily: Fonts?.serif ?? 'serif',
    marginBottom: Spacing.three,
    opacity: 0.6,
  },
  avatarWrapper: { width: 88, height: 88, marginBottom: Spacing.two },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: Brand.gold,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '300',
    color: Brand.ivory,
    fontFamily: Fonts?.serif ?? 'serif',
    letterSpacing: 0.5,
  },
  email: { ...Typography.bodySmall, color: Brand.taupe, marginTop: 2 },
  planRow: { marginTop: Spacing.two },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Brand.white,
    marginHorizontal: Spacing.four,
    marginTop: -Spacing.three,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three,
    ...Shadow.medium,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: {
    fontSize: 22,
    fontWeight: '600',
    color: Brand.espresso,
    fontFamily: Fonts?.serif ?? 'serif',
  },
  statLabel: {
    ...Typography.labelSmall,
    color: Brand.taupe,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: { width: 1, backgroundColor: Brand.beige, marginVertical: Spacing.one },
  section: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.two },
  sectionTitle: {
    ...Typography.labelLarge,
    color: Brand.taupe,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quotaCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadow.soft,
  },
  quotaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quotaTitle: { ...Typography.labelLarge, color: Brand.espresso },
  quotaFraction: { ...Typography.headingSmall, color: Brand.espresso },
  quotaTrack: {
    height: 6,
    backgroundColor: Brand.beige,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  quotaFill: { height: 6, backgroundColor: Brand.gold, borderRadius: Radius.full },
  quotaHint: { ...Typography.bodySmall, color: Brand.taupe },
  settingsCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.soft,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  settingsRowPressed: { backgroundColor: Brand.cream },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  iconWrap: { width: 20, alignItems: 'center' },
  settingsLabel: { ...Typography.bodyMedium, color: Brand.espresso },
  destructiveLabel: { color: '#C0392B' },
  settingsRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  settingsValue: { ...Typography.bodySmall, color: Brand.taupe },
  rowDivider: {
    height: 1,
    backgroundColor: Brand.beige,
    marginLeft: Spacing.three + 20 + Spacing.two,
  },
});
