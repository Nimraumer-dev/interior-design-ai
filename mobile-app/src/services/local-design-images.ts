import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const DESIGN_IMAGE_PREFIX = 'atelier-design-original-';

export async function persistDesignOriginalImage(uri: string): Promise<string> {
  if (Platform.OS === 'web' || !uri.startsWith('file://')) return uri;

  const fileName = `${DESIGN_IMAGE_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const destination = new File(Paths.document, fileName);
  await new File(uri).copy(destination);
  return destination.uri;
}

export async function deleteDesignOriginalImage(uri: string): Promise<void> {
  if (Platform.OS === 'web' || !uri.startsWith('file://')) return;
  const file = new File(uri);
  if (file.name.startsWith(DESIGN_IMAGE_PREFIX) && file.exists) {
    await file.delete();
  }
}
