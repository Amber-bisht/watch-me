import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getDatabase } from '@/lib/mongodb';
import { Collection } from '@/lib/models';

export const revalidate = 60;

async function getCollections() {
  const db = await getDatabase();
  const collections = await db
    .collection<Collection>('collections')
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  
  return collections;
}

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">Collections</h1>
          
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
                    <h2 className="text-2xl font-bold mb-2">
                      {collection.title}
                    </h2>
                    <p className="text-sm text-gray-200 line-clamp-2">{collection.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

