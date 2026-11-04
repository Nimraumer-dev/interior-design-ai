import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignCard } from '@/components/design/design-card';
import { Brand, Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { MOCK_DESIGNS } from '@/services/mock-data';
import { RoomType } from '@/types/design';

type FilterTab = 'all' | 'favorites' | RoomType;

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'favorites', label: 'Saved' },
  { id: 'living-room', label: 'Living Room' },
  { id: 'bedroom', label: 'Bedroom' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'home-office', label: 'Office' },
];

export default function DesignsScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [layout, setLayout] = useState<'grid' | 'row'>('grid');

  const filtered = MOCK_DESIGNS.filter(d => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'favorites') return d.isFavorite;
    return d.roomType === activeFilter;
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.overline}>YOUR COLLECTION</Text>
            <Text style={styles.heading}>My Designs</Text>
          </View>

          {/* Layout toggle */}
          <View style={styles.layoutToggle}>
            <Pressable
              style={[styles.toggleBtn, layout === 'grid' && styles.toggleBtnActive]}
              onPress={() => setLayout('grid')}
              accessibilityLabel="Grid view"
            >
              <SymbolView
                name={{ ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' }}
                size={16}
                tintColor={layout === 'grid' ? Brand.espresso : Brand.taupe}
                weight="light"
              />
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, layout === 'row' && styles.toggleBtnActive]}
              onPress={() => setLayout('row')}
              accessibilityLabel="List view"
            >
              <SymbolView
                name={{ ios: 'list.bullet', android: 'format_list_bulleted', web: 'format_list_bulleted' }}
                size={16}
                tintColor={layout === 'row' ? Brand.espresso : Brand.taupe}
                weight="light"
              />
            </Pressable>
          </View>
        </View>

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_TABS.map(tab => {
            const isActive = activeFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveFilter(tab.id)}
              >
                {tab.id === 'favorites' && (
                  <SymbolView
                    name={{ ios: 'heart', android: 'favorite', web: 'favorite' }}
                    size={11}
                    tintColor={isActive ? Brand.ivory : Brand.taupe}
                    weight="light"
                  />
                )}
                <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Results count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} design{filtered.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Designs list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          layout === 'grid' ? styles.gridContainer : styles.rowContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <SymbolView
                name={{ ios: 'house', android: 'home', web: 'home' }}
                size={48}
                tintColor={Brand.beige}
                weight="ultraLight"
              />
            </View>
            <Text style={styles.emptyTitle}>No designs yet</Text>
            <Text style={styles.emptyBody}>
              Your saved designs will appear here once you generate them.
            </Text>
          </View>
        ) : layout === 'grid' ? (
          <View style={styles.gridInner}>
            {filtered.map(design => (
              <View key={design.id} style={styles.gridItem}>
                <DesignCard design={design} layout="grid" onPress={() => {}} />
              </View>
            ))}
          </View>
        ) : (
          filtered.map(design => (
            <DesignCard key={design.id} design={design} layout="row" onPress={() => {}} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ivory },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Brand.beige,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  overline: { ...Typography.overline, color: Brand.gold, letterSpacing: 3 },
  heading: {
    fontSize: 28,
    fontWeight: '300',
    color: Brand.espresso,
    fontFamily: Fonts?.serif ?? 'serif',
  },
  layoutToggle: {
    flexDirection: 'row',
    gap: Spacing.one,
    backgroundColor: Brand.beige,
    borderRadius: Radius.sm,
    padding: 3,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: { backgroundColor: Brand.white },
  filterRow: { gap: Spacing.two, paddingRight: Spacing.two },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    backgroundColor: Brand.beige,
  },
  filterTabActive: { backgroundColor: Brand.espresso },
  filterLabel: { ...Typography.labelMedium, color: Brand.taupe },
  filterLabelActive: { color: Brand.ivory, fontWeight: '600' },
  countRow: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  countText: { ...Typography.bodySmall, color: Brand.taupe },
  gridContainer: { paddingHorizontal: Spacing.four },
  gridInner: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  gridItem: { width: '48%' },
  rowContainer: { paddingHorizontal: Spacing.four, gap: Spacing.two },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.six,
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  emptyIconWrap: { marginBottom: Spacing.two },
  emptyTitle: {
    ...Typography.headingSmall,
    color: Brand.espresso,
    fontFamily: Fonts?.serif ?? 'serif',
  },
  emptyBody: { ...Typography.bodyMedium, color: Brand.taupe, textAlign: 'center' },
});
