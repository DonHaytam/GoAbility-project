import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { usersAPI } from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  const loadUsers = () => usersAPI.getAll({ search }).then(r => setUsers(r.data.users || [])).catch(() => {});

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'admin') { router.push('/dashboard'); return; }
    loadUsers()
  }, [user, search]);

  const toggleStatus = async (id) => {
    try {
      await usersAPI.toggleStatus(id);
      toast.success('Status updated');
      loadUsers();
    } catch { toast.error('Failed to update'); }
  };

  const updateRole = async (id, role) => {
    try {
      await usersAPI.updateRole(id, role);
      toast.success('Role updated');
      loadUsers();
    } catch { toast.error('Failed to update'); }
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
            <h1 className="text-2xl font-bold text-navy-900">User Management</h1>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="input-field max-w-xs" />
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Tier</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold">{u.first_name?.[0]}{u.last_name?.[0]}</div>
                          <span className="font-medium text-navy-900">{u.first_name} {u.last_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{u.email}</td>
                      <td className="py-3 px-4">
                        <select value={u.role} onChange={e => updateRole(u.id, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1">
                          <option value="athlete">Athlete</option>
                          <option value="coach">Coach</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-mint/20 text-green-mint' : 'bg-red-100 text-red-500'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs capitalize">{u.subscription_tier || 'free'}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleStatus(u.id)} className="text-sm text-ocean-500 hover:underline">
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
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
