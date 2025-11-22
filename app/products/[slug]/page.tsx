import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AddToCartButton from '@/components/AddToCartButton';
import { getDatabase } from '@/lib/mongodb';
import { Product, Collection } from '@/lib/models';
import { ObjectId } from 'mongodb';
import { serializeDocument } from '@/lib/utils';

export const revalidate = 60;

async function getProduct(slug: string) {
  const db = await getDatabase();
  const product = await db
    .collection<Product>('products')
    .findOne({ slug });

  if (!product) {
    return null;
  }

  const collection = await db
    .collection<Collection>('collections')
    .findOne({ _id: new ObjectId(product.collectionId) });

  return { product, collection };
}

export async function generateStaticParams() {
  const db = await getDatabase();
  const products = await db
    .collection<Product>('products')
    .find({})
    .toArray();

  return products.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getProduct(slug);

  if (!data) {
    notFound();
  }

  const { product, collection } = data;
  
  // Serialize MongoDB document to plain object before passing to Client Component
  const serializedProduct = serializeDocument(product);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="mb-4 text-sm text-gray-600">
            <Link href="/all" className="hover:text-gray-900">
              All Watches
            </Link>
            {collection && (
              <>
                <span className="mx-2">/</span>
                <Link
                  href={`/collections/${collection.slug}`}
                  className="hover:text-gray-900"
                >
                  {collection.title}
                </Link>
              </>
            )}
            <span className="mx-2">/</span>
            <span>{serializedProduct.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Images */}
            <div className="bg-white rounded-lg p-8 shadow-md">
              <div className="relative h-[500px] mb-4 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                <Image
                  src={serializedProduct.images[0] || '/placeholder-watch.jpg'}
                  alt={serializedProduct.title}
                  fill
                  className="object-contain"
                />
              </div>
              {serializedProduct.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {serializedProduct.images.slice(1, 5).map((image, idx) => (
                    <div
                      key={idx}
                      className="relative h-24 rounded-lg overflow-hidden bg-gray-50 cursor-pointer hover:ring-2 hover:ring-gray-400 transition"
                    >
                      <Image
                        src={image}
                        alt={`${serializedProduct.title} ${idx + 2}`}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <h1 className="text-4xl font-bold mb-4 text-gray-900">{serializedProduct.title}</h1>
              <p className="text-4xl font-bold text-gray-900 mb-6">
                ₹ {(serializedProduct.price / 100).toFixed(2)}
              </p>

              {/* Color Options */}
              {serializedProduct.colors && serializedProduct.colors.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Color: {serializedProduct.specs?.color || serializedProduct.colors[0].name}
                  </p>
                  <div className="flex gap-3">
                    {serializedProduct.colors.map((color, idx) => (
                      <button
                        key={idx}
                        className="w-10 h-10 rounded-full border-2 border-gray-900 ring-2 ring-gray-400 transition-all hover:scale-110"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6 pb-6 border-b">
                <p className="text-gray-700 leading-relaxed">{serializedProduct.description}</p>
              </div>

              {serializedProduct.specs && (
                <div className="mb-6 pb-6 border-b">
                  <h3 className="text-xl font-semibold mb-4">Specifications</h3>
                  <dl className="grid grid-cols-2 gap-4">
                    {Object.entries(serializedProduct.specs).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-sm text-gray-600 capitalize mb-1">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </dt>
                        <dd className="font-medium text-gray-900">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Availability</p>
                <p className="font-semibold text-lg">
                  {serializedProduct.stock > 0 ? (
                    <span className="text-green-600">
                      In Stock ({serializedProduct.stock} available)
                    </span>
                  ) : (
                    <span className="text-red-600">Out of Stock</span>
                  )}
                </p>
              </div>

              <AddToCartButton product={serializedProduct} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

