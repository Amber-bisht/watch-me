export function formatPrice(amount: number): string {
  return `₹${(amount / 100).toFixed(2)}`;
}

export function getPlaceholderImage(): string {
  return 'https://via.placeholder.com/400x400?text=Watch+Image';
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

