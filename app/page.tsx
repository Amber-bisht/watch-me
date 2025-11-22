import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getDatabase } from '@/lib/mongodb';
import { Collection, Product } from '@/lib/models';
import { serializeDocument } from '@/lib/utils';

export const revalidate = 60;

async function getFeaturedData() {
  const db = await getDatabase();
  
  const [collections, products] = await Promise.all([
    db
      .collection<Collection>('collections')
      .find({})
      .limit(3)
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<Product>('products')
      .find({ featured: true })
      .limit(6)
      .toArray(),
  ]);

  return { collections, products };
}

export default async function Home() {
  const { collections, products } = await getFeaturedData();
  
  // Serialize MongoDB documents to plain objects before passing to Client Components
  const serializedProducts = products.map((product) => serializeDocument(product));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
          <Image
            src="https://royalbliz.com/cdn/shop/files/website-cover-final_3ee6b045-0d7f-4985-9c9e-f681363803bb.png?v=1748244301&width=1920"
            alt="Premium Timepieces Banner"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            <h1 className="text-6xl font-bold mb-4">
              Premium Timepieces
            </h1>
            <p className="text-2xl mb-8 text-gray-100">
              Discover our exquisite collection of luxury watches
            </p>
            <Link
              href="/all"
              className="inline-block bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition text-lg"
            >
              Shop Now
            </Link>
          </div>
        </section>

        {/* Featured Collections */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8 text-center">Collections</h2>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {collections.map((collection) => (
                <Link
                  key={collection._id?.toString()}
                  href={`/collections/${collection.slug}`}
                  className="group flex-shrink-0 w-80 snap-start"
                >
                  <div className="relative h-96 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                    <Image
                      src={collection.image}
                      alt={collection.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-bold mb-2">
                        {collection.title}
                      </h3>
                      <p className="text-sm text-gray-200 line-clamp-2">{collection.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/collections"
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                View All Collections →
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8 text-center text-black">Featured Watches</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {serializedProducts.map((product) => (
                <ProductCard
                  key={product._id?.toString()}
                  product={product}
                  showAddToCart={true}
                />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/all"
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                View All Products →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

