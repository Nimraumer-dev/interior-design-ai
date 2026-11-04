import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, useColorScheme, View, StyleSheet } from 'react-native';

import { Brand, Colors, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';

import { ThemedText } from './themed-text';

type TabIconName = { ios: string; android: string; web: string };

const TAB_ICONS: Record<string, TabIconName> = {
  Home: { ios: 'house', android: 'home', web: 'home' },
  Generate: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  'My Designs': { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
  Profile: { ios: 'person', android: 'person', web: 'person' },
};

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href={"/(tabs)/" as any} asChild>
            <TabButton tabKey="Home">Home</TabButton>
          </TabTrigger>
          <TabTrigger name="generate" href="/(tabs)/generate" asChild>
            <TabButton tabKey="Generate">Generate</TabButton>
          </TabTrigger>
          <TabTrigger name="designs" href="/(tabs)/designs" asChild>
            <TabButton tabKey="My Designs">My Designs</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/(tabs)/profile" asChild>
            <TabButton tabKey="Profile">Profile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

interface TabButtonProps extends TabTriggerSlotProps {
  tabKey: string;
}

export function TabButton({ children, isFocused, tabKey, ...props }: TabButtonProps) {
  const icon = TAB_ICONS[tabKey];
  const iconColor = isFocused ? Brand.espresso : Brand.taupe;

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Pressable {...(props as any)} style={({ pressed }: { pressed: boolean }) => pressed && styles.pressed}>
      <View style={[styles.tabButtonView, isFocused && styles.tabButtonActive]}>
        {icon && (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <SymbolView name={icon as any} size={16} tintColor={iconColor} weight="light" />
        )}
        <ThemedText
          type="small"
          themeColor={isFocused ? 'text' : 'textMuted'}
          style={isFocused && styles.activeLabel}
        >
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View {...props} style={[styles.tabListContainer, { backgroundColor: colors.ivory }]}>
      <View style={[styles.innerContainer, { borderTopColor: colors.border }]}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: MaxContentWidth,
    borderTopWidth: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  pressed: { opacity: 0.7 },
  tabButtonView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
  tabButtonActive: { backgroundColor: Brand.beige },
  activeLabel: { color: Brand.espresso, fontWeight: '600' },
});
