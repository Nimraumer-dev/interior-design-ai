import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { createDesign, DesignGenerationError, mapApiDesign, waitForDesign } from '@/services/design-api';
import { persistDesignOriginalImage } from '@/services/local-design-images';
import { useDesignStore } from '@/stores/design-store';

function createIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export default function LoadingScreen() {
  const insets = useSafeAreaInsets();
  const { contentStyle } = useResponsiveLayout();
  const roomType = useDesignStore(state => state.roomType);
  const styleId = useDesignStore(state => state.styleId);
  const budgetTier = useDesignStore(state => state.budgetTier);
  const imageUri = useDesignStore(state => state.imageUri);
  const addDesign = useDesignStore(state => state.addDesign);
  const idempotencyKey = useRef(createIdempotencyKey());
  const persistedImageUri = useRef<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<{
    requestKey: string;
    message: string;
    canStartNewRequest: boolean;
  } | null>(null);

  const canCreateDesign = Boolean(roomType && styleId && budgetTier && imageUri);
  const requestKey = `${roomType ?? ''}:${styleId ?? ''}:${budgetTier ?? ''}:${imageUri ?? ''}:${attempt}`;
  const errorMessage = failure?.requestKey === requestKey ? failure.message : null;
  const setupError = canCreateDesign
    ? null
    : 'Choose a room, style, budget, and photo before generating a design.';
  const visibleError = errorMessage ?? setupError;
  const isLoading = canCreateDesign && !errorMessage;

  useEffect(() => {
    if (!roomType || !styleId || !budgetTier || !imageUri) return;

    const controller = new AbortController();

    void (async () => {
      try {
        persistedImageUri.current ??= await persistDesignOriginalImage(imageUri);
        const designId = await createDesign({
          roomType,
          styleId,
          budgetTier,
          imageUri: persistedImageUri.current,
          idempotencyKey: idempotencyKey.current,
          signal: controller.signal,
        });
        const completedDesign = await waitForDesign(designId, controller.signal);
        if (controller.signal.aborted) return;

        const design = mapApiDesign(completedDesign, undefined, persistedImageUri.current);
        addDesign(design);
        router.replace({ pathname: '/design/result', params: { resultId: design.id } });
      } catch (error) {
        if (!controller.signal.aborted) {
          setFailure({
            requestKey,
            message: error instanceof Error
              ? error.message
              : 'Design generation could not be completed.',
            canStartNewRequest: error instanceof DesignGenerationError && error.canStartNewRequest,
          });
        }
      }
    })();

    return () => controller.abort();
  }, [addDesign, attempt, budgetTier, imageUri, requestKey, roomType, styleId]);

  const setupPath = !roomType || !styleId
    ? '/(tabs)/generate'
    : !imageUri
      ? '/design/upload'
      : '/design/budget';

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.four }]}>
      <View style={styles.bgClip} pointerEvents="none">
        <View style={styles.bgPattern} />
      </View>

      <View style={[styles.content, contentStyle]}>
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

        <Text style={styles.heading}>{isLoading ? 'Creating Your Design' : 'Design Generation'}</Text>
        <Text style={styles.subheading}>
          {isLoading
            ? 'Your photo is being uploaded and the design worker is processing your request.'
            : 'Generation uses one available account credit when the result completes.'}
        </Text>

        {visibleError ? (
          <View style={styles.errorCard}>
            <SymbolView
              name={{ ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }}
              size={18}
              tintColor="#A33B2E"
            />
            <Text style={styles.errorText}>{visibleError}</Text>
          </View>
        ) : null}

        {visibleError && (
          <View style={styles.actions}>
            <Button
              label={canCreateDesign ? 'Retry Design Request' : 'Complete Setup'}
              onPress={() => {
                if (canCreateDesign) {
                  if (failure?.canStartNewRequest) idempotencyKey.current = createIdempotencyKey();
                  setAttempt(value => value + 1);
                }
                else router.replace(setupPath);
              }}
              fullWidth
            />
            <Button
              label="My Designs"
              variant="secondary"
              onPress={() => router.replace('/(tabs)/designs')}
              fullWidth
            />
          </View>
        )}
      </View>

      <View style={[styles.bottomNote, contentStyle]}>
        <SymbolView
          name={{ ios: 'info.circle', android: 'info', web: 'info' }}
          size={14}
          tintColor={Brand.taupe}
        />
        <Text style={styles.noteText}>Mock AI results are identified on the completed design.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.espresso, justifyContent: 'center' },
  bgClip: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
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
