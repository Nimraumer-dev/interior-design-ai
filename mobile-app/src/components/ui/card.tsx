import { Pressable, StyleSheet, View, type PressableProps, type ViewProps } from 'react-native';

import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CardVariant = 'elevated' | 'flat' | 'outlined';

interface BaseCardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  padding?: number;
}

type CardProps =
  | (BaseCardProps & PressableProps & { onPress: () => void })
  | (BaseCardProps & ViewProps & { onPress?: never });

export function Card({ variant = 'elevated', children, padding, onPress, ...rest }: CardProps & { onPress?: () => void }) {
  const theme = useTheme();

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.base,
          { padding: padding ?? Spacing.three, backgroundColor: theme.surfaceElevated },
          variant === 'elevated' && Shadow.soft,
          variant === 'outlined' && { borderWidth: 1, borderColor: theme.border },
          pressed && styles.pressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        {...(rest as PressableProps)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.base,
        { padding: padding ?? Spacing.three, backgroundColor: theme.surfaceElevated },
        variant === 'elevated' && Shadow.soft,
        variant === 'outlined' && { borderWidth: 1, borderColor: theme.border },
      ]}
      {...(rest as ViewProps)}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
