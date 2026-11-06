import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignCard } from '@/components/design/design-card';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDesignStore } from '@/stores/design-store';
import { RoomType, DesignResult } from '@/types/design';

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
  const theme = useTheme();
  const designs = useDesignStore(state => state.designs);
  const deleteDesign = useDesignStore(state => state.deleteDesign);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [layout, setLayout] = useState<'grid' | 'row'>('grid');
  const [deleteTarget, setDeleteTarget] = useState<DesignResult | null>(null);
  const filtered = designs.filter(d => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'favorites') return d.isFavorite;
    return d.roomType === activeFilter;
  });
  const emptyTitle = designs.length === 0
    ? 'No designs yet'
    : activeFilter === 'favorites'
      ? 'No saved designs'
      : 'No matching designs';
  const emptyBody = designs.length === 0
    ? 'Your local demo designs will appear here after you create one.'
    : activeFilter === 'favorites'
      ? 'Save a design with the heart button to find it here.'
      : 'Try another room filter or view your full collection.';

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: theme.ivory }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.overline}>YOUR COLLECTION</Text>
            <Text style={[styles.heading, { color: theme.espresso }]}>My Designs</Text>
          </View>

          {/* Layout toggle */}
          <View style={[styles.layoutToggle, { backgroundColor: theme.beige }]}>
            <Pressable
              style={[styles.toggleBtn, layout === 'grid' && { backgroundColor: theme.surfaceElevated }]}
              onPress={() => setLayout('grid')}
              accessibilityLabel="Grid view"
            >
              <SymbolView
                name={{ ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' }}
                size={16}
                tintColor={layout === 'grid' ? theme.espresso : theme.taupe}
                weight="light"
              />
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, layout === 'row' && { backgroundColor: theme.surfaceElevated }]}
              onPress={() => setLayout('row')}
              accessibilityLabel="List view"
            >
              <SymbolView
                name={{ ios: 'list.bullet', android: 'format_list_bulleted', web: 'format_list_bulleted' }}
                size={16}
                tintColor={layout === 'row' ? theme.espresso : theme.taupe}
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
                style={[
                  styles.filterTab,
                  { backgroundColor: isActive ? theme.accent : theme.beige },
                ]}
                onPress={() => setActiveFilter(tab.id)}
              >
                {tab.id === 'favorites' && (
                  <SymbolView
                    name={{ ios: 'heart', android: 'favorite', web: 'favorite' }}
                    size={11}
                    tintColor={isActive ? theme.textOnAccent : theme.taupe}
                    weight="light"
                  />
                )}
                <Text style={[
                  styles.filterLabel,
                  { color: isActive ? theme.textOnAccent : theme.taupe },
                  isActive && styles.filterLabelActive,
                ]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Results count */}
      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: theme.taupe }]}>
          {filtered.length} design{filtered.length !== 1 ? 's' : ''} · local collection
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
            <Text style={[styles.emptyTitle, { color: theme.espresso }]}>{emptyTitle}</Text>
            <Text style={[styles.emptyBody, { color: theme.taupe }]}>{emptyBody}</Text>
            {designs.length === 0 ? (
              <Button label="Create a Demo Design" onPress={() => router.push('/(tabs)/generate')} />
            ) : activeFilter !== 'all' ? (
              <Button label="Show All Designs" variant="secondary" onPress={() => setActiveFilter('all')} />
            ) : null}
          </View>
        ) : layout === 'grid' ? (
          <View style={styles.gridInner}>
            {filtered.map(design => (
              <View key={design.id} style={styles.gridItem}>
                <View style={styles.cardWrap}>
                  <DesignCard
                    design={design}
                    layout="grid"
                    onPress={() => router.push({ pathname: '/design/result', params: { resultId: design.id } })}
                  />
                  <Pressable
                    style={[styles.deleteButton, { backgroundColor: theme.surfaceElevated }]}
                    onPress={() => setDeleteTarget(design)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${design.title}`}
                  >
                    <SymbolView
                      name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                      size={15}
                      tintColor={theme.espresso}
                    />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          filtered.map(design => (
            <View key={design.id} style={styles.rowCardWrap}>
              <DesignCard
                design={design}
                layout="row"
                onPress={() => router.push({ pathname: '/design/result', params: { resultId: design.id } })}
              />
              <Pressable
                style={[styles.rowDeleteButton, { backgroundColor: theme.surfaceElevated }]}
                onPress={() => setDeleteTarget(design)}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${design.title}`}
              >
                <SymbolView
                  name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                  size={15}
                  tintColor={theme.espresso}
                />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={deleteTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surfaceElevated }]}>
            <Text style={[styles.modalTitle, { color: theme.espresso }]}>Delete this design?</Text>
            <Text style={[styles.modalBody, { color: theme.taupe }]}>
              {deleteTarget?.title} will be removed from this device. This cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <Button label="Cancel" variant="secondary" onPress={() => setDeleteTarget(null)} />
              <Button
                label="Delete"
                onPress={async () => {
                  try {
                    if (deleteTarget) await deleteDesign(deleteTarget.id);
                  } catch {
                    Alert.alert(
                      'Design removed',
                      'The design was removed, but its local photo could not be cleaned up.',
                    );
                  }
                  setDeleteTarget(null);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  cardWrap: { position: 'relative' },
  deleteButton: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.ivory,
  },
  rowContainer: { paddingHorizontal: Spacing.four, gap: Spacing.two },
  rowCardWrap: { position: 'relative' },
  rowDeleteButton: {
    position: 'absolute',
    right: Spacing.two,
    top: Spacing.two,
    padding: Spacing.one,
    borderRadius: Radius.full,
    backgroundColor: Brand.ivory,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(48,37,31,0.55)',
  },
  modalCard: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.xl,
    backgroundColor: Brand.ivory,
  },
  modalTitle: { ...Typography.headingSmall, color: Brand.espresso, fontFamily: Fonts?.serif ?? 'serif' },
  modalBody: { ...Typography.bodyMedium, color: Brand.taupe },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
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
