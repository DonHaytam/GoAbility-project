import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { ordersAPI } from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);

  const load = () => ordersAPI.getAll().then(r => setOrders(r.data.orders || [])).catch(() => {});
  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'admin') { router.push('/dashboard'); return; }
    load()
  }, [user]);

  const updateStatus = async (id, status) => {
    try { await ordersAPI.updateStatus(id, status); toast.success('Status updated'); load(); }
    catch { toast.error('Failed to update'); }
  };

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-light flex pt-16 md:pt-20">
        <DashboardSidebar role="admin" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mb-4" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-navy-900 mb-8">Order Management</h1>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Payment</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs">{o.id?.slice(0, 12)}...</td>
                      <td className="py-3 px-4">{o.first_name} {o.last_name}</td>
                      <td className="py-3 px-4 capitalize">{o.order_type}</td>
                      <td className="py-3 px-4 font-medium">{o.total_amount} MAD</td>
                      <td className="py-3 px-4">
                        <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                          className={`text-xs border rounded-lg px-2 py-1 ${o.status === 'delivered' ? 'border-green-mint text-green-mint' : o.status === 'cancelled' ? 'border-red-300 text-red-500' : 'border-gray-200 text-gray-500'}`}>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${o.payment_status === 'completed' ? 'bg-green-mint/20 text-green-mint' : 'bg-yellow-100 text-yellow-600'}`}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-xs text-ocean-500 hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <p className="text-center py-12 text-gray-400">No orders yet</p>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
