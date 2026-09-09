import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { useRouteGuard } from '../../lib/useRouteGuard';
import { usersAPI, trainingAPI } from '../../lib/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function CoachReports() {
  useRouteGuard('coach');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await usersAPI.getAthletes();
        const list = res.data.athletes || [];
        const withProgress = [];
        for (const a of list.slice(0, 20)) {
          try {
            const p = await trainingAPI.getAthleteProgress(a.id);
            const progress = p.data.progress || [];
            const avg = progress.length
              ? (progress.filter(x => x.performance_score != null).reduce((s, x) => s + Number(x.performance_score), 0) /
                 Math.max(progress.filter(x => x.performance_score != null).length, 1)).toFixed(1)
              : 0;
            withProgress.push({
              id: a.id,
              name: `${a.first_name} ${a.last_name}`,
              sessions: progress.length,
              avgScore: Number(avg),
            });
          } catch (e) {
            if (e.response?.status !== 403) withProgress.push({ id: a.id, name: `${a.first_name} ${a.last_name}`, sessions: 0, avgScore: 0 });
          }
        }
        if (!cancelled) setAthletes(withProgress);
      } catch (e) {
        if (!cancelled) setAthletes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const chartData = {
    labels: athletes.map(a => a.name),
    datasets: [{
      label: 'Avg Performance Score (/10)',
      data: athletes.map(a => a.avgScore),
      backgroundColor: ['#0077B6', '#52B788', '#70C1B3', '#74C69D', '#0B2545'],
      borderRadius: 6,
    }]
  };

  const totalSessions = athletes.reduce((s, a) => s + a.sessions, 0);
  const avgScore = athletes.length
    ? (athletes.reduce((s, a) => s + (a.avgScore || 0), 0) / athletes.length).toFixed(1)
    : 0;

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-light flex pt-16 md:pt-20">
        <DashboardSidebar role="coach" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mb-4" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-navy-900 mb-8">Progress Reports</h1>

          {loading ? (
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="card animate-pulse h-64 bg-gray-100" />
              <div className="card animate-pulse h-64 bg-gray-100" />
            </div>
          ) : athletes.length === 0 ? (
            <div className="card text-center py-16">
              <h3 className="text-xl font-bold text-navy-900 mb-2">No linked athletes yet</h3>
              <p className="text-gray-500">Progress reports appear here once athletes enroll in your programs or accept your mentorship.</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <div className="card">
                <h3 className="font-bold text-navy-900 mb-4">Athlete Progress Overview</h3>
                <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 10 } } }} />
              </div>
              <div className="card">
                <h3 className="font-bold text-navy-900 mb-4">Performance Summary</h3>
                <div className="space-y-4">
                  {[
                    { metric: 'Linked Athletes', value: String(athletes.length) },
                    { metric: 'Avg Performance Score', value: `${avgScore}/10` },
                    { metric: 'Total Sessions Logged', value: String(totalSessions) },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-600">{r.metric}</span>
                      <span className="font-bold text-navy-900">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}