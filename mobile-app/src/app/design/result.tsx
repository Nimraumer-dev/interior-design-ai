import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { MOCK_DESIGNS } from '@/services/mock-data';
import { roomTypeLabel } from '@/utils/format';

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const { resultId } = useLocalSearchParams<{ resultId?: string }>();
  const design = MOCK_DESIGNS.find(d => d.id === resultId) ?? MOCK_DESIGNS[0];

  const [showAfter, setShowAfter] = useState(true);
  const [isSaved, setIsSaved] = useState(design.isFavorite);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()} accessibilityLabel="Close">
          <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={18} tintColor={Brand.espresso} weight="light" />
        </Pressable>
        <Text style={styles.topTitle}>Your Design</Text>
        <Pressable style={styles.iconBtn} onPress={() => setIsSaved(v => !v)} accessibilityLabel="Save design">
          <SymbolView
            name={isSaved
              ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' }
              : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
            size={18}
            tintColor={isSaved ? Brand.gold : Brand.taupe}
          />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {/* ── Before / After toggle ─────────────────────────────────── */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: showAfter ? design.generatedImageUrl : design.originalImageUrl }}
            style={styles.mainImage}
            contentFit="cover"
          />
          <View style={styles.togglePill}>
            <Pressable
              style={[styles.toggleBtn, !showAfter && styles.toggleBtnActive]}
              onPress={() => setShowAfter(false)}
            >
              <Text style={[styles.toggleLabel, !showAfter && styles.toggleLabelActive]}>Before</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, showAfter && styles.toggleBtnActive]}
              onPress={() => setShowAfter(true)}
            >
              <Text style={[styles.toggleLabel, showAfter && styles.toggleLabelActive]}>After</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Design info ───────────────────────────────────────────── */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Badge label={design.styleName} variant="default" />
            <Badge label={roomTypeLabel(design.roomType)} variant="default" />
          </View>
          <Text style={styles.designTitle}>{design.title}</Text>
          <Text style={styles.designSub}>
            AI-generated redesign · {design.suggestedFurniture.length} furniture pieces identified
          </Text>
        </View>

        {/* ── Side-by-side thumbnails ───────────────────────────────── */}
        <View style={styles.thumbRow}>
          <View style={styles.thumbWrap}>
            <Image source={{ uri: design.originalImageUrl }} style={styles.thumb} contentFit="cover" />
            <Text style={styles.thumbLabel}>Before</Text>
          </View>
          <View style={styles.thumbDivider}>
            <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={16} tintColor={Brand.gold} weight="light" />
          </View>
          <View style={styles.thumbWrap}>
            <Image source={{ uri: design.generatedImageUrl }} style={styles.thumb} contentFit="cover" />
            <Text style={styles.thumbLabel}>After</Text>
          </View>
        </View>

        {/* ── Action cards ─────────────────────────────────────────── */}
        <View style={styles.actionGrid}>
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push({ pathname: '/design/furniture', params: { resultId: design.id } })}
          >
            <SymbolView name={{ ios: 'tag', android: 'sell', web: 'sell' }} size={22} tintColor={Brand.gold} weight="light" />
            <Text style={styles.actionLabel}>Shop Furniture</Text>
            <Text style={styles.actionSub}>{design.suggestedFurniture.length} items</Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => router.push({ pathname: '/design/cost', params: { resultId: design.id } })}
          >
            <SymbolView name={{ ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }} size={22} tintColor={Brand.gold} weight="light" />
            <Text style={styles.actionLabel}>Total Cost</Text>
            <Text style={styles.actionSub}>View breakdown</Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => router.push({ pathname: '/design/preview-3d', params: { resultId: design.id } })}
          >
            <SymbolView name={{ ios: 'cube', android: 'view_in_ar', web: 'view_in_ar' }} size={22} tintColor={Brand.gold} weight="light" />
            <Text style={styles.actionLabel}>3D Preview</Text>
            <Text style={styles.actionSub}>Walk through</Text>
          </Pressable>

          <Pressable style={styles.actionCard}>
            <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} size={22} tintColor={Brand.gold} weight="light" />
            <Text style={styles.actionLabel}>Share</Text>
            <Text style={styles.actionSub}>Send to friends</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.three }]}>
        <Button
          label="Shop This Look"
          onPress={() => router.push({ pathname: '/design/furniture', params: { resultId: design.id } })}
          fullWidth
          size="lg"
        />
        <Button
          label="Start New Design"
          variant="secondary"
          onPress={() => router.replace('/(tabs)/generate')}
          fullWidth
          size="md"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ivory },
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
  imageWrap: { position: 'relative' },
  mainImage: { width: '100%', height: 320 },
  togglePill: {
    position: 'absolute', bottom: Spacing.three,
    alignSelf: 'center', flexDirection: 'row',
    backgroundColor: 'rgba(48,37,31,0.75)', borderRadius: Radius.full,
    padding: 3,
  },
  toggleBtn: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.three, borderRadius: Radius.full },
  toggleBtnActive: { backgroundColor: Brand.ivory },
  toggleLabel: { ...Typography.labelMedium, color: Brand.beige },
  toggleLabelActive: { color: Brand.espresso, fontWeight: '600' },
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
  actionCard: {
    width: '47%', backgroundColor: Brand.white, borderRadius: Radius.lg,
    padding: Spacing.three, alignItems: 'center', gap: Spacing.one,
    borderWidth: 1, borderColor: Brand.beige, ...Shadow.soft,
  },
  actionLabel: { ...Typography.labelLarge, color: Brand.espresso, fontWeight: '600' },
  actionSub: { ...Typography.bodySmall, color: Brand.taupe },
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two,
    backgroundColor: Brand.ivory, borderTopWidth: 1, borderTopColor: Brand.beige,
  },
});
