import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getDatabase } from '@/lib/mongodb';
import { Collection, Product } from '@/lib/models';

export const revalidate = 60;

async function getCollection(slug: string) {
  const db = await getDatabase();
  const collection = await db
    .collection<Collection>('collections')
    .findOne({ slug });

  if (!collection) {
    return null;
  }

  const products = await db
    .collection<Product>('products')
    .find({ collectionId: collection._id })
    .toArray();

  return { collection, products };
}

export async function generateStaticParams() {
  const db = await getDatabase();
  const collections = await db
    .collection<Collection>('collections')
    .find({})
    .toArray();

  return collections.map((collection) => ({
    slug: collection.slug,
  }));
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCollection(slug);

  if (!data) {
    notFound();
  }

  const { collection, products } = data;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="mb-4 text-sm text-gray-600">
            <Link href="/collections" className="hover:text-gray-900">
              Collections
            </Link>
            <span className="mx-2">/</span>
            <span>{collection.title}</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{collection.title}</h1>
            <p className="text-lg text-gray-600">{collection.description}</p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No products in this collection yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product._id?.toString()}
                  product={product}
                  showAddToCart={true}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

