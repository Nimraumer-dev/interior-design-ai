import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const textColor =
    variant === 'primary' ? theme.textOnAccent
    : variant === 'destructive' ? '#FFFFFF'
    : theme.text;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[size],
        fullWidth && styles.fullWidth,
        variant === 'primary' && { backgroundColor: theme.accent },
        variant === 'secondary' && { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        variant === 'destructive' && { backgroundColor: '#C0392B' },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.label, sizeLabel[size], { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    ...Shadow.soft,
  },
  sm: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.three },
  md: { paddingVertical: Spacing.two + 4, paddingHorizontal: Spacing.four },
  lg: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.five },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  label: { fontWeight: '600', letterSpacing: 0.3 },
});

const sizeLabel = StyleSheet.create({
  sm: { ...Typography.labelMedium },
  md: { ...Typography.labelLarge },
  lg: { ...Typography.bodyLarge, fontWeight: '600' },
});
