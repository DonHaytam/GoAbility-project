import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { trainingAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDumbbell, faCalendarAlt, faClipboardList, faBookOpen } from '@fortawesome/free-solid-svg-icons';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

const DISABILITY_TYPES = ['Physical', 'Visual', 'Hearing', 'Intellectual', 'Multiple'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export default function Training() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [filter, setFilter] = useState({ disabilityType: '', difficulty: '' });
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      trainingAPI.getPrograms(filter),
      user ? trainingAPI.getEnrollments() : Promise.resolve({ data: { enrollments: [] } })
    ]).then(([progs, enrs]) => {
      setPrograms(progs.data.programs || []);
      setEnrollments(enrs.data.enrollments || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadData() }, [filter, user]);

  const handleEnroll = async (programId) => {
    if (!user) return toast.error('Please login to enroll');
    try {
      await trainingAPI.enroll(programId);
      toast.success('Enrolled successfully!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    }
  };

  const enrolledIds = enrollments.map(e => e.program_id);

  return (
    <Layout>
      <section className="pt-32 pb-16 gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('training.title')}</h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">{t('training.subtitle')}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 mb-8">
              <button onClick={() => setFilter({...filter, disabilityType: ''})}
                className={`px-4 py-2 rounded-full text-sm font-medium ${!filter.disabilityType ? 'bg-ocean-500 text-white' : 'bg-white text-gray-600'}`}>
                {t('training.allTypes')}
              </button>
            {DISABILITY_TYPES.map(dt => (
              <button key={dt} onClick={() => setFilter({...filter, disabilityType: dt === filter.disabilityType ? '' : dt})}
                className={`px-4 py-2 rounded-full text-sm font-medium ${filter.disabilityType === dt ? 'bg-ocean-500 text-white' : 'bg-white text-gray-600'}`}>
                {dt}
              </button>
            ))}
          </div>

          {user && enrollments.length > 0 && (
            <motion.div {...fadeUp} className="mb-12">
              <h2 className="text-2xl font-bold text-navy-900 mb-6">{t('training.progress')}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map(en => (
                  <div key={en.id} className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-navy-900">{en.name}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${en.status === 'active' ? 'bg-green-mint/20 text-green-mint' : 'bg-gray-100 text-gray-500'}`}>
                        {en.status}
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>{t('training.progLabel')}</span>
                        <span>{en.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-ocean-500 to-green-mint rounded-full h-2 transition-all" style={{ width: `${en.progress}%` }} />
                      </div>
                    </div>
                    <Link href="/dashboard/training" className="text-ocean-500 text-sm font-medium hover:underline">{t('training.continueLabel')}</Link>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <h2 className="text-2xl font-bold text-navy-900 mb-6">{t('training.availablePrograms')}</h2>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <div key={i} className="card animate-pulse"><div className="h-48 bg-gray-200 rounded-lg mb-4" /><div className="h-4 bg-gray-200 rounded w-3/4 mb-2" /><div className="h-4 bg-gray-200 rounded w-1/2" /></div>)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="card group hover:-translate-y-1">
                  <div className="bg-gradient-to-br from-ocean-500/10 to-green-mint/10 rounded-xl p-6 mb-4">
                    <FontAwesomeIcon icon={faDumbbell} className="text-4xl mb-2" />
                    <span className="text-xs font-medium text-ocean-500 bg-ocean-500/10 px-2 py-0.5 rounded-full">
                      {p.disability_type || 'General'}
                    </span>
                  </div>
                  <h3 className="font-bold text-navy-900 text-lg mb-2">{p.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{p.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span><FontAwesomeIcon icon={faCalendarAlt} className="mr-1" /> {p.duration_weeks} {t('training.weeks')}</span>
                    <span><FontAwesomeIcon icon={faClipboardList} className="mr-1" /> {p.sessions_per_week} {t('training.perWeek')}</span>
                    <span className={`capitalize ${p.difficulty === 'beginner' ? 'text-green-mint' : p.difficulty === 'intermediate' ? 'text-yellow-500' : 'text-red-500'}`}>
                      {t(`training.${p.difficulty}`)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-ocean-500">{p.price > 0 ? `${p.price} MAD` : 'Free'}</span>
                    {enrolledIds.includes(p.id) ? (
                      <span className="text-green-mint font-medium text-sm">✓ {t('training.enrolled')}</span>
                    ) : (
                      <button onClick={() => handleEnroll(p.id)}
                        className="px-4 py-2 bg-ocean-500 text-white rounded-lg text-sm font-medium hover:bg-ocean-400 transition-colors">
                        {t('training.enroll')}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && programs.length === 0 && (
            <div className="text-center py-16">
              <FontAwesomeIcon icon={faBookOpen} className="text-5xl mb-4" />
              <h3 className="text-xl font-bold text-navy-900">{t('training.noPrograms')}</h3>
              <p className="text-gray-500">{t('training.tryFilter')}</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
