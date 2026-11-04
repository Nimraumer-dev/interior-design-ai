import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlowHeader } from '@/components/design/flow-header';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { MOCK_STYLES } from '@/services/mock-data';

export default function ChooseStyleScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ roomType?: string; imageUri?: string; styleId?: string }>();
  const [selectedId, setSelectedId] = useState<string>(params.styleId ?? '');

  function handleContinue() {
    if (!selectedId) return;
    router.push({
      pathname: '/design/budget',
      params: { ...params, styleId: selectedId },
    });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.three }]}>
      <FlowHeader
        title="Choose a Style"
        subtitle="Select the aesthetic for your redesign."
        step={2}
        totalSteps={5}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120, paddingTop: Spacing.three }}
      >
        <View style={styles.grid}>
          {MOCK_STYLES.map(style => {
            const isSelected = selectedId === style.id;
            return (
              <Pressable
                key={style.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setSelectedId(style.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <Image source={{ uri: style.previewImageUrl }} style={styles.cardImage} contentFit="cover" />
                <View style={[styles.cardOverlay, isSelected && styles.cardOverlaySelected]} />

                {isSelected && (
                  <View style={styles.checkBadge}>
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      size={13}
                      tintColor={Brand.white}
                      weight="bold"
                    />
                  </View>
                )}

                <View style={styles.cardContent}>
                  <Text style={styles.cardName}>{style.name}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{style.description}</Text>
                  <View style={styles.tagRow}>
                    {style.tags.map(tag => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.three }]}>
        <Button
          label={selectedId ? 'Continue' : 'Select a Style to Continue'}
          onPress={handleContinue}
          disabled={!selectedId}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ivory },
  grid: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  card: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadow.soft,
  },
  cardSelected: { borderColor: Brand.gold },
  cardImage: { width: '100%', height: 160 },
  cardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Brand.espresso,
    opacity: 0.15,
  },
  cardOverlaySelected: { opacity: 0.05 },
  checkBadge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    backgroundColor: Brand.white,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '500',
    color: Brand.espresso,
    fontFamily: Fonts?.serif ?? 'serif',
  },
  cardDesc: { ...Typography.bodySmall, color: Brand.taupe },
  tagRow: { flexDirection: 'row', gap: Spacing.one, marginTop: Spacing.one },
  tag: {
    backgroundColor: Brand.beige,
    borderRadius: Radius.full,
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
  },
  tagText: { ...Typography.labelSmall, color: Brand.taupe },
  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    backgroundColor: Brand.ivory,
    borderTopWidth: 1,
    borderTopColor: Brand.beige,
  },
});
