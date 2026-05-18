import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DashboardSidebar from '../../components/DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import { trainingAPI } from '../../lib/api';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDumbbell, faCalendarAlt, faClipboardList } from '@fortawesome/free-solid-svg-icons';

export default function DashboardTraining() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    if (user) trainingAPI.getEnrollments().then(r => setEnrollments(r.data.enrollments || [])).catch(() => {});
  }, [user]);

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-light flex pt-16 md:pt-20">
        <DashboardSidebar role="athlete" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mb-4" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-navy-900">My Training</h1>
            <Link href="/training" className="btn-primary text-sm px-4 py-2">Browse Programs</Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="card text-center py-16">
              <FontAwesomeIcon icon={faDumbbell} className="text-5xl mb-4" />
              <h3 className="text-xl font-bold text-navy-900 mb-2">No Programs Yet</h3>
              <p className="text-gray-500 mb-6">Enroll in a training program to get started</p>
              <Link href="/training" className="btn-primary">Browse Programs</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {enrollments.map(en => (
                <div key={en.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-navy-900 text-lg">{en.name}</h3>
                      <p className="text-gray-500 text-sm">{en.description}</p>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${en.status === 'active' ? 'bg-green-mint/20 text-green-mint' : en.status === 'completed' ? 'bg-ocean-500/10 text-ocean-500' : 'bg-gray-100 text-gray-500'}`}>
                      {en.status}
                    </span>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{en.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-gradient-to-r from-ocean-500 to-green-mint rounded-full h-2.5 transition-all" style={{ width: `${en.progress}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span><FontAwesomeIcon icon={faCalendarAlt} className="mr-1" /> {en.duration_weeks} weeks</span>
                    <span><FontAwesomeIcon icon={faClipboardList} className="mr-1" /> {en.sessions_per_week} sessions/week</span>
                    <span className="capitalize">Difficulty: {en.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
