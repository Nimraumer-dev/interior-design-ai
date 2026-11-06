import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, useColorScheme, View, StyleSheet } from 'react-native';

import { Brand, Colors, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';

import { ThemedText } from './themed-text';

type TabIconName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

const TAB_ICONS: Record<string, TabIconName> = {
  Home: { ios: 'house', android: 'home', web: 'home' },
  Generate: {
    ios: 'sparkles.rectangle.stack',
    android: 'auto_awesome_mosaic',
    web: 'auto_awesome_mosaic',
  },
  'My Designs': { ios: 'house.lodge', android: 'home_repair_service', web: 'home_repair_service' },
  Profile: {
    ios: 'person.crop.circle',
    android: 'account_circle',
    web: 'account_circle',
  },
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
          <SymbolView name={icon} size={20} tintColor={iconColor} weight="regular" />
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
  tabButtonActive: { backgroundColor: Brand.gold },
  activeLabel: { color: Brand.espresso, fontWeight: '600' },
});
