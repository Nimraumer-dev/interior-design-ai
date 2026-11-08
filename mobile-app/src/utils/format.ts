export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatDate(iso);
}

export function formatPrice(amount: number, currency: 'USD' | 'PKR' = 'USD'): string {
  return new Intl.NumberFormat(currency === 'PKR' ? 'en-PK' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function furniturePriceAmount(item: {
  priceUsd: number;
  pricePaisa?: number;
  currency?: 'USD' | 'PKR';
}): number {
  return item.currency === 'PKR' ? (item.pricePaisa ?? 0) / 100 : item.priceUsd;
}

export function furniturePriceLabel(item: {
  priceUsd: number;
  pricePaisa?: number;
  currency?: 'USD' | 'PKR';
}): string {
  return formatPrice(furniturePriceAmount(item), item.currency ?? 'USD');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function roomTypeLabel(roomType: string): string {
  return roomType.split('-').map(capitalize).join(' ');
}
