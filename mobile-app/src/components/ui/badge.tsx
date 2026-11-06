import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const theme = useTheme();

  const bgColor: Record<BadgeVariant, string> = {
    default: theme.beige,
    accent: theme.accent,
    success: '#D4EDDA',
    warning: '#FFF3CD',
    error: '#F8D7DA',
  };

  const textColor: Record<BadgeVariant, string> = {
    default: theme.taupe,
    accent: theme.textOnAccent,
    success: '#155724',
    warning: '#856404',
    error: '#721C24',
  };

  if (variant === 'success' && theme.background === '#000000') {
    bgColor.success = '#24452F';
    textColor.success = '#BDE4C7';
  }
  if (variant === 'warning' && theme.background === '#000000') {
    bgColor.warning = '#4A3A1B';
    textColor.warning = '#F3D889';
  }
  if (variant === 'error' && theme.background === '#000000') {
    bgColor.error = '#4A2626';
    textColor.error = '#F4B8B8';
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor[variant] }]}>
      <Text style={[styles.label, { color: textColor[variant] }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.full,
  },
  label: {
    ...Typography.overline,
  },
});
