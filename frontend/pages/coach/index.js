import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { usersAPI, trainingAPI } from '../../lib/api';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faDumbbell, faChartBar, faStar } from '@fortawesome/free-solid-svg-icons';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center text-2xl`}>{icon}</div>
    <div>
      <div className="text-2xl font-bold text-navy-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  </div>
);

export default function CoachDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [athletes, setAthletes] = useState([]);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'coach') { router.push(user.role === 'admin' ? '/admin' : '/dashboard'); return; }
    usersAPI.getAthletes().then(r => setAthletes(r.data.athletes || [])).catch(() => {});
    trainingAPI.getPrograms({}).then(r => setPrograms(r.data.programs || [])).catch(() => {});
  }, [user]);

  if (!user) return null;

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-light flex pt-16 md:pt-20">
        <DashboardSidebar role="coach" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-3" onClick={() => setSidebarOpen(true)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h1 className="text-2xl font-bold text-navy-900">Coach Dashboard</h1>
              <p className="text-gray-500 text-sm">Welcome back, Coach {user.firstName}</p>
            </div>
            <Link href="/coach/programs" className="btn-primary text-sm">+ Create Program</Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<FontAwesomeIcon icon={faUsers} />} label="Total Athletes" value={athletes.length} color="bg-ocean-500/10" />
            <StatCard icon={<FontAwesomeIcon icon={faDumbbell} />} label="Active Programs" value={programs.filter(p => p.is_published).length} color="bg-green-mint/10" />
            <StatCard icon={<FontAwesomeIcon icon={faChartBar} />} label="Avg Progress" value="74%" color="bg-purple-500/10" />
            <StatCard icon={<FontAwesomeIcon icon={faStar} />} label="Rating" value="4.8" color="bg-yellow-500/10" />
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="card">
              <h3 className="font-bold text-navy-900 mb-4">My Athletes ({athletes.length})</h3>
              {athletes.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No athletes assigned yet</p>
              ) : (
                <div className="space-y-3">
                  {athletes.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {a.first_name?.[0]}{a.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-navy-900 text-sm">{a.first_name} {a.last_name}</p>
                          <p className="text-xs text-gray-400">{a.city || 'Morocco'}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-green-mint/20 text-green-mint px-2 py-0.5 rounded-full">Active</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="font-bold text-navy-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[
                  { action: 'Completed training session', athlete: 'Ahmed B.', time: '2 hours ago' },
                  { action: 'Updated program', athlete: 'Fatima Z.', time: '4 hours ago' },
                  { action: 'Achieved new personal best', athlete: 'Karim O.', time: '1 day ago' },
                  { action: 'Started new program', athlete: 'Sara L.', time: '2 days ago' },
                ].map((act, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-2 h-2 bg-green-mint rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">{act.action}</p>
                      <p className="text-xs text-gray-400">{act.athlete} · {act.time}</p>
                    </div>
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
