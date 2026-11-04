import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ProgressBarProps {
  /** 0 – 1 */
  progress: number;
  height?: number;
  animationDurationMs?: number;
}

export function ProgressBar({ progress, height = 4, animationDurationMs = 400 }: ProgressBarProps) {
  const theme = useTheme();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(Math.max(progress, 0), 1), { duration: animationDurationMs });
  }, [progress, animationDurationMs, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={[styles.track, { height, backgroundColor: theme.beige, borderRadius: Radius.full }]}>
      <Animated.View
        style={[styles.fill, animatedStyle, { height, backgroundColor: theme.accent, borderRadius: Radius.full }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    marginVertical: Spacing.one,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
