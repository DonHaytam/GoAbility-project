import React, { useState } from 'react';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { contactAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faEnvelope, faPhone, faClock } from '@fortawesome/free-solid-svg-icons';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

export default function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error(t('contact.errorRequired'));
      return;
    }
    setSending(true);
    try {
      await contactAPI.send(form);
      toast.success(t('contact.success'));
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error(t('contact.errorFailed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <section className="pt-32 pb-20 gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('contact.title')}</h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">{t('contact.subtitle')}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div {...fadeUp}>
              <h2 className="text-2xl font-bold text-navy-900 mb-6">{t('contact.sendMessage')}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.name')}</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                      className="input-field" placeholder={t('contact.namePlaceholder')} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.email')}</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                      className="input-field" placeholder={t('contact.emailPlaceholder')} required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.subject')}</label>
                  <input type="text" value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})}
                    className="input-field" placeholder={t('contact.subjectPlaceholder')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.message')}</label>
                  <textarea rows="6" value={form.message} onChange={(e) => setForm({...form, message: e.target.value})}
                    className="input-field resize-none" placeholder={t('contact.messagePlaceholder')} required />
                </div>
                <button type="submit" disabled={sending} className="btn-primary w-full">
                  {sending ? t('contact.sending') : t('contact.send')}
                </button>
              </form>
            </motion.div>
            <motion.div {...fadeUp} className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-navy-900 mb-6">{t('contact.info')}</h2>
                <div className="space-y-4">
                  {[
                    { icon: faMapMarkerAlt, label: 'contact.address', value: t('contact.addressValue') },
                    { icon: faEnvelope, label: 'contact.emailLabel', value: 'hello@goability.ma' },
                    { icon: faPhone, label: 'contact.phone', value: t('contact.phoneValue') },
                    { icon: faClock, label: 'contact.hours', value: t('contact.hoursValue') },
                  ].map((info) => (
                    <div key={info.label} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-ocean-500/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                        <FontAwesomeIcon icon={info.icon} />
                      </div>
                      <div>
                        <div className="font-semibold text-navy-900">{t(info.label)}</div>
                        <div className="text-gray-600 text-sm">{info.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="font-bold text-navy-900 text-lg mb-4">{t('contact.partnershipTitle')}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {t('contact.partnershipDesc')}
                </p>
                <a href="mailto:partners@goability.ma" className="text-ocean-500 font-medium hover:underline">{t('contact.partnershipEmail')}</a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
