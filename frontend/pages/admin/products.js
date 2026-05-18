import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { productsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', subCategory: '', price: 0, rentalPrice: '', isRentable: false, condition: 'new', brand: '', stockCount: 1 });
  const [saving, setSaving] = useState(false);

  const load = () => productsAPI.getAll({}).then(r => setProducts(r.data.products || [])).catch(() => {});
  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'admin') { router.push('/dashboard'); return; }
    load()
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await productsAPI.create(form);
      toast.success('Product created!');
      setShowForm(false);
      setForm({ name: '', description: '', category: '', subCategory: '', price: 0, rentalPrice: '', isRentable: false, condition: 'new', brand: '', stockCount: 1 });
      load();
    } catch { toast.error('Failed to create'); }
    finally { setSaving(false); }
  };

  const toggleFeatured = async (id, featured) => {
    try { await productsAPI.update(id, { featured: !featured }); load(); toast.success('Updated'); }
    catch { toast.error('Failed'); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await productsAPI.delete(id); load(); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-light flex pt-16 md:pt-20">
        <DashboardSidebar role="admin" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mb-4" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-navy-900">Product Management</h1>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">{showForm ? 'Cancel' : '+ Add Product'}</button>
          </div>

          {showForm && (
            <div className="card mb-8">
              <h3 className="font-bold text-navy-900 text-lg mb-4">Add New Product</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field" required /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Price (MAD) *</label><input type="number" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} className="input-field" required /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand</label><input type="text" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="input-field" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Condition</label><select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="input-field"><option value="new">New</option><option value="like_new">Like New</option><option value="good">Good</option><option value="fair">Fair</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Stock</label><input type="number" value={form.stockCount} onChange={e => setForm({...form, stockCount: parseInt(e.target.value)})} className="input-field" /></div>
                  <div><label className="flex items-center gap-3"><input type="checkbox" checked={form.isRentable} onChange={e => setForm({...form, isRentable: e.target.checked})} className="w-4 h-4 text-ocean-500" /> <span className="text-sm font-medium text-gray-700">Available for Rent</span></label></div>
                  {form.isRentable && <div><label className="block text-sm font-medium text-gray-700 mb-1">Rental Price</label><input type="number" value={form.rentalPrice} onChange={e => setForm({...form, rentalPrice: parseFloat(e.target.value)})} className="input-field" /></div>}
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field resize-none" /></div>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Adding...' : 'Add Product'}</button>
              </form>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Stock</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Featured</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-navy-900">{p.name}</td>
                      <td className="py-3 px-4 text-gray-500">{p.category}</td>
                      <td className="py-3 px-4">{p.price} MAD</td>
                      <td className="py-3 px-4">{p.stock_count}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleFeatured(p.id, p.featured)} className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.featured ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                          {p.featured ? 'Featured' : 'Set Featured'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => productsAPI.update(p.id, { isAvailable: !p.is_available }).then(load)} className="text-xs text-ocean-500 hover:underline">
                            {p.is_available ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => deleteProduct(p.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
