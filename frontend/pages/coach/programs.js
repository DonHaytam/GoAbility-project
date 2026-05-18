import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { trainingAPI } from '../../lib/api';
import toast from 'react-hot-toast';

export default function CoachPrograms() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', disabilityType: '', difficulty: 'beginner', durationWeeks: 4, sessionsPerWeek: 3, price: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) trainingAPI.getPrograms({}).then(r => setPrograms(r.data.programs || [])).catch(() => {});
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await trainingAPI.createProgram(form);
      toast.success('Program created!');
      setShowForm(false);
      setForm({ name: '', description: '', category: '', disabilityType: '', difficulty: 'beginner', durationWeeks: 4, sessionsPerWeek: 3, price: 0 });
      const res = await trainingAPI.getPrograms({});
      setPrograms(res.data.programs || []);
    } catch { toast.error('Failed to create program'); }
    finally { setSaving(false); }
  };

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-light flex pt-16 md:pt-20">
        <DashboardSidebar role="coach" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mb-4" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-navy-900">Training Programs</h1>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
              {showForm ? 'Cancel' : '+ New Program'}
            </button>
          </div>

          {showForm && (
            <div className="card mb-8">
              <h3 className="font-bold text-navy-900 text-lg mb-4">Create New Program</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program Name *</label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field" placeholder="e.g. Strength Training" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Disability Type</label>
                    <select value={form.disabilityType} onChange={e => setForm({...form, disabilityType: e.target.value})} className="input-field">
                      <option value="">General</option>
                      <option value="Physical">Physical</option>
                      <option value="Visual">Visual</option>
                      <option value="Hearing">Hearing</option>
                      <option value="Intellectual">Intellectual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})} className="input-field">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (weeks)</label>
                    <input type="number" value={form.durationWeeks} onChange={e => setForm({...form, durationWeeks: parseInt(e.target.value)})} className="input-field" min="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sessions/Week</label>
                    <input type="number" value={form.sessionsPerWeek} onChange={e => setForm({...form, sessionsPerWeek: parseInt(e.target.value)})} className="input-field" min="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (MAD)</label>
                    <input type="number" value={form.price} onChange={e => setForm({...form, price: parseInt(e.target.value)})} className="input-field" min="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field resize-none" />
                </div>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Program'}</button>
              </form>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map(p => (
              <div key={p.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.is_published ? 'bg-green-mint/20 text-green-mint' : 'bg-yellow-100 text-yellow-600'}`}>
                    {p.is_published ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-xs text-gray-400">{p.difficulty}</span>
                </div>
                <h3 className="font-bold text-navy-900 mb-1">{p.name}</h3>
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{p.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{p.duration_weeks} weeks</span>
                  <span>{p.sessions_per_week}/week</span>
                  {p.disability_type && <span className="text-ocean-500">{p.disability_type}</span>}
                </div>
              </div>
            ))}
            {programs.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No programs created yet</div>}
          </div>
        </div>
      </div>
    </Layout>
  );
}
