import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
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

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { signup, isLoading } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup() {
    setError(null);
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    const err = await signup({ displayName: displayName.trim(), email: email.trim(), password });
    if (err) {
      setError(err);
    } else {
      router.replace('/(tabs)');
    }
  }

  return (
    <View style={styles.root}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&q=85' }}
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
          {/* Back button */}
          <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>Create account</Text>
            <Text style={styles.subheading}>Join thousands of design enthusiasts</Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Full name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={Brand.taupe}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
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
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={Brand.taupe}
                  secureTextEntry={!passwordVisible}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
                <Pressable
                  onPress={() => setPasswordVisible(v => !v)}
                  style={styles.eyeBtn}
                  accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.eyeText}>{passwordVisible ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            {/* Terms */}
            <Text style={styles.terms}>
              By creating an account you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>

            <Button
              label="Create Account"
              onPress={handleSignup}
              loading={isLoading}
              fullWidth
              size="lg"
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable onPress={() => router.back()} style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Text style={styles.loginLink}>Sign in</Text>
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
    height: '40%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: Brand.espresso,
    opacity: 0.4,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  topBar: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  backText: {
    ...Typography.labelLarge,
    color: Brand.ivory,
    letterSpacing: 0.5,
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
  terms: {
    ...Typography.bodySmall,
    color: Brand.taupe,
    lineHeight: 18,
  },
  termsLink: {
    color: Brand.gold,
    fontWeight: '600',
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.one,
  },
  loginText: {
    ...Typography.bodyMedium,
    color: Brand.taupe,
  },
  loginLink: {
    ...Typography.bodyMedium,
    color: Brand.gold,
    fontWeight: '600',
  },
});
