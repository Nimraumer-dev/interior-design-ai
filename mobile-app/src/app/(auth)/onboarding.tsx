import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Spacing, Typography } from '@/constants/theme';

interface Slide {
  id: string;
  imageUrl: string;
  overline: string;
  heading: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=85',
    overline: 'Reimagine Your Space',
    heading: 'Design with\nArtificial Intelligence',
    body: 'Upload a room photo, choose your preferences, and generate a personalized redesign.',
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&q=85',
    overline: 'Curated Aesthetics',
    heading: 'Choose From\nPremium Styles',
    body: 'From warm minimalism to art deco grandeur — explore styles curated by world-class interior designers.',
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=85',
    overline: 'Shop the Look',
    heading: 'Bring Your Vision\nTo Life',
    body: 'Browse furniture picks and estimated costs based on your design recommendations.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const activeIndexRef = useRef(0);

  const onScroll = useCallback((event: { nativeEvent: { contentOffset: { x: number } } }) => {
    if (width > 0) {
      const nextIndex = Math.min(SLIDES.length - 1, Math.max(0, Math.round(event.nativeEvent.contentOffset.x / width)));
      activeIndexRef.current = nextIndex;
      setActiveIndex(current => current === nextIndex ? current : nextIndex);
    }
  }, [width]);

  function handleNext() {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (activeIndex + 1), animated: true });
    } else {
      router.replace('/(auth)/login');
    }
  }

  useEffect(() => {
    if (width > 0) scrollRef.current?.scrollTo({ x: width * activeIndexRef.current, animated: false });
  }, [width]);

  function handleSkip() {
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.slides}
        contentContainerStyle={styles.slidesContent}
        horizontal
        pagingEnabled
        snapToInterval={width || undefined}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map(slide => (
          <SlideItem key={slide.id} slide={slide} width={width} height={height} />
        ))}
      </ScrollView>

      {/* Bottom panel */}
      <View style={[styles.panel, {
        left: Math.max((width - 560) / 2, 0),
        right: Math.max((width - 560) / 2, 0),
        paddingBottom: insets.bottom + Spacing.four,
      }]}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <Button
          label={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          fullWidth
          size="lg"
        />

        {activeIndex < SLIDES.length - 1 && (
          <Pressable onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function SlideItem({ slide, width, height }: { slide: Slide; width: number; height: number }) {
  const isDesktop = width >= 1024;
  const compact = height < 680;

  return (
    <View style={[styles.slide, { width: width || '100%' }]}>
      {/* Full-bleed image */}
      <Image source={{ uri: slide.imageUrl }} style={styles.image} contentFit="cover" />

      {/* Dark gradient overlay */}
      <View style={styles.overlay} />

      {/* Text content */}
      <View style={[styles.textContent, {
        bottom: compact ? 190 : 220,
        maxWidth: isDesktop ? 760 : Math.max(0, width - Spacing.four * 2),
      }]}>
        <Text style={styles.overline}>{slide.overline.toUpperCase()}</Text>
        <Text style={[styles.heading, isDesktop && styles.headingDesktop]}>{slide.heading}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.espresso,
  },
  slides: { flex: 1 },
  slidesContent: { flexGrow: 1, height: '100%', alignItems: 'stretch' },
  slide: {
    height: '100%',
    flexShrink: 0,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Brand.espresso,
    opacity: 0.52,
  },
  textContent: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    maxWidth: 760,
    alignSelf: 'center',
    gap: Spacing.two,
    zIndex: 1,
  },
  overline: {
    ...Typography.overline,
    color: Brand.gold,
    letterSpacing: 3,
    marginBottom: Spacing.one,
  },
  heading: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '300',
    color: Brand.ivory,
    fontFamily: Fonts?.serif ?? 'serif',
  },
  headingDesktop: { fontSize: 52, lineHeight: 60 },
  body: {
    ...Typography.bodyMedium,
    color: Brand.beige,
    opacity: 0.85,
    marginTop: Spacing.one,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
    backgroundColor: 'rgba(48,37,31,0.72)',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxWidth: 560,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  dot: {
    height: 4,
    borderRadius: Radius.full,
  },
  dotActive: {
    width: 24,
    backgroundColor: Brand.gold,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Brand.taupe,
    opacity: 0.5,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  skipText: {
    ...Typography.labelLarge,
    color: Brand.taupe,
  },
});
