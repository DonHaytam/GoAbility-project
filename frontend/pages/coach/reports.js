import React, { useState } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function CoachReports() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const progressData = {
    labels: ['Ahmed B.', 'Fatima Z.', 'Karim O.', 'Sara L.', 'Hassan M.'],
    datasets: [{
      label: 'Progress %',
      data: [85, 72, 90, 65, 78],
      backgroundColor: ['#0077B6', '#52B788', '#70C1B3', '#74C69D', '#0B2545'],
      borderRadius: 6,
    }]
  };

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-light flex pt-16 md:pt-20">
        <DashboardSidebar role="coach" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mb-4" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-navy-900 mb-8">Progress Reports</h1>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="card">
              <h3 className="font-bold text-navy-900 mb-4">Athlete Progress Overview</h3>
              <Bar data={progressData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }} />
            </div>
            <div className="card">
              <h3 className="font-bold text-navy-900 mb-4">Performance Summary</h3>
              <div className="space-y-4">
                {[
                  { metric: 'Average Completion Rate', value: '78%', trend: '+12%' },
                  { metric: 'Avg Performance Score', value: '7.4/10', trend: '+0.8' },
                  { metric: 'Total Sessions Logged', value: '342', trend: '+45' },
                  { metric: 'Active Athletes', value: '5', trend: '+2' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-600">{r.metric}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-navy-900">{r.value}</span>
                      <span className="text-xs text-green-mint">{r.trend}</span>
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
