import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { usersAPI } from '../../lib/api';

export default function CoachAthletes() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [athletes, setAthletes] = useState([]);

  useEffect(() => {
    if (user) usersAPI.getAthletes().then(r => setAthletes(r.data.athletes || [])).catch(() => {});
  }, [user]);

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-light flex pt-16 md:pt-20">
        <DashboardSidebar role="coach" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mb-4" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-navy-900 mb-8">My Athletes</h1>
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Athlete</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">City</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.map(a => (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold">{a.first_name?.[0]}{a.last_name?.[0]}</div>
                          <span className="font-medium text-navy-900">{a.first_name} {a.last_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{a.email}</td>
                      <td className="py-3 px-4 text-gray-500">{a.city || '-'}</td>
                      <td className="py-3 px-4"><span className="text-xs bg-green-mint/20 text-green-mint px-2 py-0.5 rounded-full">Active</span></td>
                      <td className="py-3 px-4">
                        <button className="text-ocean-500 text-sm font-medium hover:underline">View Progress</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {athletes.length === 0 && <p className="text-center py-12 text-gray-400">No athletes assigned yet</p>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
