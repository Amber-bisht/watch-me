# Watch Store - Next.js E-commerce Application

A full-stack watch e-commerce site built with Next.js 15.5.3, MongoDB, and Razorpay payment integration.

## Features

- 🛍️ **Product Catalog**: Browse watches by collections with SSG (Static Site Generation)
- 🛒 **Shopping Cart**: Add/remove items, update quantities
- 💳 **Secure Payments**: Razorpay integration with signature verification
- 👨‍💼 **Admin Panel**: Manage orders, update order status
- 🔒 **Secure Authentication**: JWT-based admin authentication
- 📱 **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- ⚡ **Performance**: ISR (Incremental Static Regeneration) for fast page loads

## Tech Stack

- **Framework**: Next.js 15.5.3 (App Router)
- **Database**: MongoDB
- **Payment**: Razorpay
- **Styling**: Tailwind CSS
- **Authentication**: JWT + bcrypt
- **Language**: TypeScript

## Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or MongoDB Atlas)
- Razorpay account with API keys

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/watch-store
# Or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/watch-store

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# JWT Secret for admin authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# App URL
APP_URL=http://localhost:3000

# ISR Revalidation (in seconds)
REVALIDATE_SECONDS=60
```

### 3. Database Setup

#### Option A: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Update `MONGODB_URI` in `.env.local`

#### Option B: MongoDB Atlas

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get connection string and update `MONGODB_URI`

### 4. Create Admin User

Run the seed script to create an admin user:

```bash
npm run seed
```

Or manually create an admin user in MongoDB:

```javascript
// In MongoDB shell or Compass
use watch-store;
db.admins.insertOne({
  username: "admin",
  passwordHash: "$2a$10$...", // bcrypt hash of your password
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

To generate a bcrypt hash:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('yourpassword', 10));"
```

### 5. Seed Sample Data (Optional)

Create sample collections and products in MongoDB:

```javascript
// Collections
db.collections.insertMany([
  {
    title: "Luxury Collection",
    slug: "luxury-collection",
    description: "Premium luxury timepieces",
    image: "https://example.com/luxury.jpg",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Products
db.products.insertMany([
  {
    title: "Classic Watch",
    slug: "classic-watch",
    sku: "WATCH-001",
    price: 50000, // in paisa (₹500.00)
    currency: "INR",
    collectionId: ObjectId("..."), // Use collection _id
    images: ["https://example.com/watch1.jpg"],
    description: "A classic timepiece",
    specs: {
      weight: "150g",
      caseSize: "42mm",
      movement: "Automatic"
    },
    stock: 10,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
watch-store/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── admin/        # Admin endpoints
│   │   ├── checkout/     # Checkout & payment
│   │   ├── collections/  # Collections API
│   │   ├── products/     # Products API
│   │   └── webhooks/     # Razorpay webhooks
│   ├── admin/            # Admin pages
│   ├── all/              # All products page
│   ├── cart/             # Shopping cart
│   ├── checkout/         # Checkout page
│   ├── collections/      # Collections pages (SSG)
│   ├── order/            # Order confirmation
│   ├── products/         # Product pages (SSG)
│   └── page.tsx          # Home page
├── components/            # React components
├── lib/                  # Utilities
│   ├── auth.ts          # JWT authentication
│   ├── cart.ts          # Cart management
│   ├── mongodb.ts       # MongoDB connection
│   ├── models.ts        # TypeScript models
│   └── razorpay.ts      # Razorpay utilities
└── public/               # Static assets
```

## API Endpoints

### Public Endpoints

- `GET /api/collections` - List all collections
- `GET /api/collections/[slug]` - Get collection with products
- `GET /api/products` - List products (with filters/pagination)
- `GET /api/products/[slug]` - Get product details
- `POST /api/checkout/create-order` - Create order and Razorpay order
- `POST /api/checkout/verify` - Verify payment signature
- `POST /api/webhooks/razorpay` - Razorpay webhook handler

### Admin Endpoints (Protected)

- `POST /api/admin/login` - Admin login
- `GET /api/admin/orders` - List orders
- `GET /api/admin/orders/[id]` - Get order details
- `PATCH /api/admin/orders/[id]` - Update order status

## Razorpay Integration

### Payment Flow

1. Customer fills checkout form
2. Server creates order in MongoDB
3. Server creates Razorpay order
4. Client opens Razorpay checkout
5. After payment, client sends payment details to `/api/checkout/verify`
6. Server verifies signature and updates order status
7. Webhook also confirms payment (redundancy)

### Testing

Use Razorpay test keys for development. Test cards:
- Success: 4111 1111 1111 1111
- Failure: 4000 0000 0000 0002

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### MongoDB Atlas Setup

1. Create cluster
2. Whitelist Vercel IPs (or use 0.0.0.0/0 for development)
3. Get connection string
4. Add to Vercel environment variables

### Razorpay Webhook

1. In Razorpay dashboard, add webhook URL:
   `https://yourdomain.com/api/webhooks/razorpay`
2. Select events: `payment.captured`
3. Copy webhook secret (if using separate secret)

## Security Features

- ✅ JWT-based admin authentication
- ✅ bcrypt password hashing
- ✅ Razorpay signature verification
- ✅ Input validation with Zod
- ✅ HTTP-only cookies for tokens
- ✅ Server-side payment verification
- ✅ Webhook signature verification

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Troubleshooting

### MongoDB Connection Issues

- Check `MONGODB_URI` is correct
- Ensure MongoDB is running (if local)
- Check network access (if Atlas)

### Razorpay Issues

- Verify API keys are correct
- Check webhook URL is accessible
- Ensure signature verification logic is correct

### Admin Login Issues

- Verify admin user exists in database
- Check password hash is correct
- Ensure JWT_SECRET is set

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

