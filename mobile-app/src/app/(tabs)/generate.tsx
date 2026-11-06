import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';

import { Icon } from '@/components/ui/icon';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MOCK_STYLES } from '@/services/mock-data';
import { useDesignStore } from '@/stores/design-store';
import { RoomType } from '@/types/design';

type RoomIconName = {
  ios: string;
  android: string;
  web: string;
};

const ROOM_TYPES: { id: RoomType; label: string; icon: RoomIconName }[] = [
  {
    id: 'living-room',
    label: 'Living Room',
    icon: { ios: 'sofa', android: 'weekend', web: 'weekend' },
  },
  {
    id: 'bedroom',
    label: 'Bedroom',
    icon: { ios: 'bed.double', android: 'bed', web: 'bed' },
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    icon: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  },
  {
    id: 'bathroom',
    label: 'Bathroom',
    icon: { ios: 'shower', android: 'shower', web: 'shower' },
  },
  {
    id: 'dining-room',
    label: 'Dining Room',
    icon: { ios: 'wineglass', android: 'local_bar', web: 'local_bar' },
  },
  {
    id: 'home-office',
    label: 'Home Office',
    icon: { ios: 'desktopcomputer', android: 'computer', web: 'computer' },
  },
];

export default function GenerateScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { styleId: routeStyleId } = useLocalSearchParams<{ styleId?: string }>();
  const selectedRoom = useDesignStore(state => state.roomType);
  const selectedStyleId = useDesignStore(state => state.styleId);
  const preferredStyleId = useDesignStore(state => state.preferredStyleId);
  const setRoomType = useDesignStore(state => state.setRoomType);
  const setStyleId = useDesignStore(state => state.setStyleId);
  const selectedStyle = selectedStyleId ?? preferredStyleId;

  useEffect(() => {
    if (routeStyleId && MOCK_STYLES.some(style => style.id === routeStyleId)) {
      setStyleId(routeStyleId);
    } else if (!selectedStyleId) {
      setStyleId(preferredStyleId);
    }
  }, [preferredStyleId, routeStyleId, selectedStyleId, setStyleId]);

  const canProceed = selectedRoom !== null && selectedStyle !== null;

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: theme.ivory }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={styles.overline}>DESIGN PREVIEW</Text>
        <Text style={[styles.heading, { color: theme.espresso }]}>New Design</Text>
        <Text style={[styles.subheading, { color: theme.taupe }]}>
          Choose a room and style. You can try the design flow with local demo content.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* ── Room type ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.walnut }]}>Select Room Type</Text>
          <View style={styles.roomGrid}>
            {ROOM_TYPES.map(room => {
              const isSelected = selectedRoom === room.id;
              return (
                <Pressable
                  key={room.id}
                  style={[
                    styles.roomChip,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                    isSelected && { backgroundColor: theme.cream, borderColor: theme.gold },
                  ]}
                  onPress={() => setRoomType(room.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Icon
                    ios={room.icon.ios}
                    android={room.icon.android}
                    web={room.icon.web}
                    size={24}
                    color={isSelected ? theme.gold : theme.taupe}
                  />
                  <Text style={[
                    styles.roomLabel,
                    { color: isSelected ? theme.espresso : theme.taupe },
                    isSelected && styles.roomLabelSelected,
                  ]}>
                    {room.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Style picker ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.walnut }]}>Choose a Style</Text>
          <View style={styles.stylesGrid}>
            {MOCK_STYLES.map(style => {
              const isSelected = selectedStyle === style.id;
              return (
                <Pressable
                  key={style.id}
                  style={[styles.styleCard, isSelected && styles.styleCardSelected]}
                  onPress={() => setStyleId(style.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Image
                    source={{ uri: style.previewImageUrl }}
                    style={styles.styleImage}
                    contentFit="cover"
                  />
                  <View style={[styles.styleOverlay, isSelected && styles.styleOverlaySelected]} />
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
                  <View style={styles.styleInfo}>
                    <Text style={styles.styleName}>{style.name}</Text>
                    <View style={styles.styleTags}>
                      {style.tags.slice(0, 2).map(tag => (
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
        </View>
      </ScrollView>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + Spacing.three, backgroundColor: theme.ivory, borderTopColor: theme.border }]}>
        <Button
          label={canProceed ? 'Upload Room Photo' : 'Select Room & Style to Continue'}
          onPress={() => canProceed && router.push('/design/upload')}
          disabled={!canProceed}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ivory },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: Brand.beige,
  },
  overline: { ...Typography.overline, color: Brand.gold, letterSpacing: 3 },
  heading: {
    fontSize: 28,
    fontWeight: '300',
    color: Brand.espresso,
    fontFamily: Fonts?.serif ?? 'serif',
  },
  subheading: { ...Typography.bodyMedium, color: Brand.taupe },
  section: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.three },
  sectionLabel: {
    ...Typography.labelLarge,
    color: Brand.walnut,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  roomChip: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: Radius.md,
    backgroundColor: Brand.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1.5,
    borderColor: Brand.beige,
    ...Shadow.soft,
  },
  roomChipSelected: { borderColor: Brand.gold, backgroundColor: Brand.cream },
  roomLabel: { ...Typography.labelSmall, color: Brand.taupe, textAlign: 'center' },
  roomLabelSelected: { color: Brand.espresso, fontWeight: '600' },
  stylesGrid: { gap: Spacing.two },
  styleCard: {
    height: 120,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadow.soft,
  },
  styleCardSelected: { borderColor: Brand.gold },
  styleImage: { ...StyleSheet.absoluteFill },
  styleOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Brand.espresso,
    opacity: 0.38,
  },
  styleOverlaySelected: { opacity: 0.22 },
  checkBadge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  styleName: { ...Typography.labelLarge, color: Brand.ivory, fontWeight: '600' },
  styleTags: { flexDirection: 'row', gap: Spacing.one },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.full,
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
  },
  tagText: { ...Typography.labelSmall, color: Brand.ivory },
  ctaBar: {
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
