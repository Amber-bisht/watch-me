import { ObjectId } from 'mongodb';

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

/**
 * Serializes MongoDB documents to plain JavaScript objects
 * Converts ObjectId instances to strings and Date instances to ISO strings
 * This is required when passing data from Server Components to Client Components in Next.js
 */
export function serializeDocument<T>(doc: T): T {
  if (doc === null || doc === undefined) {
    return doc;
  }

  // Handle ObjectId instances (check multiple ways for robustness)
  if (
    doc instanceof ObjectId ||
    (typeof doc === 'object' && doc !== null && 'constructor' in doc && doc.constructor.name === 'ObjectId')
  ) {
    return (doc as unknown as ObjectId).toString() as unknown as T;
  }

  // Handle Date instances
  if (doc instanceof Date) {
    return doc.toISOString() as unknown as T;
  }

  // Handle arrays
  if (Array.isArray(doc)) {
    return doc.map((item) => serializeDocument(item)) as unknown as T;
  }

  // Handle plain objects (but not ObjectId or Date which are objects too)
  if (typeof doc === 'object' && doc.constructor === Object) {
    const serialized: Record<string, any> = {};
    for (const [key, value] of Object.entries(doc)) {
      serialized[key] = serializeDocument(value);
    }
    return serialized as T;
  }

  // Return primitives and other types as-is
  return doc;
}

