import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { communityAPI } from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminCommunity() {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts, setPosts] = useState([]);

  const load = () => communityAPI.getPosts({}).then(r => setPosts(r.data.posts || [])).catch(() => {});
  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'admin') { router.push('/dashboard'); return; }
    load()
  }, [user]);

  const toggleApprove = async (id) => {
    try { await communityAPI.approvePost(id); toast.success('Toggled approval'); load(); }
    catch { toast.error('Failed'); }
  };

  const deletePost = async (id) => {
    if (!confirm('Delete this post?')) return;
    try { await communityAPI.deletePost(id); toast.success('Deleted'); load(); }
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
          <h1 className="text-2xl font-bold text-navy-900 mb-8">Community Moderation</h1>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Author</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Views</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Approved</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(p => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-navy-900 max-w-[200px] truncate">{p.title}</td>
                      <td className="py-3 px-4 text-gray-500">{p.first_name} {p.last_name}</td>
                      <td className="py-3 px-4">{p.category}</td>
                      <td className="py-3 px-4">{p.view_count || 0}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleApprove(p.id)}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.is_approved ? 'bg-green-mint/20 text-green-mint' : 'bg-yellow-100 text-yellow-600'}`}>
                          {p.is_approved ? 'Approved' : 'Pending'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => deletePost(p.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {posts.length === 0 && <p className="text-center py-12 text-gray-400">No posts yet</p>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
