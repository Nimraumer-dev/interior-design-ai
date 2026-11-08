import { SymbolView, type AndroidSymbol, type SFSymbol, type SymbolWeight } from 'expo-symbols';
import type { ColorValue } from 'react-native';

export interface IconProps {
  ios: string;
  android?: string;
  web?: string;
  size?: number;
  color?: ColorValue;
  weight?: SymbolWeight;
}

/**
 * Thin wrapper around SymbolView that accepts plain strings for icon names.
 * Casts internally to satisfy expo-symbols' strict SFSymbol / AndroidSymbol enums.
 */
export function Icon({ ios, android, web, size = 20, color, weight = 'light' }: IconProps) {
  const name =
    android || web
      ? {
          ios: ios as SFSymbol,
          android: (android ?? web) as AndroidSymbol,
          web: (web ?? android) as AndroidSymbol,
        }
      : (ios as SFSymbol);

  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      weight={weight}
    />
  );
}
