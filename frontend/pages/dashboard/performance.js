import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { analyticsAPI } from '../../lib/api';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faChartLine, faRocket } from '@fortawesome/free-solid-svg-icons';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

export default function Performance() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const lineData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
    datasets: [
      { label: 'Performance Score', data: [5, 6, 5.5, 7, 7.5, 8, 8.2, 9], borderColor: '#0077B6', backgroundColor: 'rgba(0,119,182,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#0077B6' },
      { label: 'Calories (x100)', data: [3, 3.5, 4, 4.2, 5, 5.5, 6, 6.5], borderColor: '#52B788', backgroundColor: 'rgba(82,183,136,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#52B788' },
    ]
  };

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-light flex pt-16 md:pt-20">
        <DashboardSidebar role="athlete" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mb-4" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-navy-900 mb-8">Performance Analytics</h1>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="card">
              <h3 className="font-bold text-navy-900 mb-4">8-Week Performance Trend</h3>
              <Line data={lineData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, max: 10 } } }} />
            </div>
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Best Performance</div>
                    <div className="text-2xl font-bold text-navy-900">9.0 / 10</div>
                  </div>
                  <FontAwesomeIcon icon={faTrophy} className="text-3xl text-yellow-500" />
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Weekly Average</div>
                    <div className="text-2xl font-bold text-navy-900">7.2 / 10</div>
                  </div>
                  <FontAwesomeIcon icon={faChartLine} className="text-3xl text-ocean-500" />
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Total Improvement</div>
                    <div className="text-2xl font-bold text-green-mint">+80%</div>
                  </div>
                  <FontAwesomeIcon icon={faRocket} className="text-3xl text-purple-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-navy-900 mb-4">Performance Metrics Breakdown</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { label: 'Endurance', value: '85%', color: 'bg-ocean-500' },
                { label: 'Strength', value: '72%', color: 'bg-green-mint' },
                { label: 'Flexibility', value: '68%', color: 'bg-purple-500' },
                { label: 'Speed', value: '78%', color: 'bg-orange-500' },
                { label: 'Coordination', value: '90%', color: 'bg-green-apple' },
                { label: 'Recovery', value: '82%', color: 'bg-teal-500' },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{m.label}</span>
                    <span className="font-medium text-navy-900">{m.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className={`${m.color} rounded-full h-2.5 transition-all`} style={{ width: m.value }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
