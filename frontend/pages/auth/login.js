import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error(t('auth.pleaseFillFields'));
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`${t('auth.welcomeBack')}, ${user.firstName}!`);
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'coach') router.push('/coach');
      else router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <img src="/logo.jpeg" alt="GoAbility" className="w-10 h-10 rounded-lg object-cover" />
            </Link>
            <h1 className="text-2xl font-bold text-navy-900">{t('auth.loginTitle')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('auth.loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                className="input-field" placeholder="your@email.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
                className="input-field" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t('auth.noAccount')}{' '}
              <Link href="/auth/register" className="text-ocean-500 font-medium hover:underline">
                {t('auth.signUp')}
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-light rounded-xl">
            <p className="text-xs text-gray-500 text-center">
              {t('auth.demoAccounts')}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
