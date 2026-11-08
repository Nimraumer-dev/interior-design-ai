import { GLView } from 'expo-gl';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as THREE from 'three';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Brand, Fonts, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useTheme } from '@/hooks/use-theme';
import { useDesignStore } from '@/stores/design-store';

type IconDef = { ios: string; android: string; web: string };

const FEATURES: { icon: IconDef; label: string }[] = [
  { icon: { ios: 'move.3d', android: 'open_with', web: 'open_with' }, label: 'Drag to rotate the room' },
  { icon: { ios: 'arrow.up.left.and.arrow.down.right', android: 'zoom_out_map', web: 'zoom_out_map' }, label: 'Use the zoom controls to inspect details' },
  { icon: { ios: 'hand.tap', android: 'touch_app', web: 'touch_app' }, label: 'Simple room composition with furniture and lighting' },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function Preview3DScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { contentStyle, isDesktop } = useResponsiveLayout();
  const { resultId } = useLocalSearchParams<{ resultId?: string }>();
  const design = useDesignStore(state => state.designs.find(item => item.id === resultId));
  const useNative3D = Platform.OS !== 'web';
  const [sceneFallback, setSceneFallback] = useState(!useNative3D);
  const [sceneReady, setSceneReady] = useState(false);
  const cameraStateRef = useRef({ yaw: -1.1, pitch: 0.42, distance: 7.5 });
  const roomRef = useRef<THREE.Group | null>(null);
  const animationRef = useRef<number | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => () => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    rendererRef.current?.dispose();
    rendererRef.current = null;
    roomRef.current = null;
  }, []);

  const resetView = useCallback(() => {
    cameraStateRef.current = { yaw: -1.1, pitch: 0.42, distance: 7.5 };
  }, []);

  const zoomCamera = useCallback((direction: 1 | -1) => {
    cameraStateRef.current.distance = clamp(
      cameraStateRef.current.distance + direction * 0.8,
      4,
      12,
    );
  }, []);

  // PanResponder reads these refs only from deferred gesture callbacks.
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() =>
    PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
          cameraStateRef.current.yaw -= gesture.dx * 0.008;
          cameraStateRef.current.pitch = clamp(
            cameraStateRef.current.pitch - gesture.dy * 0.004,
            -0.8,
            0.9,
          );
        },
      }),
  );

  const onContextCreate = useCallback((gl: any) => {
    try {
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;

      const renderer = new THREE.WebGLRenderer({
        canvas: gl.canvas,
        context: gl,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      } as any);
      renderer.setPixelRatio(Math.min(2, 1.6));
      renderer.setSize(width, height);
      renderer.setClearColor(new THREE.Color('#F8F5EF'), 0);
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.set(
        Math.sin(cameraStateRef.current.yaw) * cameraStateRef.current.distance,
        2.8 + cameraStateRef.current.pitch,
        Math.cos(cameraStateRef.current.yaw) * cameraStateRef.current.distance,
      );
      camera.lookAt(0, 1.2, 0);

      const ambient = new THREE.HemisphereLight('#F8F5EF', '#403329', 1.4);
      scene.add(ambient);

      const keyLight = new THREE.DirectionalLight('#F4E7D1', 1.4);
      keyLight.position.set(4, 7, 3);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight('#D9C4AA', 0.8);
      fillLight.position.set(-5, 5, -3);
      scene.add(fillLight);

      const room = new THREE.Group();

      const floorMaterial = new THREE.MeshStandardMaterial({
        color: '#E7DED2',
        roughness: 0.9,
        metalness: 0.08,
      });
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: '#F1EBE1',
        roughness: 0.95,
        metalness: 0.04,
      });
      const accentMaterial = new THREE.MeshStandardMaterial({
        color: '#B69A70',
        roughness: 0.7,
        metalness: 0.26,
      });
      const deepMaterial = new THREE.MeshStandardMaterial({
        color: '#403329',
        roughness: 0.8,
        metalness: 0.2,
      });

      const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.35, 8), floorMaterial);
      floor.position.y = -0.2;
      room.add(floor);

      const rug = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.06, 4.2), new THREE.MeshStandardMaterial({
        color: '#E4D5BD',
        roughness: 0.9,
        metalness: 0.08,
      }));
      rug.position.set(0, 0.04, 0.2);
      room.add(rug);

      const wallBack = new THREE.Mesh(new THREE.BoxGeometry(8, 3.2, 0.18), wallMaterial);
      wallBack.position.set(0, 1.6, -3.9);
      room.add(wallBack);

      const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 8), wallMaterial);
      wallLeft.position.set(-3.9, 1.6, 0);
      room.add(wallLeft);

      const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 8), wallMaterial);
      wallRight.position.set(3.9, 1.6, 0);
      room.add(wallRight);

      const sofa = new THREE.Group();
      const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 1.2), deepMaterial);
      sofaBase.position.y = 0.45;
      sofa.add(sofaBase);
      const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.9, 0.35), accentMaterial);
      sofaBack.position.set(0, 0.95, -0.4);
      sofa.add(sofaBack);
      sofa.position.set(-0.6, 0, 0.4);
      room.add(sofa);

      const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 0.9), accentMaterial);
      coffeeTable.position.set(0.8, 0.35, 0.8);
      room.add(coffeeTable);

      const tableLeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.1), deepMaterial);
      tableLeg1.position.set(0.2, 0.1, 0.2);
      room.add(tableLeg1);
      const tableLeg2 = tableLeg1.clone();
      tableLeg2.position.set(1.4, 0.1, 0.2);
      room.add(tableLeg2);
      const tableLeg3 = tableLeg1.clone();
      tableLeg3.position.set(0.2, 0.1, 1.3);
      room.add(tableLeg3);
      const tableLeg4 = tableLeg1.clone();
      tableLeg4.position.set(1.4, 0.1, 1.3);
      room.add(tableLeg4);

      const chair = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.8), new THREE.MeshStandardMaterial({
        color: '#F8F5EF',
        roughness: 0.9,
      }));
      seat.position.y = 0.6;
      chair.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.15), new THREE.MeshStandardMaterial({
        color: '#E7DED2',
        roughness: 0.92,
      }));
      back.position.set(0, 1.0, -0.32);
      chair.add(back);
      chair.position.set(2.2, 0, 0.8);
      room.add(chair);

      const chair2 = chair.clone();
      chair2.position.set(2.2, 0, -1.6);
      room.add(chair2);

      const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.38, 20), accentMaterial);
      lampBase.position.set(-2.2, 0.2, 1.75);
      room.add(lampBase);
      const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.7, 20), new THREE.MeshStandardMaterial({
        color: '#F1EBE1',
        emissive: '#E7D0A0',
        emissiveIntensity: 0.2,
      }));
      lampShade.position.set(-2.2, 0.9, 1.75);
      room.add(lampShade);

      roomRef.current = room;
      scene.add(room);

      const renderLoop = () => {
        const { yaw, pitch, distance } = cameraStateRef.current;
        camera.position.set(
          Math.sin(yaw) * distance,
          2.5 + pitch,
          Math.cos(yaw) * distance,
        );
        camera.lookAt(0, 1.1, 0);

        if (roomRef.current) {
          roomRef.current.rotation.y += 0.003;
        }

        renderer.render(scene, camera);
        gl.endFrameEXP();
        animationRef.current = requestAnimationFrame(renderLoop);
      };

      renderLoop();
      setSceneReady(true);
    } catch (error) {
      console.warn('3D preview unavailable:', error);
      setSceneFallback(true);
    }
  }, []);

  if (!design) {
    return (
      <View style={[styles.root, styles.emptyResult, { paddingTop: insets.top, backgroundColor: theme.ivory }]}>
        <Text style={[styles.emptyTitle, { color: theme.espresso }]}>Design unavailable</Text>
        <Text style={[styles.emptyBody, { color: theme.taupe }]}>This design may have been deleted from this device.</Text>
        <Button label="Go to My Designs" onPress={() => router.replace('/(tabs)/designs')} />
      </View>
    );
  }

  const previewContent = sceneFallback || !useNative3D ? (
    <View style={[styles.previewArea, isDesktop && styles.previewAreaDesktop]}>
      <Image source={{ uri: design.generatedImageUrl }} style={styles.previewImage} contentFit="cover" />
      <View style={styles.previewOverlay} />
      <View style={styles.badge}>
        <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={14} tintColor={Brand.gold} weight="light" />
        <Text style={styles.badgeText}>{useNative3D ? 'Fallback View' : '3D unavailable on this platform'}</Text>
      </View>
    </View>
  ) : (
    <View style={[styles.previewArea, isDesktop && styles.previewAreaDesktop, styles.glSurface]} {...panResponder.panHandlers}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
      <View style={styles.previewOverlay} pointerEvents="none" />
      <View style={styles.badge}>
        <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={14} tintColor={Brand.gold} weight="light" />
        <Text style={styles.badgeText}>{sceneReady ? 'Live 3D' : 'Loading 3D'}</Text>
      </View>
      <View style={styles.controls} pointerEvents="box-none">
        <Pressable style={styles.controlBtn} onPress={() => zoomCamera(-1)} accessibilityLabel="Zoom out">
          <Icon ios="minus" android="remove" web="remove" size={18} color={Brand.ivory} />
        </Pressable>
        <Pressable style={styles.controlBtn} onPress={() => zoomCamera(1)} accessibilityLabel="Zoom in">
          <Icon ios="plus" android="add" web="add" size={18} color={Brand.ivory} />
        </Pressable>
        <Pressable style={styles.controlBtn} onPress={resetView} accessibilityLabel="Reset camera">
          <Icon ios="arrow.counterclockwise" android="restart_alt" web="restart_alt" size={18} color={Brand.ivory} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: theme.ivory }]}>
      <View style={[styles.topBar, contentStyle, { borderBottomColor: theme.border }]}>
        <Pressable style={[styles.iconBtn, { backgroundColor: theme.beige }]} onPress={() => router.back()} accessibilityLabel="Go back">
          <SymbolView name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }} size={18} tintColor={theme.espresso} weight="light" />
        </Pressable>
        <Text style={[styles.topTitle, { color: theme.espresso }]}>3D Preview</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={[styles.previewContainer, contentStyle]}>
        {previewContent}
      </View>

      <ScrollView style={[styles.info, contentStyle, isDesktop && styles.infoDesktop]} contentContainerStyle={{ gap: Spacing.three, paddingBottom: insets.bottom + 120 }}>
        <Text style={[styles.heading, { color: theme.espresso }]}>Immersive 3D Walkthrough</Text>
        <Text style={[styles.body, { color: theme.taupe }]}>
          Explore the room using drag-to-rotate controls and zoom buttons. This preview uses a native 3D scene when available, and falls back gracefully if the environment cannot support OpenGL.
        </Text>
        <Text style={[styles.body, { color: theme.taupe }]}>
          Demo scene only — it is not generated from this design. Real 3D assets and a WebView fallback are pending integration.
        </Text>

        <View style={[styles.featureList, { backgroundColor: theme.surfaceElevated }]}>
          {FEATURES.filter(feature => !(sceneFallback || !useNative3D) || !feature.label.includes('zoom controls')).map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Icon ios={f.icon.ios} android={f.icon.android} web={f.icon.web} size={16} color={Brand.gold} />
              <Text style={[styles.featureText, { color: theme.espresso }]}>{f.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.cta, contentStyle, { paddingBottom: insets.bottom + Spacing.three, backgroundColor: theme.ivory, borderTopColor: theme.border }]}>
        <Button label={sceneFallback ? 'Back to Result' : 'Ready to Review'} onPress={() => router.back()} fullWidth size="lg" />
        <Button label="Back to Result" variant="secondary" onPress={() => router.back()} fullWidth size="md" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.ivory },
  emptyResult: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.four, gap: Spacing.three },
  emptyTitle: { ...Typography.headingMedium, color: Brand.espresso, textAlign: 'center' },
  emptyBody: { ...Typography.bodyMedium, color: Brand.taupe, textAlign: 'center' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.two,
    borderBottomWidth: 1, borderBottomColor: Brand.beige,
  },
  iconBtn: { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Brand.beige, alignItems: 'center', justifyContent: 'center' },
  topTitle: { ...Typography.labelLarge, color: Brand.espresso, fontWeight: '600' },
  previewContainer: { width: '100%', alignSelf: 'center' },
  previewArea: { height: 280, position: 'relative' },
  previewAreaDesktop: { height: 500 },
  glSurface: { overflow: 'hidden', backgroundColor: '#F8F5EF' },
  glView: { flex: 1 },
  previewImage: { width: '100%', height: '100%' },
  previewOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(48, 37, 31, 0.18)',
    pointerEvents: 'none',
  },
  badge: {
    position: 'absolute', top: Spacing.three, right: Spacing.three,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.one,
    backgroundColor: 'rgba(48,37,31,0.8)', borderRadius: Radius.full,
    paddingVertical: Spacing.one, paddingHorizontal: Spacing.two,
    borderWidth: 1, borderColor: Brand.gold,
  },
  badgeText: { ...Typography.labelSmall, color: Brand.gold, letterSpacing: 1 },
  controls: {
    position: 'absolute', right: Spacing.three, bottom: Spacing.three,
    gap: Spacing.two,
  },
  controlBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: 'rgba(48,37,31,0.7)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(182,154,112,0.4)',
  },
  info: { flex: 1, padding: Spacing.four },
  infoDesktop: { paddingHorizontal: Spacing.six },
  heading: { fontSize: 24, fontWeight: '300', color: Brand.espresso, fontFamily: Fonts?.serif ?? 'serif' },
  body: { ...Typography.bodyMedium, color: Brand.taupe, lineHeight: 22 },
  featureList: {
    backgroundColor: Brand.white, borderRadius: Radius.lg, padding: Spacing.three,
    gap: Spacing.two, ...Shadow.soft,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  featureText: { ...Typography.bodyMedium, color: Brand.espresso },
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two,
    backgroundColor: Brand.ivory, borderTopWidth: 1, borderTopColor: Brand.beige,
    alignSelf: 'center',
    maxWidth: 720,
    width: '100%',
  },
});
