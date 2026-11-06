import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Spacing, Typography } from '@/constants/theme';

const { width } = Dimensions.get('window');

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
    body: 'Choose a room and explore a local sample redesign. AI-generated transformations are pending integration.',
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
    body: 'Explore sample furniture and estimated costs inspired by each look. Live retailer availability is pending integration.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: { index?: number | null; isViewable: boolean }[] }) => {
    if (viewableItems[0]?.index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  function handleNext() {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      router.replace('/(auth)/login');
    }
  }

  function handleSkip() {
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => <SlideItem slide={item} />}
      />

      {/* Bottom panel */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + Spacing.four }]}>
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

function SlideItem({ slide }: { slide: Slide }) {
  return (
    <View style={styles.slide}>
      {/* Full-bleed image */}
      <Image source={{ uri: slide.imageUrl }} style={styles.image} contentFit="cover" />

      {/* Dark gradient overlay */}
      <View style={styles.overlay} />

      {/* Text content */}
      <View style={styles.textContent}>
        <Text style={styles.overline}>{slide.overline.toUpperCase()}</Text>
        <Text style={styles.heading}>{slide.heading}</Text>
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
  slide: {
    width,
    flex: 1,
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
    bottom: 220,
    left: Spacing.four,
    right: Spacing.four,
    gap: Spacing.two,
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
  body: {
    ...Typography.bodyMedium,
    color: Brand.beige,
    opacity: 0.85,
    marginTop: Spacing.one,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
    backgroundColor: 'rgba(48,37,31,0.72)',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
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
