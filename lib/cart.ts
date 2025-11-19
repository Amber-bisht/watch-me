'use client';

export interface CartItem {
  productId: string;
  title: string;
  price: number; // in paisa
  image: string;
  slug: string;
  qty: number;
}

const CART_STORAGE_KEY = 'watch-store-cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart:', error);
  }
}

export function addToCart(item: Omit<CartItem, 'qty'>): void {
  const cart = getCart();
  const existingItem = cart.find((i) => i.productId === item.productId);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }

  saveCart(cart);
}

export function removeFromCart(productId: string): void {
  const cart = getCart().filter((item) => item.productId !== productId);
  saveCart(cart);
}

export function updateCartItem(productId: string, qty: number): void {
  if (qty <= 0) {
    removeFromCart(productId);
    return;
  }

  const cart = getCart();
  const item = cart.find((i) => i.productId === productId);

  if (item) {
    item.qty = qty;
    saveCart(cart);
  }
}

export function clearCart(): void {
  saveCart([]);
}

export function getCartTotal(): number {
  return getCart().reduce((total, item) => total + item.price * item.qty, 0);
}

export function getCartItemCount(): number {
  return getCart().reduce((count, item) => count + item.qty, 0);
}

