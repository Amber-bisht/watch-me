'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Product, Collection } from '@/lib/models';
import { generateSlug } from '@/lib/utils';

export default function AdminProductsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    sku: '',
    price: '',
    collectionId: '',
    images: '',
    description: '',
    weight: '',
    caseSize: '',
    movement: '',
    stock: '',
    featured: false,
    isPublished: false,
  });

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      // Save the current URL and redirect to login
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }
    if (sessionStatus === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'admin') {
        alert('You do not have admin access');
        router.push('/login');
        return;
      }
      fetchProducts();
      fetchCollections();
    }
  }, [sessionStatus, session, router, page, search]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      });

      const res = await fetch(`/api/admin/products?${params}`);
      
      if (res.status === 401) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCollections() {
    try {
      const res = await fetch('/api/collections');
      const data = await res.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  }

  function openAddModal() {
    setEditingProduct(null);
    setFormData({
      title: '',
      slug: '',
      sku: '',
      price: '',
      collectionId: '',
      images: '',
      description: '',
      weight: '',
      caseSize: '',
      movement: '',
      stock: '',
      featured: false,
      isPublished: false,
    });
    setShowModal(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    const collectionId = typeof product.collectionId === 'string' 
      ? product.collectionId 
      : product.collectionId?.toString() || '';
    
    setFormData({
      title: product.title,
      slug: product.slug,
      sku: product.sku,
      price: (product.price / 100).toString(),
      collectionId,
      images: product.images.join('\n'),
      description: product.description,
      weight: product.specs?.weight || '',
      caseSize: product.specs?.caseSize || '',
      movement: product.specs?.movement || '',
      stock: product.stock.toString(),
      featured: product.featured,
      isPublished: product.isPublished ?? false,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const imagesArray = formData.images.split('\n').filter(img => img.trim());
      
      const productData = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        sku: formData.sku,
        price: formData.price,
        collectionId: formData.collectionId,
        images: imagesArray,
        description: formData.description,
        specs: {
          weight: formData.weight || undefined,
          caseSize: formData.caseSize || undefined,
          movement: formData.movement || undefined,
        },
        stock: formData.stock,
        featured: formData.featured,
        isPublished: formData.isPublished,
      };

      const url = editingProduct 
        ? `/api/admin/products/${editingProduct._id}`
        : '/api/admin/products';
      
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to save product');
        return;
      }

      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to delete product');
        return;
      }

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
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
                <Link href="/admin/products" className="px-3 py-1 text-blue-400 font-semibold border-b-2 border-blue-400">
                  Products
                </Link>
                <Link href="/admin/collections" className="px-3 py-1 text-gray-400 hover:text-white">
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
          <h2 className="text-3xl font-bold text-white">Products</h2>
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Product
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
            placeholder="Search products..."
            className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 placeholder-gray-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-white">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No products found</div>
        ) : (
          <>
            <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden border border-gray-800">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Published</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {products.map((product) => (
                    <tr key={product._id?.toString()} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{product.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{product.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">₹{(product.price / 100).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{product.stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.isPublished 
                            ? 'bg-green-900 text-green-300' 
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {product.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id!.toString())}
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
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-4 text-white">
                {editingProduct ? 'Edit Product' : 'Add Product'}
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
                        slug: !editingProduct && !formData.slug ? generateSlug(newTitle) : formData.slug,
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">SKU *</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                      className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Collection *</label>
                  <select
                    value={formData.collectionId}
                    onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                    required
                    className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2"
                  >
                    <option value="">Select a collection</option>
                    {collections.map((collection) => (
                      <option key={collection._id?.toString()} value={collection._id?.toString()}>
                        {collection.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Images (one per line) *</label>
                  <textarea
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    required
                    rows={3}
                    className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 placeholder-gray-500"
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">Weight</label>
                    <input
                      type="text"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">Case Size</label>
                    <input
                      type="text"
                      value={formData.caseSize}
                      onChange={(e) => setFormData({ ...formData, caseSize: e.target.value })}
                      className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">Movement</label>
                    <input
                      type="text"
                      value={formData.movement}
                      onChange={(e) => setFormData({ ...formData, movement: e.target.value })}
                      className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Stock *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="mr-2"
                    />
                    Featured
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="mr-2"
                    />
                    Published
                  </label>
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
                    {editingProduct ? 'Update' : 'Create'}
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

