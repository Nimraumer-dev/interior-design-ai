import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

import { Brand, Fonts, Typography } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

const { height } = Dimensions.get('window');

export default function SplashScreen() {
  const { isAuthenticated } = useAuth();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dividerWidth = useRef(new Animated.Value(0)).current;
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;

  useEffect(() => {
    let redirectTimeout: ReturnType<typeof setTimeout> | undefined;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }),
      ]),
      Animated.timing(dividerWidth, { toValue: 48, duration: 500, useNativeDriver: false }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start(() => {
      redirectTimeout = setTimeout(() => {
        router.replace(isAuthenticatedRef.current ? '/(tabs)' : '/(auth)/onboarding');
      }, 1200);
    });

    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Warm gradient background via layered views */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      <Animated.View style={[styles.content, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        {/* Monogram mark */}
        <View style={styles.monogramRing}>
          <View style={styles.monogramInner}>
            <Animated.Text style={styles.monogram}>A</Animated.Text>
          </View>
        </View>

        <Animated.Text style={styles.wordmark}>ATELIERА</Animated.Text>

        <Animated.View style={[styles.divider, { width: dividerWidth }]} />

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          AI Interior Design
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.espresso,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgTop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Brand.walnut,
    opacity: 0.55,
    borderBottomLeftRadius: height * 0.6,
    borderBottomRightRadius: height * 0.6,
    top: -height * 0.25,
  },
  bgBottom: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Brand.espresso,
    top: height * 0.5,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  monogramRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  monogramInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(182,154,112,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogram: {
    fontSize: 36,
    fontWeight: '300',
    color: Brand.gold,
    fontFamily: Fonts?.serif ?? 'serif',
    letterSpacing: 2,
  },
  wordmark: {
    ...Typography.headingLarge,
    color: Brand.ivory,
    letterSpacing: 8,
    fontFamily: Fonts?.serif ?? 'serif',
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: Brand.gold,
    opacity: 0.6,
  },
  tagline: {
    ...Typography.labelMedium,
    color: Brand.gold,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
