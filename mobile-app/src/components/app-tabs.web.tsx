import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, useColorScheme, useWindowDimensions, View, StyleSheet } from 'react-native';

import { Brand, Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  return (
    <Tabs>
      <TabSlot style={{ height: '100%', paddingTop: isDesktop ? 64 : 0 }} />
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
  const { width } = useWindowDimensions();
  const icon = TAB_ICONS[tabKey];
  const iconColor = isFocused ? Brand.espresso : Brand.taupe;

  return (
    <Pressable {...(props as any)} style={({ pressed }: { pressed: boolean }) => pressed && styles.pressed}>
      <View style={[styles.tabButtonView, width < 480 && styles.tabButtonViewCompact, isFocused && styles.tabButtonActive]}>
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View {...props} style={[
      styles.tabListContainer,
      isDesktop ? styles.desktopTabList : styles.mobileTabList,
      { backgroundColor: colors.ivory, borderBottomColor: colors.border },
    ]}>
      <View style={[styles.innerContainer, isDesktop && styles.desktopInnerContainer, { borderTopColor: colors.border }]}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  mobileTabList: {
    bottom: 0,
  },
  desktopTabList: {
    top: 0,
    height: 64,
    borderBottomWidth: 1,
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
  desktopInnerContainer: {
    maxWidth: 1280,
    minHeight: 64,
    borderTopWidth: 0,
    borderBottomWidth: 0,
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
  tabButtonViewCompact: { paddingHorizontal: Spacing.one },
  tabButtonActive: { backgroundColor: Brand.gold },
  activeLabel: { color: Brand.espresso, fontWeight: '600' },
});
