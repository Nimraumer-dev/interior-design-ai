import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressBar } from '@/components/ui/progress-bar';
import { Brand, Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { MOCK_DESIGNS } from '@/services/mock-data';

const STEPS = [
  'Analysing your room layout…',
  'Applying style preferences…',
  'Placing furniture intelligently…',
  'Refining lighting and textures…',
  'Finalising your design…',
];

const MOCK_RESULT_ID = MOCK_DESIGNS[0].id;
const TOTAL_DURATION_MS = 4000;
const STEP_INTERVAL_MS = TOTAL_DURATION_MS / STEPS.length;

export default function LoadingScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      // Fade out → update text → fade in
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        step += 1;
        if (step < STEPS.length) {
          setStepIndex(step);
          setProgress((step + 1) / STEPS.length);
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        }
      });
    }, STEP_INTERVAL_MS);

    // Kick off first progress tick
    setProgress(1 / STEPS.length);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      router.replace({ pathname: '/design/result', params: { ...params, resultId: MOCK_RESULT_ID } });
    }, TOTAL_DURATION_MS + 400);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Background image layer */}
      <View style={styles.bgPattern} />

      <View style={styles.content}>
        {/* Animated ring */}
        <View style={styles.ringOuter}>
          <View style={styles.ringInner}>
            <SymbolView
              name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
              size={40}
              tintColor={Brand.gold}
              weight="light"
            />
          </View>
        </View>

        <Text style={styles.heading}>Creating Your Design</Text>
        <Text style={styles.subheading}>Our AI is reimagining your space</Text>

        {/* Progress */}
        <View style={styles.progressWrap}>
          <ProgressBar progress={progress} height={6} animationDurationMs={600} />
          <View style={styles.progressLabels}>
            <Animated.Text style={[styles.stepText, { opacity: fadeAnim }]}>
              {STEPS[stepIndex]}
            </Animated.Text>
            <Text style={styles.pctText}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>

        {/* Step dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < stepIndex + 1 ? styles.dotDone : styles.dotPending,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom note */}
      <View style={[styles.bottomNote, { paddingBottom: insets.bottom + Spacing.four }]}>
        <SymbolView
          name={{ ios: 'lock.shield', android: 'security', web: 'security' }}
          size={13}
          tintColor={Brand.taupe}
          weight="light"
        />
        <Text style={styles.noteText}>Your photo is processed securely and never stored.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.espresso, justifyContent: 'center' },
  bgPattern: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Brand.walnut,
    opacity: 0.3,
    borderRadius: 999,
    transform: [{ scaleX: 2 }],
    top: '-20%',
    bottom: '40%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.four,
  },
  ringOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(182,154,112,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '300',
    color: Brand.ivory,
    fontFamily: Fonts?.serif ?? 'serif',
    textAlign: 'center',
  },
  subheading: { ...Typography.bodyMedium, color: Brand.taupe, textAlign: 'center' },
  progressWrap: { width: '100%', gap: Spacing.two },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepText: { ...Typography.bodySmall, color: Brand.beige, flex: 1 },
  pctText: { ...Typography.labelMedium, color: Brand.gold },
  dots: { flexDirection: 'row', gap: Spacing.one },
  dot: { width: 8, height: 4, borderRadius: Radius.full },
  dotDone: { backgroundColor: Brand.gold },
  dotPending: { backgroundColor: Brand.taupe, opacity: 0.4 },
  bottomNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  noteText: { ...Typography.bodySmall, color: Brand.taupe },
});
