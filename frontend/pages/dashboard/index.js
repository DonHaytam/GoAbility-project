import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { analyticsAPI, ordersAPI, trainingAPI } from '../../lib/api';
import Link from 'next/link';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDumbbell, faCheck, faFire, faChartBar } from '@fortawesome/free-solid-svg-icons';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function AthleteDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'athlete') { router.push(user.role === 'admin' ? '/admin' : '/coach'); return; }
    analyticsAPI.getAthleteStats().then(r => setStats(r.data)).catch(() => {});
    ordersAPI.getAll().then(r => setOrders(r.data.orders || [])).catch(() => {});
    trainingAPI.getEnrollments().then(r => setEnrollments(r.data.enrollments || [])).catch(() => {});
  }, [user]);

  if (!user) return null;

  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Training Minutes',
      data: [30, 45, 20, 60, 35, 50, 40],
      backgroundColor: 'rgba(0,119,182,0.7)',
      borderRadius: 6,
    }]
  };

  const doughnutData = {
    labels: ['Completed', 'In Progress', 'Pending'],
    datasets: [{
      data: [stats?.completedSessions || 0, stats?.activePrograms || 0, Math.max(0, (stats?.totalSessions || 0) - (stats?.completedSessions || 0))],
      backgroundColor: ['#52B788', '#0077B6', '#E5E7EB'],
      borderWidth: 0,
    }]
  };

  const StatCard = ({ icon, label, value, color }) => (
    <div className="card flex items-center gap-4">
      <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center text-2xl`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-navy-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-light flex pt-16 md:pt-20">
        <DashboardSidebar role="athlete" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-3" onClick={() => setSidebarOpen(true)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h1 className="text-2xl font-bold text-navy-900">{t('dashboard.welcome')}, {user.firstName}!</h1>
              <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<FontAwesomeIcon icon={faDumbbell} className="text-2xl" />} label="Total Sessions" value={stats?.totalSessions || 0} color="bg-ocean-500/10" />
            <StatCard icon={<FontAwesomeIcon icon={faCheck} className="text-2xl" />} label="Completed" value={stats?.completedSessions || 0} color="bg-green-mint/10" />
            <StatCard icon={<FontAwesomeIcon icon={faFire} className="text-2xl" />} label="Calories Burned" value={stats?.totalCalories || 0} color="bg-orange-500/10" />
            <StatCard icon={<FontAwesomeIcon icon={faChartBar} className="text-2xl" />} label="Avg. Performance" value={`${stats?.avgPerformance || 0}/10`} color="bg-purple-500/10" />
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="card">
              <h3 className="font-bold text-navy-900 mb-4">This Week's Activity</h3>
              <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
            </div>
            <div className="card">
              <h3 className="font-bold text-navy-900 mb-4">Overall Progress</h3>
              <div className="w-48 mx-auto">
                <Doughnut data={doughnutData} options={{ cutout: '70%', plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-navy-900">Recent Orders</h3>
                <Link href="/dashboard/orders" className="text-ocean-500 text-sm hover:underline">View all</Link>
              </div>
              {orders.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-navy-900">{order.id?.slice(0, 8)}...</p>
                        <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.status === 'delivered' ? 'bg-green-mint/20 text-green-mint' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-navy-900">Active Training</h3>
                <Link href="/dashboard/training" className="text-ocean-500 text-sm hover:underline">View all</Link>
              </div>
              {enrollments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-3">No active programs</p>
                  <Link href="/training" className="text-ocean-500 text-sm font-medium hover:underline">Browse programs →</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollments.slice(0, 3).map(en => (
                    <div key={en.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-navy-900">{en.name}</span>
                        <span className="text-gray-500">{en.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-ocean-500 to-green-mint rounded-full h-2 transition-all" style={{ width: `${en.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
