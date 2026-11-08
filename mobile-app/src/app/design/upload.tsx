import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlowHeader } from '@/components/design/flow-header';
import { Button } from '@/components/ui/button';
import { Brand, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useDesignStore } from '@/stores/design-store';

const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80',
  'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
  'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80',
];

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { contentStyle, columns, isTablet, isDesktop } = useResponsiveLayout();
  const selectedUri = useDesignStore(state => state.imageUri);
  const setImageUri = useDesignStore(state => state.setImageUri);
  const [isPicking, setIsPicking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function requestGalleryPermission() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Photo library access is required to choose a room image.');
        Alert.alert(
          'Permission needed',
          'Please allow access to your photos so you can continue.',
        );
        return false;
      }
      return true;
    } catch {
      setErrorMessage('The photo library permission could not be checked. Try again.');
      return false;
    }
  }

  async function requestCameraPermission() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Camera access is required to take a room photo.');
        Alert.alert(
          'Permission needed',
          'Please enable camera access so you can capture a room photo.',
        );
        return false;
      }
      return true;
    } catch {
      setErrorMessage('The camera permission could not be checked. Try again.');
      return false;
    }
  }

  async function shrinkImage(uri: string, width: number, height: number) {
    const saveOptions = { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG };
    const result = width >= height
      ? await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: Math.min(width, 1024) } }],
          saveOptions,
        )
      : await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { height: Math.min(height, 1024) } }],
          saveOptions,
        );
    return result.uri;
  }

  async function pickFromLibrary() {
    if (!(await requestGalleryPermission())) return;

    setIsPicking(true);
    setErrorMessage(null);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        setErrorMessage('No image was selected.');
        return;
      }

      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        setErrorMessage('The selected image could not be loaded. Please try again.');
        return;
      }

      const asset = result.assets[0];
      setImageUri(await shrinkImage(uri, asset.width, asset.height));
    } catch {
      setErrorMessage('Something went wrong while choosing your photo. Please try again.');
    } finally {
      setIsPicking(false);
    }
  }

  async function takePhoto() {
    if (!(await requestCameraPermission())) return;

    setIsPicking(true);
    setErrorMessage(null);

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        setErrorMessage('Camera was cancelled.');
        return;
      }

      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        setErrorMessage('No photo was captured. Please try again.');
        return;
      }

      const asset = result.assets[0];
      setImageUri(await shrinkImage(uri, asset.width, asset.height));
    } catch {
      setErrorMessage('The camera could not be opened. Please try again.');
    } finally {
      setIsPicking(false);
    }
  }

  function removePhoto() {
    setImageUri(null);
    setErrorMessage(null);
  }

  function handleContinue() {
    if (!selectedUri || !selectedUri.trim()) {
      setErrorMessage('Please choose or capture a valid room photo before continuing.');
      return;
    }

    router.push({
      pathname: '/design/choose-style',
    });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.three, backgroundColor: theme.ivory }]}>
      <FlowHeader
        title="Upload a Photo"
        subtitle="Take or choose a photo of your room."
        step={1}
        totalSteps={5}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[contentStyle, { paddingBottom: insets.bottom + 120 }]}
      >
        {selectedUri ? (
          <View style={[styles.previewSection, isDesktop && styles.previewSectionDesktop]}>
          <View style={[styles.previewCard, isDesktop && styles.previewCardDesktop, { borderColor: theme.border }]}>
              <Image source={{ uri: selectedUri }} style={styles.previewImage} contentFit="cover" />
              <View style={styles.previewOverlay} />
              <Text style={styles.previewLabel}>Selected Room Photo</Text>
            </View>

            <View style={[styles.selectionActions, isTablet && styles.selectionActionsTablet]}>
              <Pressable style={[styles.selectionButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]} onPress={takePhoto} disabled={isPicking}>
                <Text style={[styles.selectionButtonText, { color: theme.espresso }]}>Retake</Text>
              </Pressable>
              <Pressable style={[styles.selectionButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]} onPress={pickFromLibrary} disabled={isPicking}>
                <Text style={[styles.selectionButtonText, { color: theme.espresso }]}>Change Photo</Text>
              </Pressable>
              <Pressable style={[styles.selectionButton, styles.removeButton]} onPress={removePhoto}>
                <Text style={[styles.selectionButtonText, styles.removeText]}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.actionRow, isDesktop && styles.actionRowDesktop]}>
            <Pressable style={[styles.actionCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]} onPress={takePhoto} disabled={isPicking}>
              <View style={styles.actionIconWrap}>
                {isPicking ? (
                  <ActivityIndicator color={Brand.gold} />
                ) : (
                <SymbolView
                  name={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }}
                  size={28}
                  tintColor={Brand.gold}
                  weight="light"
                />
                )}
              </View>
              <Text style={[styles.actionLabel, { color: theme.espresso }]}>{isPicking ? 'Preparing photo…' : 'Take Photo'}</Text>
              <Text style={[styles.actionSub, { color: theme.taupe }]}>Use your camera</Text>
            </Pressable>

            <Pressable style={[styles.actionCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]} onPress={pickFromLibrary} disabled={isPicking}>
              <View style={styles.actionIconWrap}>
                {isPicking ? (
                  <ActivityIndicator color={Brand.gold} />
                ) : (
                <SymbolView
                  name={{ ios: 'photo.on.rectangle', android: 'photo_library', web: 'photo_library' }}
                  size={28}
                  tintColor={Brand.gold}
                  weight="light"
                />
                )}
              </View>
              <Text style={[styles.actionLabel, { color: theme.espresso }]}>{isPicking ? 'Preparing photo…' : 'Choose Photo'}</Text>
              <Text style={[styles.actionSub, { color: theme.taupe }]}>From your gallery</Text>
            </Pressable>
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={[styles.tipsCard, isDesktop && styles.centeredSection, { backgroundColor: theme.cream }]}>
          <View style={styles.tipsHeader}>
            <SymbolView
              name={{ ios: 'lightbulb', android: 'lightbulb', web: 'lightbulb' }}
              size={14}
              tintColor={Brand.gold}
              weight="light"
            />
            <Text style={[styles.tipsTitle, { color: theme.espresso }]}>Photo Tips</Text>
          </View>
          {[
            'Shoot from a corner to capture the full room',
            'Use natural daylight for best results',
            'Keep the camera level and steady',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={[styles.tipText, { color: theme.taupe }]}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.walnut }]}>Or select a sample room</Text>
        </View>

        <View style={[styles.photoGrid, isDesktop && styles.photoGridDesktop]}>
          {MOCK_PHOTOS.map(uri => (
            <Pressable
              key={uri}
              style={[styles.photoThumb, { width: `${100 / columns - 2}%` }, selectedUri === uri && styles.photoThumbSelected]}
              onPress={() => {
                setErrorMessage(null);
                setImageUri(uri);
              }}
            >
              <Image source={{ uri }} style={styles.photoImg} contentFit="cover" />
              {selectedUri === uri && (
                <View style={styles.photoCheck}>
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={14}
                    tintColor={Brand.white}
                    weight="bold"
                  />
                </View>
              )}
            </Pressable>
          ))}
        </View>
        <Text style={[styles.demoNote, { color: theme.taupe }]}>
        Photos are prepared on this device for preview and uploaded for AI generation.
        </Text>
      </ScrollView>

      <View style={[styles.cta, contentStyle, { paddingBottom: insets.bottom + Spacing.three, backgroundColor: theme.ivory, borderTopColor: theme.border }]}>
        <Button
          label={selectedUri ? 'Continue with this Photo' : 'Select a Photo to Continue'}
          onPress={handleContinue}
          loading={isPicking}
          disabled={!selectedUri || isPicking}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ivory },
  previewSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  previewSectionDesktop: { maxWidth: 960, width: '100%', alignSelf: 'center' },
  previewCard: {
    position: 'relative',
    height: 260,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Brand.beige,
    ...Shadow.soft,
  },
  previewCardDesktop: { height: 480, aspectRatio: 16 / 9, alignSelf: 'center', width: '100%' },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(48, 37, 31, 0.18)',
  },
  previewLabel: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.three,
    ...Typography.labelLarge,
    color: Brand.white,
    backgroundColor: 'rgba(48, 37, 31, 0.55)',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  selectionActionsTablet: { justifyContent: 'center' },
  selectionButton: {
    flex: 1,
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.beige,
  },
  selectionButtonText: {
    ...Typography.labelLarge,
    color: Brand.espresso,
    fontWeight: '600',
  },
  removeButton: { backgroundColor: Brand.cream },
  removeText: { color: Brand.walnut },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  actionRowDesktop: { maxWidth: 820, width: '100%', alignSelf: 'center', paddingTop: Spacing.five },
  actionCard: {
    flex: 1,
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: Brand.beige,
    ...Shadow.soft,
  },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Brand.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { ...Typography.labelLarge, color: Brand.espresso, fontWeight: '600' },
  actionSub: { ...Typography.bodySmall, color: Brand.taupe },
  errorCard: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#F5C2B8',
    borderRadius: Radius.md,
    padding: Spacing.two,
  },
  errorText: {
    ...Typography.bodyMedium,
    color: '#A33B2E',
  },
  tipsCard: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    backgroundColor: Brand.cream,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  centeredSection: { maxWidth: 820, width: '100%', alignSelf: 'center' },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  tipsTitle: { ...Typography.labelLarge, color: Brand.espresso },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  tipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.gold,
    marginTop: 7,
  },
  tipText: { ...Typography.bodySmall, color: Brand.taupe, flex: 1 },
  sectionHeader: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  sectionTitle: { ...Typography.labelLarge, color: Brand.walnut, textTransform: 'uppercase', letterSpacing: 1 },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  photoGridDesktop: { maxWidth: 1100, width: '100%', alignSelf: 'center' },
  demoNote: {
    ...Typography.bodySmall,
    color: Brand.taupe,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    textAlign: 'center',
  },
  photoThumb: {
    aspectRatio: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadow.soft,
  },
  photoThumbSelected: { borderColor: Brand.gold },
  photoImg: { width: '100%', height: '100%' },
  photoCheck: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    backgroundColor: Brand.ivory,
    borderTopWidth: 1,
    borderTopColor: Brand.beige,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
});
