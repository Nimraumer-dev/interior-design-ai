import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useLocalUiState } from '@/hooks/use-local-ui-state';
import { useTheme } from '@/hooks/use-theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { apiRequest } from '@/services/api';
import { MOCK_STYLES } from '@/services/mock-data';
import { useDesignStore } from '@/stores/design-store';

type SymbolName = { ios: string; android: string; web: string };

interface SettingsRowProps {
  icon: SymbolName;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingsRow({ icon, label, value, onPress, destructive = false }: SettingsRowProps) {
  const theme = useTheme();
  const isDark = theme.background === '#000000';
  const iconColor = destructive ? '#C0392B' : isDark ? theme.accentMuted : theme.taupe;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsRow,
        isDark && styles.settingsRowDark,
        pressed && (isDark ? styles.darkPressed : styles.settingsRowPressed),
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.settingsLeft}>
        <View style={[styles.iconWrap, isDark && styles.iconWrapDark]}>
          <Icon ios={icon.ios} android={icon.android} web={icon.web} size={18} color={iconColor} />
        </View>
        <Text style={[
          styles.settingsLabel,
          isDark && styles.lightText,
          destructive && styles.destructiveLabel,
        ]}>{label}</Text>
      </View>
      <View style={styles.settingsRight}>
        {value && <Text style={[styles.settingsValue, isDark && styles.darkMutedText]}>{value}</Text>}
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={14}
          tintColor={theme.taupe}
          weight="light"
        />
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { contentStyle, isDesktop } = useResponsiveLayout();
  const isDark = theme.background === '#000000';
  const { logout, user, refreshMe } = useAuth();
  const [creditsError, setCreditsError] = useState<string | null>(null);
  const {
    displayName,
    setDisplayName,
    preferredStyleId,
    setPreferredStyleId,
    savedDesignIds,
  } = useLocalUiState();
  const resetDesignFlow = useDesignStore(state => state.resetDesignFlow);
  const [activeModal, setActiveModal] = useState<'edit' | 'style' | 'appearance' | null>(null);
  const [editedName, setEditedName] = useState(displayName);
  const notificationsEnabled = useDesignStore(state => state.notificationsEnabled);
  const setNotificationsEnabled = useDesignStore(state => state.setNotificationsEnabled);
  const appearancePreference = useDesignStore(state => state.appearancePreference);
  const setAppearancePreference = useDesignStore(state => state.setAppearancePreference);
  const totalDesigns = useDesignStore(state => state.designs.length);
  const favoriteDesigns = savedDesignIds.length;
  const availableCredits = user?.availableCredits ?? 0;
  const totalCredits = user?.credits ?? 0;
  const reservedCredits = user?.reservedCredits ?? 0;
  const usedCredits = Math.max(0, totalCredits - availableCredits);
  const quotaPct = totalCredits > 0 ? Math.round((usedCredits / totalCredits) * 100) : 0;
  const preferredStyle = MOCK_STYLES.find(style => style.id === preferredStyleId) ?? MOCK_STYLES[0];

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setCreditsError(null);
    void refreshMe(controller.signal).catch(error => {
      if (!controller.signal.aborted) {
        setCreditsError(error instanceof Error ? error.message : 'Account credits could not be refreshed.');
      }
    });
    return () => controller.abort();
  }, [refreshMe]));

  function showPendingFeature(feature: string) {
    Alert.alert('Pending integration', `${feature} has not been configured yet.`);
  }

  return (
    <ScrollView
      style={[styles.root, isDark && styles.darkRoot]}
      contentContainerStyle={[contentStyle, { maxWidth: 900, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={[styles.headerBg, isDesktop && styles.headerBgDesktop, { paddingTop: insets.top + Spacing.three }]}>
        <Text style={styles.wordmark}>ATELIER</Text>
        <View style={styles.avatarWrapper}>
          {user?.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" /> : null}
          <View style={styles.avatarBorder} />
        </View>
        <Text style={styles.displayName}>{user?.displayName || displayName}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
        <View style={styles.planRow}>
        <Badge label={user?.role === 'admin' ? 'Admin account' : 'Free account'} variant="accent" />
        </View>
      </View>

      {creditsError ? (
        <Text style={[styles.creditError, isDark && styles.lightText]} accessibilityRole="alert">
          Credit balance could not be refreshed: {creditsError}
        </Text>
      ) : null}

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop, isDark && styles.darkCard]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDark && styles.lightText]}>{totalDesigns}</Text>
          <Text style={[styles.statLabel, isDark && styles.darkMutedText]}>Designs</Text>
        </View>
        <View style={[styles.statDivider, isDark && styles.darkDivider]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDark && styles.lightText]}>{favoriteDesigns}</Text>
          <Text style={[styles.statLabel, isDark && styles.darkMutedText]}>Saved</Text>
        </View>
        <View style={[styles.statDivider, isDark && styles.darkDivider]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDark && styles.lightText]}>{availableCredits}</Text>
          <Text style={[styles.statLabel, isDark && styles.darkMutedText]}>Credits left</Text>
        </View>
      </View>

      {/* ── Generation quota ────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={[styles.quotaCard, isDark && styles.darkCard]}>
          <View style={styles.quotaHeader}>
            <Text style={[styles.quotaTitle, isDark && styles.lightText]}>Generation Credits</Text>
            <Text style={[styles.quotaFraction, isDark && styles.lightText]}>
              {usedCredits}/{totalCredits}
            </Text>
          </View>
          <View style={[styles.quotaTrack, isDark && styles.darkTrack]}>
            <View style={[styles.quotaFill, { width: `${quotaPct}%` }]} />
          </View>
          <Text style={[styles.quotaHint, isDark && styles.darkMutedText]}>
            {availableCredits} available · {reservedCredits} reserved for jobs in progress
          </Text>
        </View>
      </View>

      {/* ── Account ─────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.darkMutedText]}>Account</Text>
        <View style={[styles.settingsCard, isDark && styles.darkCard]}>
          <SettingsRow
            icon={{ ios: 'person', android: 'person', web: 'person' }}
            label="Edit Profile"
            onPress={() => {
              setEditedName(displayName);
              setActiveModal('edit');
            }}
          />
          <View style={[styles.rowDivider, isDark && styles.darkDivider]} />
          <SettingsRow
            icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
            label="Notifications"
            value={notificationsEnabled ? 'On (local)' : 'Off (local)'}
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
          />
          <View style={[styles.rowDivider, isDark && styles.darkDivider]} />
          <SettingsRow
            icon={{ ios: 'paintpalette', android: 'palette', web: 'palette' }}
            label="Preferred Style"
            value={preferredStyle.name}
            onPress={() => setActiveModal('style')}
          />
          <View style={[styles.rowDivider, isDark && styles.darkDivider]} />
          <SettingsRow
            icon={{ ios: 'moon', android: 'dark_mode', web: 'dark_mode' }}
            label="Appearance"
            value={appearancePreference[0].toUpperCase() + appearancePreference.slice(1)}
            onPress={() => setActiveModal('appearance')}
          />
        </View>
      </View>

      {/* ── Subscription ────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.darkMutedText]}>Subscription</Text>
        <View style={[styles.settingsCard, isDark && styles.darkCard]}>
          <SettingsRow
            icon={{ ios: 'star', android: 'star', web: 'star' }}
            label="Upgrade to Studio"
            onPress={() => showPendingFeature('Plan upgrades')}
          />
          <View style={[styles.rowDivider, isDark && styles.darkDivider]} />
          <SettingsRow
            icon={{ ios: 'doc.text', android: 'description', web: 'description' }}
            label="Billing & Invoices"
            onPress={() => showPendingFeature('Billing')}
          />
          <View style={[styles.rowDivider, isDark && styles.darkDivider]} />
          <SettingsRow
            icon={{ ios: 'creditcard', android: 'credit_card', web: 'credit_card' }}
            label="Manage Plan"
            value={user?.role === 'admin' ? 'Admin' : 'Free'}
            onPress={() => showPendingFeature('Plan management')}
          />
        </View>
      </View>

      {/* ── Support ─────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.darkMutedText]}>Support</Text>
        <View style={[styles.settingsCard, isDark && styles.darkCard]}>
          <SettingsRow
            icon={{ ios: 'message', android: 'chat', web: 'chat' }}
            label="Help & Support"
            onPress={() => showPendingFeature('Help and support')}
          />
          <View style={[styles.rowDivider, isDark && styles.darkDivider]} />
          <SettingsRow
            icon={{ ios: 'lock.shield', android: 'privacy_tip', web: 'privacy_tip' }}
            label="Privacy Policy"
            onPress={() => showPendingFeature('Privacy policy')}
          />
          <View style={[styles.rowDivider, isDark && styles.darkDivider]} />
          <SettingsRow
            icon={{ ios: 'doc', android: 'article', web: 'article' }}
            label="Terms of Service"
            onPress={() => showPendingFeature('Terms of service')}
          />
        </View>
      </View>

      {/* ── Sign out ────────────────────────────────────────────────── */}
      <View style={[styles.section, { marginBottom: Spacing.four }]}>
        <View style={[styles.settingsCard, isDark && styles.darkCard]}>
          <SettingsRow
            icon={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
            label="Sign Out"
            destructive
            onPress={() => {
              void logout()
                .then(() => {
                  resetDesignFlow();
                  router.replace('/(auth)/login');
                })
                .catch(error => Alert.alert(
                  'Sign out failed',
                  error instanceof Error ? error.message : 'Please try again.',
                ));
            }}
          />
        </View>
      </View>

      <Modal
        visible={activeModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setActiveModal(null)}
            accessibilityLabel="Close dialog"
          />
          {activeModal === 'edit' ? (
            <View style={[styles.modalCard, isDark && styles.darkCard]}>
              <Text style={[styles.modalTitle, isDark && styles.lightText]}>Edit Profile</Text>
              <Text style={[styles.modalHint, isDark && styles.darkMutedText]}>Changes are saved to your account.</Text>
              <TextInput
                style={[styles.nameInput, isDark && styles.darkInput]}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Your name"
                placeholderTextColor={Brand.taupe}
                accessibilityLabel="Display name"
                autoCapitalize="words"
                returnKeyType="done"
              />
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalSecondaryButton, isDark && styles.modalSecondaryButtonDark]}
                  onPress={() => setActiveModal(null)}
                >
                  <Text style={[styles.modalSecondaryText, isDark && styles.lightText]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalPrimaryButton}
                  onPress={() => {
                    if (!editedName.trim()) {
                      Alert.alert('Name required', 'Enter a name before saving.');
                      return;
                    }
                    void (async () => {
                      try {
                        await apiRequest('/auth/me', {
                          method: 'PATCH',
                          body: JSON.stringify({ name: editedName.trim() }),
                        });
                        await refreshMe();
                        setDisplayName(editedName.trim());
                        setActiveModal(null);
                      } catch (error) {
                        Alert.alert(
                          'Profile update failed',
                          error instanceof Error ? error.message : 'Please try again.',
                        );
                      }
                    })();
                  }}
                >
                  <Text style={styles.modalPrimaryText}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : activeModal === 'style' ? (
            <View style={[styles.modalCard, isDark && styles.darkCard]}>
              <Text style={[styles.modalTitle, isDark && styles.lightText]}>Preferred Style</Text>
              <Text style={[styles.modalHint, isDark && styles.darkMutedText]}>Used as the default in New Design. Saved on this device.</Text>
              <ScrollView style={styles.styleOptions} showsVerticalScrollIndicator={false}>
                {MOCK_STYLES.map(style => {
                  const selected = style.id === preferredStyleId;
                  return (
                    <Pressable
                      key={style.id}
                      style={[
                        styles.styleOption,
                        isDark && styles.styleOptionDark,
                        selected && styles.styleOptionSelected,
                        isDark && selected && styles.styleOptionSelectedDark,
                      ]}
                      onPress={() => {
                        setPreferredStyleId(style.id);
                        setActiveModal(null);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Text style={[styles.styleOptionText, isDark && styles.lightText, selected && styles.styleOptionTextSelected]}>
                        {style.name}
                      </Text>
                      {selected && (
                        <SymbolView
                          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                          size={16}
                          tintColor={Brand.gold}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Pressable
                style={[styles.modalSecondaryButton, isDark && styles.modalSecondaryButtonDark]}
                onPress={() => setActiveModal(null)}
              >
                <Text style={[styles.modalSecondaryText, isDark && styles.lightText]}>Cancel</Text>
              </Pressable>
            </View>
          ) : activeModal === 'appearance' ? (
            <View style={[styles.modalCard, isDark && styles.darkCard]}>
              <Text style={[styles.modalTitle, isDark && styles.lightText]}>Appearance</Text>
              <Text style={[styles.modalHint, isDark && styles.darkMutedText]}>Choose the color scheme for this app.</Text>
              {([
                ['system', 'System'],
                ['light', 'Light'],
                ['dark', 'Dark'],
              ] as const).map(([value, label]) => {
                const selected = value === appearancePreference;
                return (
                  <Pressable
                    key={value}
                    style={[
                      styles.styleOption,
                      isDark && styles.styleOptionDark,
                      selected && styles.styleOptionSelected,
                      isDark && selected && styles.styleOptionSelectedDark,
                    ]}
                    onPress={() => {
                      setAppearancePreference(value);
                      setActiveModal(null);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.styleOptionText, isDark && styles.lightText, selected && styles.styleOptionTextSelected]}>
                      {label}
                    </Text>
                    {selected && (
                      <SymbolView
                        name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                        size={16}
                        tintColor={Brand.gold}
                      />
                    )}
                  </Pressable>
                );
              })}
              <Pressable
                style={[styles.modalSecondaryButton, isDark && styles.modalSecondaryButtonDark]}
                onPress={() => setActiveModal(null)}
              >
                <Text style={[styles.modalSecondaryText, isDark && styles.lightText]}>Cancel</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ivory },
  darkRoot: { backgroundColor: '#1C1814' },
  darkCard: { backgroundColor: '#231E19', borderColor: '#3A3028' },
  lightText: { color: Brand.ivory },
  darkMutedText: { color: '#A89E94' },
  darkInput: { backgroundColor: '#1C1814', color: Brand.ivory, borderColor: '#3A3028' },
  headerBg: {
    backgroundColor: Brand.espresso,
    alignItems: 'center',
    paddingBottom: Spacing.five,
    gap: Spacing.one,
  },
  headerBgDesktop: { paddingVertical: Spacing.five },
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
  creditError: { ...Typography.bodySmall, color: '#A33B2E', textAlign: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
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
  statsRowDesktop: { width: '92%', maxWidth: 820, alignSelf: 'center' },
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
  section: { width: '100%', maxWidth: 820, alignSelf: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.two },
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
  darkTrack: { backgroundColor: '#3A3028' },
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
  settingsRowDark: { backgroundColor: '#231E19' },
  settingsRowPressed: { backgroundColor: Brand.cream },
  darkPressed: { backgroundColor: '#30251F' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(48,37,31,0.55)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    backgroundColor: Brand.ivory,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    ...Shadow.medium,
  },
  modalTitle: {
    ...Typography.headingMedium,
    color: Brand.espresso,
    fontFamily: Fonts?.serif ?? 'serif',
  },
  modalHint: { ...Typography.bodySmall, color: Brand.taupe },
  nameInput: {
    ...Typography.bodyMedium,
    color: Brand.espresso,
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.beige,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
  modalPrimaryButton: {
    backgroundColor: Brand.espresso,
    borderRadius: Radius.full,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  modalPrimaryText: { ...Typography.labelLarge, color: Brand.ivory },
  modalSecondaryButton: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    backgroundColor: Brand.beige,
  },
  modalSecondaryButtonDark: { backgroundColor: '#3A3028' },
  modalSecondaryText: { ...Typography.labelLarge, color: Brand.espresso },
  styleOptions: { flexGrow: 0 },
  styleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Brand.beige,
  },
  styleOptionSelected: { backgroundColor: Brand.cream },
  styleOptionDark: { borderBottomColor: '#3A3028' },
  styleOptionSelectedDark: { backgroundColor: '#30251F' },
  styleOptionText: { ...Typography.bodyMedium, color: Brand.espresso },
  styleOptionTextSelected: { fontWeight: '600' },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  iconWrap: { width: 20, alignItems: 'center' },
  iconWrapDark: { backgroundColor: 'transparent' },
  settingsLabel: { ...Typography.bodyMedium, color: Brand.espresso },
  destructiveLabel: { color: '#C0392B' },
  settingsRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  settingsValue: { ...Typography.bodySmall, color: Brand.taupe },
  rowDivider: {
    height: 1,
    backgroundColor: Brand.beige,
    marginLeft: Spacing.three + 20 + Spacing.two,
  },
  darkDivider: { backgroundColor: '#3A3028' },
});
