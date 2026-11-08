const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const apiOrigin = (configuredApiUrl || 'http://localhost:5000').replace(/\/+$/, '');

export const Config = {
  apiBaseUrl: apiOrigin.endsWith('/api') ? apiOrigin : `${apiOrigin}/api`,
  generationPollingIntervalMs: 2000,
  generationTimeoutMs: 120_000,
  maxImageSizeBytes: 10 * 1024 * 1024, // 10 MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  features: {
    preview3d: false,
    furnitureShopping: false,
    socialSharing: false,
  },
} as const;
