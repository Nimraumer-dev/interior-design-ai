import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  PanResponder,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { refreshDesign, setDesignFavorite } from '@/services/design-api';
import { useTheme } from '@/hooks/use-theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { roomTypeLabel } from '@/utils/format';
import { useDesignStore } from '@/stores/design-store';

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { contentStyle, isDesktop } = useResponsiveLayout();
  const { resultId } = useLocalSearchParams<{ resultId?: string }>();
  const design = useDesignStore(state => state.designs.find(item => item.id === resultId));
  const toggleDesignSaved = useDesignStore(state => state.toggleDesignSaved);
  const resetDesignFlow = useDesignStore(state => state.resetDesignFlow);
  const [sliderRatio, setSliderRatio] = useState(0.5);
  const [comparisonWidth, setComparisonWidth] = useState(0);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const sliderWidth = useRef(0);
  const startingRatio = useRef(0.5);
  const sliderRatioRef = useRef(0.5);
  // PanResponder reads these refs only from deferred gesture callbacks.
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() =>
    PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2,
        onPanResponderGrant: () => {
          startingRatio.current = sliderRatioRef.current;
        },
        onPanResponderMove: (_, gesture) => {
          if (sliderWidth.current > 0) {
            const nextRatio = Math.max(
              0,
              Math.min(1, startingRatio.current + gesture.dx / sliderWidth.current),
            );
            sliderRatioRef.current = nextRatio;
            setSliderRatio(nextRatio);
          }
        },
      }),
  );

  useFocusEffect(useCallback(() => {
    if (!resultId) return;
    const controller = new AbortController();
    setRefreshError(null);
    void refreshDesign(resultId, controller.signal).catch(error => {
      if (!controller.signal.aborted) {
        setRefreshError(error instanceof Error ? error.message : 'Design result could not be refreshed.');
      }
    });
    return () => controller.abort();
  }, [resultId]));

  if (!design) {
    return (
      <View style={[styles.root, styles.emptyResult, { paddingTop: insets.top, backgroundColor: theme.ivory }]}>
        <SymbolView
          name={{ ios: 'house', android: 'home', web: 'home' }}
          size={40}
          tintColor={Brand.gold}
        />
        <Text style={[styles.designTitle, { color: theme.espresso }]}>Design unavailable</Text>
        <Text style={[styles.designSub, { color: theme.taupe }]}>It may have been deleted from this device.</Text>
        <Button label="Go to My Designs" onPress={() => router.replace('/(tabs)/designs')} />
      </View>
    );
  }

  const designId = design.id;
  const isSaved = design.isFavorite;

  async function handleToggleSaved() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await setDesignFavorite(designId, !isSaved);
      toggleDesignSaved(designId);
    } catch (error) {
      Alert.alert(
        'Could not update saved designs',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: theme.ivory }]}>
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <View style={[styles.topBar, contentStyle, { borderBottomColor: theme.border }]}>
        <Pressable style={[styles.iconBtn, { backgroundColor: theme.beige }]} onPress={() => router.back()} accessibilityLabel="Close">
          <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={18} tintColor={theme.espresso} weight="light" />
        </Pressable>
        <Text style={[styles.topTitle, { color: theme.espresso }]}>Your Design</Text>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: theme.beige }]}
          onPress={() => void handleToggleSaved()}
          disabled={isSaving}
          accessibilityLabel={isSaved ? 'Remove saved design' : 'Save design'}
          accessibilityRole="button"
        >
          <SymbolView
            name={isSaved
              ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' }
              : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
            size={18}
            tintColor={isSaved ? theme.gold : theme.taupe}
          />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[contentStyle, { maxWidth: 1100, paddingBottom: insets.bottom + 120 }]}>
        <View style={[styles.demoNotice, { backgroundColor: theme.cream }]}>
          <SymbolView
            name={{ ios: design.isMock ? 'info.circle' : 'checkmark.circle', android: design.isMock ? 'info' : 'check_circle', web: design.isMock ? 'info' : 'check_circle' }}
            size={14}
            tintColor={theme.gold}
          />
          <Text style={[styles.demoNoticeText, { color: theme.walnut }]}>
            {design.isMock
              ? 'Mock AI result — the backend generated a clearly labelled sample image.'
              : 'AI-generated result from your submitted room photo.'}
          </Text>
        </View>
        {refreshError ? (
          <Text style={[styles.refreshError, { color: theme.taupe }]}>{refreshError}</Text>
        ) : null}
        {design.status === 'pending' || design.status === 'processing' || design.status === 'failed' ? (
          <Text style={[styles.refreshError, { color: theme.taupe }]}>
            {design.status === 'failed'
              ? design.errorMessage || 'This design generation failed.'
              : 'Design generation is still processing. Reopen this screen to refresh its status.'}
          </Text>
        ) : null}

        {/* ── Interactive Before / After comparison ────────────────── */}
        <View
          style={[styles.imageWrap, isDesktop && styles.imageWrapDesktop]}
          onLayout={event => {
            const width = event.nativeEvent.layout.width;
            sliderWidth.current = width;
            setComparisonWidth(width);
          }}
        >
          <Image
            source={{ uri: design.generatedImageUrl }}
            style={[styles.mainImage, isDesktop && styles.mainImageDesktop]}
            contentFit="cover"
          />
          {design.originalImageUrl ? (
            <View style={[styles.beforeClip, { width: `${sliderRatio * 100}%` }]}>
              <Image
                source={{ uri: design.originalImageUrl }}
                style={[styles.mainImage, isDesktop && styles.mainImageDesktop, { width: comparisonWidth }]}
                contentFit="cover"
              />
            </View>
          ) : (
            <View style={styles.beforeUnavailable}>
              <Text style={styles.imageLabel}>Original photo is only stored on the device that uploaded it</Text>
            </View>
          )}
          {design.originalImageUrl ? (
            <>
              <View style={styles.imageLabelLeft}><Text style={styles.imageLabel}>Before</Text></View>
              <View style={styles.imageLabelRight}><Text style={styles.imageLabel}>After</Text></View>
              <View style={[styles.sliderDivider, { left: `${sliderRatio * 100}%` }]} pointerEvents="none" />
              <Pressable
                style={[styles.sliderHandle, { left: `${sliderRatio * 100}%` }]}
                accessibilityRole="adjustable"
                accessibilityLabel="Before and after image comparison"
                accessibilityValue={{ min: 0, max: 100, now: Math.round(sliderRatio * 100) }}
                {...panResponder.panHandlers}
              >
                <View style={styles.sliderHandleGrip}>
                  <SymbolView
                    name={{ ios: 'arrow.left.and.right', android: 'swap_horiz', web: 'swap_horiz' }}
                    size={15}
                    tintColor={theme.espresso}
                  />
                </View>
              </Pressable>
            </>
          ) : null}
        </View>

        {/* ── Design info ───────────────────────────────────────────── */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Badge label={design.styleName} variant="default" />
            <Badge label={roomTypeLabel(design.roomType)} variant="default" />
          </View>
          <Text style={[styles.designTitle, { color: theme.espresso }]}>{design.title}</Text>
          <Text style={[styles.designSub, { color: theme.taupe }]}>
            {design.isMock ? 'Mock AI' : 'AI result'} · {design.suggestedFurniture.length} catalogue recommendations
          </Text>
        </View>

        {/* ── Side-by-side thumbnails ───────────────────────────────── */}
        <View style={styles.thumbRow}>
          <View style={styles.thumbWrap}>
            {design.originalImageUrl ? (
              <Image source={{ uri: design.originalImageUrl }} style={styles.thumb} contentFit="cover" />
            ) : (
              <View style={[styles.thumb, styles.beforeUnavailable]} />
            )}
            <Text style={[styles.thumbLabel, { color: theme.taupe }]}>
              {design.originalImageUrl ? 'Before' : 'Original unavailable'}
            </Text>
          </View>
          <View style={styles.thumbDivider}>
            <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={16} tintColor={theme.gold} weight="light" />
          </View>
          <View style={styles.thumbWrap}>
            <Image source={{ uri: design.generatedImageUrl }} style={styles.thumb} contentFit="cover" />
            <Text style={[styles.thumbLabel, { color: theme.taupe }]}>After</Text>
          </View>
        </View>

        {/* ── Action cards ─────────────────────────────────────────── */}
        <View style={[styles.actionGrid, isDesktop && styles.actionGridDesktop]}>
          <Pressable
            style={[styles.actionCard, isDesktop && styles.actionCardDesktop, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={() => router.push({ pathname: '/design/furniture', params: { resultId: design.id } })}
          >
            <SymbolView name={{ ios: 'tag', android: 'sell', web: 'sell' }} size={22} tintColor={theme.gold} weight="light" />
            <Text style={[styles.actionLabel, { color: theme.espresso }]}>Shop Furniture</Text>
            <Text style={[styles.actionSub, { color: theme.taupe }]}>{design.suggestedFurniture.length} items</Text>
          </Pressable>

          <Pressable
            style={[styles.actionCard, isDesktop && styles.actionCardDesktop, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={() => router.push({ pathname: '/design/cost', params: { resultId: design.id } })}
          >
            <SymbolView name={{ ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }} size={22} tintColor={theme.gold} weight="light" />
            <Text style={[styles.actionLabel, { color: theme.espresso }]}>Total Cost</Text>
            <Text style={[styles.actionSub, { color: theme.taupe }]}>View breakdown</Text>
          </Pressable>

          <Pressable
            style={[styles.actionCard, isDesktop && styles.actionCardDesktop, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={() => router.push({ pathname: '/design/preview-3d', params: { resultId: design.id } })}
          >
            <SymbolView name={{ ios: 'cube', android: 'view_in_ar', web: 'view_in_ar' }} size={22} tintColor={theme.gold} weight="light" />
            <Text style={[styles.actionLabel, { color: theme.espresso }]}>3D Preview</Text>
            <Text style={[styles.actionSub, { color: theme.taupe }]}>Walk through</Text>
          </Pressable>

          <Pressable
            style={[styles.actionCard, isDesktop && styles.actionCardDesktop, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={async () => {
              try {
                await Share.share({ message: `Take a look at my ${design.title} interior design.` });
              } catch {
                Alert.alert('Sharing unavailable', 'This design could not be shared on this device.');
              }
            }}
          >
            <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} size={22} tintColor={theme.gold} weight="light" />
            <Text style={[styles.actionLabel, { color: theme.espresso }]}>Share</Text>
            <Text style={[styles.actionSub, { color: theme.taupe }]}>Send to friends</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <View style={[styles.cta, contentStyle, { paddingBottom: insets.bottom + Spacing.three, backgroundColor: theme.ivory, borderTopColor: theme.border }]}>
        <Button
          label="Browse Recommended Furniture"
          onPress={() => router.push({ pathname: '/design/furniture', params: { resultId: design.id } })}
          fullWidth
          size="lg"
        />
        <Button
          label="Start New Design"
          variant="secondary"
          onPress={() => {
            resetDesignFlow();
            router.replace('/(tabs)/generate');
          }}
          fullWidth
          size="md"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ivory },
  emptyResult: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.two,
    borderBottomWidth: 1, borderBottomColor: Brand.beige,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Brand.beige, alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontSize: 16, fontWeight: '500', color: Brand.espresso, fontFamily: Fonts?.serif ?? 'serif' },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: Brand.cream,
  },
  demoNoticeText: { ...Typography.bodySmall, color: Brand.walnut, textAlign: 'center' },
  refreshError: { ...Typography.bodySmall, color: Brand.taupe, paddingHorizontal: Spacing.four, paddingVertical: Spacing.one },
  imageWrap: { position: 'relative', overflow: 'hidden' },
  mainImage: { width: '100%', height: 320 },
  imageWrapDesktop: { maxHeight: 540, aspectRatio: 16 / 9 },
  mainImageDesktop: { height: '100%' },
  beforeUnavailable: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(48,37,31,0.35)',
    paddingHorizontal: Spacing.four,
  },
  beforeClip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  imageLabelLeft: { position: 'absolute', top: Spacing.three, left: Spacing.three },
  imageLabelRight: { position: 'absolute', top: Spacing.three, right: Spacing.three },
  imageLabel: {
    ...Typography.labelSmall,
    color: Brand.ivory,
    backgroundColor: 'rgba(48,37,31,0.72)',
    overflow: 'hidden',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  sliderDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Brand.ivory,
    marginLeft: -1,
  },
  sliderHandle: {
    position: 'absolute',
    top: '50%',
    width: 42,
    height: 54,
    marginTop: -27,
    marginLeft: -21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderHandleGrip: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.ivory,
    borderWidth: 1,
    borderColor: Brand.gold,
    ...Shadow.soft,
  },
  infoCard: {
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two,
  },
  infoRow: { flexDirection: 'row', gap: Spacing.two },
  designTitle: { fontSize: 22, fontWeight: '300', color: Brand.espresso, fontFamily: Fonts?.serif ?? 'serif' },
  designSub: { ...Typography.bodySmall, color: Brand.taupe },
  thumbRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two,
  },
  thumbWrap: { flex: 1, gap: Spacing.one },
  thumb: { width: '100%', aspectRatio: 1.4, borderRadius: Radius.md },
  thumbLabel: { ...Typography.labelSmall, color: Brand.taupe, textAlign: 'center' },
  thumbDivider: { alignItems: 'center', justifyContent: 'center' },
  actionGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two,
  },
  actionGridDesktop: { maxWidth: 1100, width: '100%', alignSelf: 'center' },
  actionCard: {
    width: '47%', backgroundColor: Brand.white, borderRadius: Radius.lg,
    padding: Spacing.three, alignItems: 'center', gap: Spacing.one,
    borderWidth: 1, borderColor: Brand.beige, ...Shadow.soft,
  },
  actionCardDesktop: { width: '23.5%' },
  actionLabel: { ...Typography.labelLarge, color: Brand.espresso, fontWeight: '600' },
  actionSub: { ...Typography.bodySmall, color: Brand.taupe },
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two,
    backgroundColor: Brand.ivory, borderTopWidth: 1, borderTopColor: Brand.beige,
    maxWidth: 720, alignSelf: 'center', width: '100%',
  },
});
