import { ObjectId } from 'mongodb';

export interface Collection {
  _id?: ObjectId;
  title: string;
  slug: string;
  description: string;
  image: string;
  meta?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Product {
  _id?: ObjectId;
  title: string;
  slug: string;
  sku: string;
  price: number; // in paisa
  currency: string; // "INR"
  collectionId: ObjectId | string;
  images: string[];
  description: string;
  specs?: {
    weight?: string;
    caseSize?: string;
    movement?: string;
    color?: string;
    [key: string]: any;
  };
  colors?: Array<{ name: string; hex: string; image?: string }>;
  stock: number;
  featured: boolean;
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItem {
  productId: ObjectId | string;
  title: string;
  price: number; // in paisa
  qty: number;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface PickupAddress {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Order {
  _id?: ObjectId;
  orderIdRazorpay?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  items: OrderItem[];
  amount: number; // total amount in paisa
  currency: string; // "INR"
  customer: Customer;
  status: 'pending' | 'paid' | 'confirmed' | 'shipped' | 'cancelled';
  // Shiprocket fields
  shiprocketShipmentId?: string;
  shiprocketOrderId?: string;
  awbCode?: string;
  courierName?: string;
  pickupScheduledDate?: Date;
  trackingUrl?: string;
  shippingStatus?: string;
  pickupAddress?: PickupAddress;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Admin {
  _id?: ObjectId;
  username: string;
  passwordHash: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

