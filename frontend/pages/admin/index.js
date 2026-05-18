import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { analyticsAPI } from '../../lib/api';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faBox, faShoppingCart, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler);

const StatCard = ({ icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center text-2xl`}>{icon}</div>
    <div>
      <div className="text-2xl font-bold text-navy-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'admin') { router.push(user.role === 'coach' ? '/coach' : '/dashboard'); return; }
    analyticsAPI.getDashboard().then(r => setData(r.data)).catch(() => {});
  }, [user]);

  if (!user) return null;

  const revenueData = data?.monthlyRevenue ? {
    labels: data.monthlyRevenue.map(r => new Date(r.month).toLocaleDateString('en', { month: 'short' })),
    datasets: [{
      label: 'Revenue (MAD)',
      data: data.monthlyRevenue.map(r => r.revenue),
      borderColor: '#0077B6',
      backgroundColor: 'rgba(0,119,182,0.1)',
      fill: true,
      tension: 0.4,
    }]
  } : null;

  const roleData = data?.usersByRole ? {
    labels: data.usersByRole.map(r => r.role),
    datasets: [{
      data: data.usersByRole.map(r => r.count),
      backgroundColor: ['#0077B6', '#52B788', '#0B2545'],
      borderWidth: 0,
    }]
  } : null;

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-light flex pt-16 md:pt-20">
        <DashboardSidebar role="admin" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-3" onClick={() => setSidebarOpen(true)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h1 className="text-2xl font-bold text-navy-900">Admin Dashboard</h1>
              <p className="text-gray-500 text-sm">Platform overview and management</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<FontAwesomeIcon icon={faUsers} />} label="Total Users" value={data?.totalUsers || 0} color="bg-ocean-500/10" />
            <StatCard icon={<FontAwesomeIcon icon={faBox} />} label="Products" value={data?.totalProducts || 0} color="bg-green-mint/10" />
            <StatCard icon={<FontAwesomeIcon icon={faShoppingCart} />} label="Orders" value={data?.totalOrders || 0} color="bg-purple-500/10" />
            <StatCard icon={<FontAwesomeIcon icon={faMoneyBillWave} />} label="Revenue (MAD)" value={data?.totalRevenue?.toLocaleString() || 0} color="bg-yellow-500/10" />
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="card">
              <h3 className="font-bold text-navy-900 mb-4">Revenue Overview</h3>
              {revenueData ? <Line data={revenueData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} /> : <p className="text-gray-400 py-8 text-center">Loading...</p>}
            </div>
            <div className="card">
              <h3 className="font-bold text-navy-900 mb-4">Users by Role</h3>
              <div className="w-48 mx-auto">
                {roleData ? <Doughnut data={roleData} options={{ cutout: '65%', plugins: { legend: { position: 'bottom' } } }} /> : <p className="text-gray-400 py-8 text-center">Loading...</p>}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <h3 className="font-bold text-navy-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Active Enrollments</span><span className="font-bold text-navy-900">{data?.activeEnrollments || 0}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Forum Posts</span><span className="font-bold text-navy-900">{data?.forumPosts || 0}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Events</span><span className="font-bold text-navy-900">{data?.events || 0}</span></div>
              </div>
            </div>
            <div className="lg:col-span-2 card">
              <h3 className="font-bold text-navy-900 mb-4">Recent Orders</h3>
              {data?.recentOrders?.length > 0 ? (
                <div className="space-y-2">
                  {data.recentOrders.slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                      <span className="text-gray-500 font-mono text-xs">{o.id?.slice(0, 10)}...</span>
                      <span>{o.first_name} {o.last_name}</span>
                      <span className="font-medium">{o.total_amount} MAD</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === 'delivered' ? 'bg-green-mint/20 text-green-mint' : o.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>{o.status}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-sm py-4 text-center">No recent orders</p>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
