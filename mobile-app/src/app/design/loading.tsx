import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { createDemoDesign } from '@/services/demo-designs';
import { deleteDesignOriginalImage, persistDesignOriginalImage } from '@/services/local-design-images';
import { useDesignStore } from '@/stores/design-store';

const DEMO_PREPARATION_MS = 700;

export default function LoadingScreen() {
  const insets = useSafeAreaInsets();
  const roomType = useDesignStore(state => state.roomType);
  const styleId = useDesignStore(state => state.styleId);
  const budgetTier = useDesignStore(state => state.budgetTier);
  const imageUri = useDesignStore(state => state.imageUri);
  const addDesign = useDesignStore(state => state.addDesign);
  const [attempt, setAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canCreatePreview = Boolean(roomType && styleId && budgetTier && imageUri);

  useEffect(() => {
    if (!roomType || !styleId || !budgetTier || !imageUri) {
      setIsLoading(false);
      setErrorMessage('Choose a room, style, budget, and photo before opening a demo preview.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    let cancelled = false;
    const timeout = setTimeout(() => {
      void (async () => {
        let persistedImageUri: string | null = null;
        try {
          persistedImageUri = await persistDesignOriginalImage(imageUri);
          if (cancelled) {
            if (persistedImageUri !== imageUri) await deleteDesignOriginalImage(persistedImageUri);
            return;
          }
          const design = createDemoDesign({
            roomType,
            styleId,
            budgetTier,
            imageUri: persistedImageUri,
          });
          addDesign(design);
          setIsLoading(false);
          router.replace({ pathname: '/design/result', params: { resultId: design.id } });
        } catch (error) {
          setIsLoading(false);
          setErrorMessage(
            error instanceof Error ? error.message : 'The demo preview could not be prepared.',
          );
        }
      })();
    }, DEMO_PREPARATION_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [addDesign, attempt, budgetTier, imageUri, roomType, styleId]);

  const setupPath = !roomType || !styleId
    ? '/(tabs)/generate'
    : !imageUri
      ? '/design/upload'
      : '/design/budget';

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.four }]}>
      <View style={styles.bgPattern} />

      <View style={styles.content}>
        <View style={styles.ringOuter}>
          <View style={styles.ringInner}>
            {isLoading ? (
              <ActivityIndicator size="large" color={Brand.gold} />
            ) : (
              <SymbolView
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                size={38}
                tintColor={Brand.gold}
                weight="light"
              />
            )}
          </View>
        </View>

        <Text style={styles.heading}>
          {isLoading ? 'Preparing Your Demo Preview' : 'Demo Preview'}
        </Text>
        <Text style={styles.subheading}>
          {isLoading
            ? 'Saving your selections and preparing sample content on this device.'
            : 'No AI request is made. This preview uses sample design and furniture data.'}
        </Text>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <SymbolView
              name={{ ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }}
              size={18}
              tintColor="#A33B2E"
            />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {errorMessage && (
          <View style={styles.actions}>
            <Button
              label={canCreatePreview ? 'Retry Demo Preview' : 'Complete Setup'}
              onPress={() => {
                if (canCreatePreview) setAttempt(value => value + 1);
                else router.replace(setupPath);
              }}
              fullWidth
            />
            <Button
              label="Back"
              variant="secondary"
              onPress={() => router.back()}
              fullWidth
            />
          </View>
        )}
      </View>

      <View style={styles.bottomNote}>
        <SymbolView
          name={{ ios: 'info.circle', android: 'info', web: 'info' }}
          size={14}
          tintColor={Brand.taupe}
        />
        <Text style={styles.noteText}>AI generation and cloud upload are pending integration.</Text>
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    width: '100%',
    padding: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: '#FDECEA',
  },
  errorText: { ...Typography.bodySmall, color: '#A33B2E', flex: 1 },
  actions: { width: '100%', gap: Spacing.two },
  bottomNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  noteText: { ...Typography.bodySmall, color: Brand.taupe, textAlign: 'center' },
});
