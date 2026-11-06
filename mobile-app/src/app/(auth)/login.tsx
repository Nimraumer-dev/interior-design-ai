import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  async function handleLogin() {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    const err = await login({ email: email.trim(), password });
    if (err) {
      setError(err);
    } else {
      router.replace('/(tabs)');
    }
  }

  return (
    <View style={styles.root}>
      {/* Hero image */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=900&q=85' }}
        style={styles.heroImage}
        contentFit="cover"
      />
      <View style={styles.heroOverlay} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.four }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + Spacing.four }]}>
            <Text style={styles.wordmark}>ATELIER</Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: theme.ivory }]}>
            <Text style={[styles.heading, { color: theme.espresso }]}>Welcome back</Text>
            <Text style={[styles.subheading, { color: theme.taupe }]}>Demo sign-in only; real account services are pending integration.</Text>

            {/* Hint */}
            <View style={[styles.hintBox, { backgroundColor: theme.beige }]}>
              <Text style={[styles.hintText, { color: theme.taupe }]}>
                Demo: sophia@example.com · password123
              </Text>
            </View>

            {/* Error */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.walnut }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cream, color: theme.espresso, borderColor: theme.border }]}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Brand.taupe}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.walnut }]}>Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex, { backgroundColor: theme.cream, color: theme.espresso, borderColor: theme.border }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Brand.taupe}
                  secureTextEntry={!passwordVisible}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  onPress={() => setPasswordVisible(v => !v)}
                  style={styles.eyeBtn}
                  accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                >
                  <Text style={[styles.eyeText, { color: theme.taupe }]}>{passwordVisible ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            {/* Forgot */}
            <Pressable
              style={styles.forgotBtn}
              onPress={() =>
                Alert.alert(
                  'Password reset unavailable',
                  'Password reset will be available when account services are connected.',
                )
              }
            >
              <Text style={[styles.forgotText, { color: theme.gold }]}>Forgot password?</Text>
            </Pressable>

            <Button
              label="Sign In (Demo)"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.taupe }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            {/* Sign up link */}
            <Pressable onPress={() => router.push('/(auth)/signup')} style={styles.signupRow}>
              <Text style={[styles.signupText, { color: theme.taupe }]}>Don't have an account? </Text>
              <Text style={[styles.signupLink, { color: theme.gold }]}>Create one</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.espresso },
  flex: { flex: 1 },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: Brand.espresso,
    opacity: 0.45,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  header: {
    alignItems: 'center',
    paddingBottom: Spacing.six,
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '300',
    color: Brand.ivory,
    letterSpacing: 8,
    fontFamily: Fonts?.serif ?? 'serif',
  },
  card: {
    backgroundColor: Brand.ivory,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  heading: {
    fontSize: 28,
    fontWeight: '300',
    color: Brand.espresso,
    fontFamily: Fonts?.serif ?? 'serif',
    letterSpacing: 0.5,
  },
  subheading: {
    ...Typography.bodyMedium,
    color: Brand.taupe,
    marginTop: -Spacing.two,
  },
  hintBox: {
    backgroundColor: Brand.beige,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  hintText: {
    ...Typography.bodySmall,
    color: Brand.taupe,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.sm,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  errorText: {
    ...Typography.bodySmall,
    color: '#991B1B',
  },
  fieldGroup: { gap: Spacing.one },
  label: {
    ...Typography.labelMedium,
    color: Brand.walnut,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Brand.cream,
    borderRadius: Radius.md,
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
    ...Typography.bodyMedium,
    color: Brand.espresso,
    borderWidth: 1,
    borderColor: Brand.beige,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  inputFlex: { flex: 1 },
  eyeBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  eyeText: {
    ...Typography.labelMedium,
    color: Brand.taupe,
  },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -Spacing.two },
  forgotText: {
    ...Typography.labelMedium,
    color: Brand.gold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Brand.beige,
  },
  dividerText: {
    ...Typography.labelMedium,
    color: Brand.taupe,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.one,
  },
  signupText: {
    ...Typography.bodyMedium,
    color: Brand.taupe,
  },
  signupLink: {
    ...Typography.bodyMedium,
    color: Brand.gold,
    fontWeight: '600',
  },
});
