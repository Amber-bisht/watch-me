'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Collection } from '@/lib/models';
import { generateSlug } from '@/lib/utils';

export default function AdminCollectionsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    image: '',
  });

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      // Save the current URL and redirect to login
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/admin?callbackUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }
    if (sessionStatus === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'admin') {
        alert('You do not have admin access');
        router.push('/admin');
        return;
      }
      fetchCollections();
    }
  }, [sessionStatus, session, router, page, search]);

  async function fetchCollections() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      });

      const res = await fetch(`/api/admin/collections?${params}`);
      
      if (res.status === 401) {
        router.push('/admin');
        return;
      }

      const data = await res.json();
      setCollections(data.collections || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingCollection(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      image: '',
    });
    setShowModal(true);
  }

  function openEditModal(collection: Collection) {
    setEditingCollection(collection);
    setFormData({
      title: collection.title,
      slug: collection.slug,
      description: collection.description,
      image: collection.image,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const collectionData = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        description: formData.description,
        image: formData.image,
      };

      const url = editingCollection 
        ? `/api/admin/collections/${editingCollection._id}`
        : '/api/admin/collections';
      
      const method = editingCollection ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectionData),
      });

      if (res.status === 401) {
        router.push('/admin');
        return;
      }

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to save collection');
        return;
      }

      setShowModal(false);
      fetchCollections();
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Failed to save collection');
    }
  }

  async function handleDelete(collectionId: string) {
    if (!confirm('Are you sure you want to delete this collection? This will fail if any products are using it.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/collections/${collectionId}`, {
        method: 'DELETE',
      });

      if (res.status === 401) {
        router.push('/admin');
        return;
      }

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to delete collection');
        return;
      }

      fetchCollections();
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('Failed to delete collection');
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="bg-gray-900 shadow-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <div className="flex space-x-2">
                <Link href="/admin/orders" className="px-3 py-1 text-gray-400 hover:text-white">
                  Orders
                </Link>
                <Link href="/admin/products" className="px-3 py-1 text-gray-400 hover:text-white">
                  Products
                </Link>
                <Link href="/admin/collections" className="px-3 py-1 text-blue-400 font-semibold border-b-2 border-blue-400">
                  Collections
                </Link>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/admin' })}
              className="text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Collections</h2>
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Collection
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg shadow-md p-6 mb-6 border border-gray-800">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search collections..."
            className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 placeholder-gray-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-white">Loading...</div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No collections found</div>
        ) : (
          <>
            <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden border border-gray-800">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {collections.map((collection) => (
                    <tr key={collection._id?.toString()} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{collection.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{collection.slug}</td>
                      <td className="px-6 py-4 text-sm text-gray-400 max-w-md truncate">{collection.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => openEditModal(collection)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(collection._id!.toString())}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md disabled:opacity-50 hover:bg-gray-700"
                >
                  Previous
                </button>
                <span className="text-white">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md disabled:opacity-50 hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-2xl font-bold mb-4 text-white">
                {editingCollection ? 'Edit Collection' : 'Add Collection'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setFormData({
                        ...formData,
                        title: newTitle,
                        slug: !editingCollection && !formData.slug ? generateSlug(newTitle) : formData.slug,
                      });
                    }}
                    required
                    className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Image URL *</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    required
                    className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 placeholder-gray-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingCollection ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

