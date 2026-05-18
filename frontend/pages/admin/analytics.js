import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { analyticsAPI } from '../../lib/api';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave, faUsers, faBox, faChartBar } from '@fortawesome/free-solid-svg-icons';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function AdminAnalytics() {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'admin') { router.push('/dashboard'); return; }
  }, [user]);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user) analyticsAPI.getDashboard().then(r => setData(r.data)).catch(() => {});
  }, [user]);

  const ordersChart = data?.ordersByStatus ? {
    labels: data.ordersByStatus.map(o => o.status),
    datasets: [{ label: 'Orders', data: data.ordersByStatus.map(o => o.count), backgroundColor: ['#0077B6', '#52B788', '#70C1B3', '#74C69D', '#0B2545', '#E5E7EB'], borderRadius: 6 }]
  } : null;

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-light flex pt-16 md:pt-20">
        <DashboardSidebar role="admin" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mb-4" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-navy-900 mb-8">Analytics</h1>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="card">
              <h3 className="font-bold text-navy-900 mb-4">Orders by Status</h3>
              {ordersChart ? <Bar data={ordersChart} options={{ responsive: true, plugins: { legend: { display: false } } }} /> : <p className="text-gray-400 py-8 text-center">Loading...</p>}
            </div>
            <div className="card">
              <h3 className="font-bold text-navy-900 mb-4">Key Metrics</h3>
              <div className="space-y-4">
                {[
                  ['Total Revenue', `${data?.totalRevenue?.toLocaleString() || 0} MAD`, faMoneyBillWave],
                  ['Active Users', data?.totalUsers || 0, faUsers],
                  ['Total Products', data?.totalProducts || 0, faBox],
                  ['Avg Order Value', data?.totalOrders > 0 ? `${(data.totalRevenue / data.totalOrders).toFixed(0)} MAD` : '0 MAD', faChartBar],
                ].map(([label, value, icon]) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={icon} className="text-xl w-5" />
                      <span className="text-sm text-gray-600">{label}</span>
                    </div>
                    <span className="font-bold text-navy-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
