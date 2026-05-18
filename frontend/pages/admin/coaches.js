import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { usersAPI } from '../../lib/api';

export default function AdminCoaches() {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coaches, setCoaches] = useState([]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'admin') { router.push('/dashboard'); return; }
    usersAPI.getCoaches().then(r => setCoaches(r.data.coaches || [])).catch(() => {});
  }, [user]);

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-light flex pt-16 md:pt-20">
        <DashboardSidebar role="admin" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mb-4" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-navy-900 mb-8">Coach Management</h1>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coaches.map(c => (
              <div key={c.id} className="card">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold">{c.first_name?.[0]}{c.last_name?.[0]}</div>
                  <div>
                    <h3 className="font-bold text-navy-900">{c.first_name} {c.last_name}</h3>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{c.bio || 'Experienced coach'}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{c.city || 'Morocco'}</span>
                  <span className="text-green-mint font-medium">Active</span>
                </div>
              </div>
            ))}
            {coaches.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No coaches found</div>}
          </div>
        </div>
      </div>
    </Layout>
  );
}
