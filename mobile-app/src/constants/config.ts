export const Config = {
  apiBaseUrl: 'https://api.interiordesign.app/v1',
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
