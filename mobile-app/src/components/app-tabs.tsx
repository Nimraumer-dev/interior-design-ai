import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Brand, Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.ivory}
      indicatorColor={Brand.gold}
      labelStyle={{ selected: { color: Brand.gold }, default: { color: colors.taupe } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="house"
          md="home"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="generate">
        <NativeTabs.Trigger.Label>Generate</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="sparkles.rectangle.stack"
          md="auto_awesome_mosaic"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="designs">
        <NativeTabs.Trigger.Label>My Designs</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="house.lodge"
          md="home_repair_service"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="person.crop.circle"
          md="account_circle"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
