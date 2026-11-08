import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Appearance, Platform, useColorScheme, ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Button } from '@/components/ui/button';
import { Brand, Typography } from '@/constants/theme';
import { AuthProvider } from '@/hooks/use-auth';
import { useDesignStore } from '@/stores/design-store';

SplashScreen.preventAutoHideAsync();

function rehydrateDesignStore() {
  void useDesignStore.persist.rehydrate().catch(() => {
    useDesignStore.getState().setHydrationStatus(
      true,
      'Saved designs and preferences could not be loaded from this device. Retry to try again.',
    );
  });
}

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const appearancePreference = useDesignStore(state => state.appearancePreference);
  const colorScheme = appearancePreference === 'system' ? systemColorScheme : appearancePreference;
  const hasHydrated = useDesignStore(state => state.hasHydrated);
  const hydrationError = useDesignStore(state => state.hydrationError);
  const setHydrationStatus = useDesignStore(state => state.setHydrationStatus);

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.style.colorScheme = appearancePreference === 'system'
        ? 'light dark'
        : appearancePreference;
    } else {
      Appearance.setColorScheme(appearancePreference === 'system' ? 'auto' : appearancePreference);
    }
  }, [appearancePreference]);

  useEffect(() => {
    rehydrateDesignStore();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {!hasHydrated ? (
          <View style={[styles.hydration, { backgroundColor: colorScheme === 'dark' ? '#1C1814' : Brand.ivory }]}>
            <ActivityIndicator color={Brand.gold} />
            <Text style={styles.hydrationText}>Loading saved designs and preferences…</Text>
          </View>
        ) : (
          <>
            {hydrationError && (
              <View style={styles.hydrationError}>
                <Text style={styles.hydrationText}>{hydrationError}</Text>
                <Button
                  label="Retry"
                  size="sm"
                  onPress={() => {
                    setHydrationStatus(false, null);
                    rehydrateDesignStore();
                  }}
                />
              </View>
            )}
            <Slot />
          </>
        )}
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  hydration: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hydrationError: {
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4A2626',
  },
  hydrationText: { ...Typography.bodySmall, color: Brand.ivory, textAlign: 'center' },
});
