import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'athlete', phone: '', city: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      toast.error(t('auth.pleaseFillFields'));
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error(t('auth.passwordsNotMatch'));
      return;
    }
    if (form.password.length < 6) {
      toast.error(t('auth.passwordMinLength'));
      return;
    }
    setLoading(true);
    try {
      const user = await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        phone: form.phone || undefined,
        city: form.city || undefined,
      });
      toast.success(`${t('auth.welcomeToPlatform')}, ${user.firstName}!`);
      if (user.role === 'coach') router.push('/coach');
      else router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <img src="/logo.jpeg" alt="GoAbility" className="w-10 h-10 rounded-lg object-cover" />
            </Link>
            <h1 className="text-2xl font-bold text-navy-900">{t('auth.registerTitle')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('auth.registerSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.firstName')} *</label>
                <input type="text" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})}
                  className="input-field" placeholder={t('auth.firstNamePlaceholder')} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.lastName')} *</label>
                <input type="text" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})}
                  className="input-field" placeholder={t('auth.lastNamePlaceholder')} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')} *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                  className="input-field" placeholder={t('auth.emailPlaceholder')} required />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')} *</label>
                <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
                  className="input-field" placeholder={t('auth.passwordPlaceholder')} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.confirmPassword')} *</label>
                <input type="password" value={form.confirmPassword} onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                  className="input-field" placeholder={t('auth.passwordPlaceholder')} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.role')}</label>
              <div className="grid grid-cols-2 gap-3">
                {['athlete', 'coach'].map((role) => (
                  <button key={role} type="button" onClick={() => setForm({...form, role})}
                    className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                      form.role === role
                        ? 'border-ocean-500 bg-ocean-500/10 text-ocean-500'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {role === 'athlete' ? t('auth.athlete') : t('auth.coach')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phone')}</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                  className="input-field" placeholder={t('auth.phonePlaceholder')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.city')}</label>
                <input type="text" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})}
                  className="input-field" placeholder={t('auth.cityPlaceholder')} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? t('auth.creatingAccount') : t('auth.signUp')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t('auth.hasAccount')}{' '}
              <Link href="/auth/login" className="text-ocean-500 font-medium hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-light rounded-xl">
            <p className="text-xs text-gray-500 text-center">{t('auth.termsText')}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
