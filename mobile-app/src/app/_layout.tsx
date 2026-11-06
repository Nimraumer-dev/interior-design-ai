import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Appearance, useColorScheme, ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Button } from '@/components/ui/button';
import { Brand, Typography } from '@/constants/theme';
import { AuthProvider } from '@/hooks/use-auth';
import { useDesignStore } from '@/stores/design-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const appearancePreference = useDesignStore(state => state.appearancePreference);
  const hasHydrated = useDesignStore(state => state.hasHydrated);
  const hydrationError = useDesignStore(state => state.hydrationError);
  const setHydrationStatus = useDesignStore(state => state.setHydrationStatus);

  useEffect(() => {
    Appearance.setColorScheme(appearancePreference === 'system' ? 'auto' : appearancePreference);
  }, [appearancePreference]);

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
                    void useDesignStore.persist.rehydrate();
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
