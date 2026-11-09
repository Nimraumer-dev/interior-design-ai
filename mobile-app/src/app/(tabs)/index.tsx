import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignCard } from '@/components/design/design-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { MOCK_STYLES } from '@/services/mock-data';
import { useDesignStore } from '@/stores/design-store';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { contentStyle, columns, isDesktop, isWide } = useResponsiveLayout();
  const { user, refreshMe } = useAuth();
  const [creditsError, setCreditsError] = useState<string | null>(null);
  const displayName = useDesignStore(state => state.displayName);
  const designs = useDesignStore(state => state.designs);
  const resetDesignFlow = useDesignStore(state => state.resetDesignFlow);
  const setStyleId = useDesignStore(state => state.setStyleId);
  const recentDesigns = designs.slice(0, 4);
  const featuredStyles = MOCK_STYLES.slice(0, 4);
  const availableCredits = user?.availableCredits ?? 0;
  const totalCredits = user?.credits ?? 0;
  const usedCredits = Math.max(0, totalCredits - availableCredits);
  const quotaProgress = totalCredits > 0 ? usedCredits / totalCredits : 0;

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

  const featuredStyleTile = (style: typeof featuredStyles[number]) => (
    <Pressable
      key={style.id}
      style={[styles.styleChip, isWide && styles.styleChipWide]}
      accessibilityRole="button"
      accessibilityLabel={`Create a design in ${style.name} style`}
      onPress={() => {
        resetDesignFlow();
        setStyleId(style.id);
        router.push({ pathname: '/(tabs)/generate', params: { styleId: style.id } });
      }}
    >
      <Image source={{ uri: style.previewImageUrl }} style={styles.styleChipImage} contentFit="cover" />
      <View style={styles.styleChipOverlay} />
      <Text style={styles.styleChipName}>{style.name}</Text>
    </Pressable>
  );

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.ivory }]}
      contentContainerStyle={[contentStyle, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=85' }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <View style={styles.heroOverlay} />

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
          <Text style={styles.wordmark}>ATELIER</Text>
          <Pressable
            style={styles.avatarBtn}
            accessibilityLabel="Profile"
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/profile')}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{user?.displayName?.[0] ?? displayName[0] ?? 'A'}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Hero copy */}
        <View style={styles.heroCopy}>
          <Text style={styles.heroGreeting}>Good morning,</Text>
          <Text style={styles.heroName}>{displayName.split(' ')[0]}</Text>
          <Text style={styles.heroSub}>What will you redesign today?</Text>
          <Button
            label="Start New Design"
            size="md"
            onPress={() => {
              resetDesignFlow();
              router.push('/(tabs)/generate');
            }}
            style={styles.heroBtn}
          />
        </View>
        <Text style={[styles.emptyDesignText, { color: theme.taupe }]}>
          Your account has {availableCredits} generation credit{availableCredits === 1 ? '' : 's'} available.
        </Text>
      </View>

      {creditsError ? (
        <Text style={[styles.creditError, contentStyle]} accessibilityRole="alert">
          Credit balance could not be refreshed: {creditsError}
        </Text>
      ) : null}

      {/* ── Featured Styles ───────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.espresso }]}>Explore Styles</Text>
          <Pressable onPress={() => router.push('/(tabs)/generate')}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {isWide ? (
          <View style={styles.stylesGrid}>{featuredStyles.map(featuredStyleTile)}</View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stylesRow}>
            {featuredStyles.map(featuredStyleTile)}
          </ScrollView>
        )}
      </View>

      {/* ── Recent Designs ────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.espresso }]}>Recent Designs</Text>
          <Pressable onPress={() => router.push('/(tabs)/designs')}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        <View style={[styles.designsGrid, { gap: isDesktop ? Spacing.three : Spacing.two }]}>
          {recentDesigns.length === 0 ? (
            <View style={[styles.emptyDesigns, { backgroundColor: theme.cream }]}>
              <Text style={[styles.emptyDesignText, { color: theme.taupe }]}>Your account designs will appear here.</Text>
              <Button
                label="Create a Design"
                variant="secondary"
                onPress={() => router.push('/(tabs)/generate')}
              />
            </View>
          ) : recentDesigns.map(design => (
            <View key={design.id} style={[styles.gridItem, { width: `${100 / columns - 1}%` }]}>
              <DesignCard
                design={design}
                layout="grid"
                onPress={() => router.push({ pathname: '/design/result', params: { resultId: design.id } })}
              />
            </View>
          ))}
        </View>
      </View>

      {/* ── Generation quota ─────────────────────────────────────────── */}
      <View style={[styles.section, styles.quotaCard, { backgroundColor: theme.surfaceElevated }]}>
        <View style={styles.quotaRow}>
          <View>
            <Text style={[styles.quotaLabel, { color: theme.taupe }]}>Available generation credits</Text>
            <Text style={[styles.quotaCount, { color: theme.espresso }]}>
              {availableCredits} / {totalCredits}
            </Text>
          </View>
          <Badge label={user?.role === 'admin' ? 'Admin' : 'Free'} variant="accent" />
        </View>
        <View style={[styles.quotaTrack, { backgroundColor: theme.beige }]}>
          <View
            style={[
              styles.quotaFill,
              { width: `${quotaProgress * 100}%` },
            ]}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.ivory,
  },
  // ── Hero
  hero: {
    height: 420,
    justifyContent: 'space-between',
  },
  heroDesktop: { height: 520, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl, overflow: 'hidden' },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Brand.espresso,
    opacity: 0.42,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '300',
    color: Brand.ivory,
    letterSpacing: 7,
    fontFamily: Fonts?.serif ?? 'serif',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Brand.gold,
  },
  avatar: { width: 38, height: 38 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.walnut },
  avatarInitial: { ...Typography.labelLarge, color: Brand.ivory },
  heroCopy: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.one,
  },
  heroGreeting: {
    ...Typography.bodyMedium,
    color: Brand.beige,
    opacity: 0.85,
  },
  heroName: {
    fontSize: 34,
    fontWeight: '300',
    color: Brand.ivory,
    fontFamily: Fonts?.serif ?? 'serif',
    lineHeight: 40,
  },
  heroSub: {
    ...Typography.bodyMedium,
    color: Brand.beige,
    opacity: 0.75,
    marginBottom: Spacing.two,
  },
  heroBtn: {
    alignSelf: 'flex-start',
  },
  // ── Sections
  section: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    ...Typography.headingSmall,
    color: Brand.espresso,
    fontFamily: Fonts?.serif ?? 'serif',
  },
  seeAll: {
    ...Typography.labelMedium,
    color: Brand.gold,
  },
  // ── Style chips
  stylesRow: {
    gap: Spacing.two,
    paddingRight: Spacing.four,
  },
  styleChip: {
    width: 120,
    height: 80,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadow.soft,
  },
  styleChipWide: { width: '24%', height: 150 },
  stylesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'space-between' },
  styleChipImage: {
    ...StyleSheet.absoluteFill,
  },
  styleChipOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Brand.espresso,
    opacity: 0.38,
  },
  styleChipName: {
    position: 'absolute',
    bottom: Spacing.two,
    left: Spacing.two,
    right: Spacing.two,
    ...Typography.labelMedium,
    color: Brand.ivory,
    fontWeight: '600',
  },
  // ── Designs grid
  designsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  emptyDesigns: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    backgroundColor: Brand.cream,
  },
  emptyDesignText: { ...Typography.bodyMedium, color: Brand.taupe, textAlign: 'center' },
  creditError: { ...Typography.bodySmall, color: '#A33B2E', textAlign: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  gridItem: { width: '48%', minWidth: 0 },
  // ── Quota card
  quotaCard: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    ...Shadow.soft,
    paddingHorizontal: Spacing.three,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  quotaLabel: {
    ...Typography.labelMedium,
    color: Brand.taupe,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quotaCount: {
    ...Typography.headingSmall,
    color: Brand.espresso,
    marginTop: 2,
  },
  quotaTrack: {
    height: 4,
    backgroundColor: Brand.beige,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  quotaFill: {
    height: 4,
    backgroundColor: Brand.gold,
    borderRadius: Radius.full,
  },
});
