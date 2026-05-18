import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { productsAPI, communityAPI } from '../lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faDumbbell, faChartBar, faHandshake, faHeart, faCity, faMedal, faUsers, faBox, faChalkboardTeacher, faChartLine, faWheelchair } from '@fortawesome/free-solid-svg-icons';

const fadeUp = { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };
const stagger = { initial: {}, whileInView: { transition: { staggerChildren: 0.15 } }, viewport: { once: true } };

const features = [
  { icon: faStore, key: 'marketplace', color: 'from-ocean-500 to-blue-600' },
  { icon: faDumbbell, key: 'training', color: 'from-green-teal to-green-mint' },
  { icon: faChartBar, key: 'tracking', color: 'from-green-mint to-green-apple' },
  { icon: faHandshake, key: 'community', color: 'from-navy-700 to-ocean-500' },
];

const testimonials = [
  { name: 'Ahmed Benali', role: 'Para-athlete', location: 'Casablanca', text: 'GoAbility changed my life. I found the perfect racing wheelchair and a coach who believed in me. Now I am training for the Paralympics.', avatar: 'AB', rating: 5 },
  { name: 'Fatima Zahra', role: 'Wheelchair Basketball', location: 'Rabat', text: 'The community here is incredible. I have connected with other athletes, found mentorship, and improved my game tremendously.', avatar: 'FZ', rating: 5 },
  { name: 'Dr. Karim Othman', role: 'Sports Physiotherapist', location: 'Marrakech', text: 'As a healthcare professional, I am impressed by the quality of training programs and the holistic approach to athlete wellness.', avatar: 'KO', rating: 5 },
];

export default function Home() {
  const { t, i18n } = useTranslation();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [stories, setStories] = useState([]);
  const rtl = i18n.language === 'ar';

  useEffect(() => {
    productsAPI.getFeatured().then(r => setFeaturedProducts(r.data.products || [])).catch(() => {});
    communityAPI.getStories().then(r => setStories(r.data.stories || [])).catch(() => {});
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-95" />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: rtl ? 40 : -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-green-mint rounded-full animate-pulse" />
                <span className="text-white/80 text-sm font-medium">{t('hero.socialImpact')}</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                {t('hero.title')}
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed max-w-xl">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/register" className="btn-green text-lg px-8 py-4 shadow-lg shadow-green-mint/30">
                  {t('hero.cta')}
                </Link>
                <Link href="/about" className="btn-white text-lg px-8 py-4">
                  {t('hero.learnMore')}
                </Link>
              </div>
              <div className="flex items-center gap-8 mt-12">
                {[{ num: '500+', label: t('metrics.athletes') }, { num: '50+', label: t('metrics.coaches') }, { num: '98%', label: t('metrics.satisfaction') }].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-white">{stat.num}</div>
                    <div className="text-white/60 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:flex items-center justify-center">
              <div className="relative w-96 h-96">
                <div className="absolute inset-0 bg-gradient-to-br from-ocean-500/30 to-green-mint/30 rounded-full animate-float" />
                <div className="absolute inset-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center">
                  <div className="text-center p-8">
                    <FontAwesomeIcon icon={faWheelchair} className="text-7xl mb-4" />
                    <div className="text-white font-bold text-xl">Inclusive Sports</div>
                    <div className="text-white/60 text-sm">For Everyone</div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-mint/30 rounded-xl backdrop-blur-sm border border-green-mint/30 flex items-center justify-center animate-delay-200">
                  <span className="text-white font-bold text-lg">#1</span>
                </div>
                <div className="absolute -bottom-4 -left-4 w-32 h-20 bg-ocean-500/30 rounded-xl backdrop-blur-sm border border-ocean-500/30 flex items-center justify-center animate-delay-500">
                  <span className="text-white text-sm font-medium">Morocco</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-light to-transparent" />
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <span className="text-ocean-500 font-semibold text-sm tracking-wider uppercase">Our Mission</span>
            <h2 className="section-title mt-2">{t('mission.title')}</h2>
            <p className="text-lg text-gray-600 leading-relaxed mt-6">
              {t('mission.desc')}
            </p>
          </motion.div>
          <motion.div {...fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
            {[
              { value: '10,000+', label: t('hero.livesImpacted'), icon: faHeart },
              { value: '50+', label: t('hero.partnerAssociations'), icon: faHandshake },
              { value: '12', label: t('hero.citiesCovered'), icon: faCity },
              { value: '5', label: t('hero.sportsDisciplines'), icon: faMedal },
            ].map((s) => (
              <div key={s.label} className="text-center p-4">
                <div className="text-3xl mb-2"><FontAwesomeIcon icon={s.icon} /></div>
                <div className="text-2xl font-bold text-navy-900">{s.value}</div>
                <div className="text-gray-500 text-sm">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="section-title">{t('features.title')}</h2>
            <p className="section-subtitle">{t('features.subtitle')}</p>
          </motion.div>
          <motion.div {...stagger} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat) => (
              <motion.div key={feat.key} {...fadeUp} className="card group hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  <FontAwesomeIcon icon={feat.icon} className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-2">{t(`features.${feat.key}`)}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t(`features.${feat.key}Desc`)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats / Impact Metrics */}
      <section className="py-20 gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('hero.socialImpactTitle')}</h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">{t('hero.socialImpactDesc')}</p>
          </motion.div>
          <motion.div {...stagger} className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '5,000+', label: t('metrics.athletes'), icon: faUsers },
              { value: '2,500+', label: t('metrics.products'), icon: faBox },
              { value: '200+', label: t('metrics.coaches'), icon: faChalkboardTeacher },
              { value: '15,000+', label: t('metrics.sessions'), icon: faChartLine },
            ].map((stat) => (
              <motion.div key={stat.label} {...fadeUp} className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                <div className="text-4xl mb-3"><FontAwesomeIcon icon={stat.icon} /></div>
                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="section-title">{t('testimonials.title')}</h2>
            <p className="section-subtitle">{t('testimonials.subtitle')}</p>
          </motion.div>
          <motion.div {...stagger} className="grid md:grid-cols-3 gap-8">
            {testimonials.map((item, i) => (
              <motion.div key={i} {...fadeUp} className="card relative">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(item.rating)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">"{item.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {item.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-navy-900 text-sm">{item.name}</div>
                    <div className="text-gray-500 text-xs">{item.role} · {item.location}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-20 bg-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center mb-12">
              <h2 className="section-title">{t('marketplace.featured')}</h2>
            </motion.div>
            <motion.div {...stagger} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map((p) => (
                <motion.div key={p.id} {...fadeUp} className="card group">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center text-gray-400 text-4xl group-hover:scale-105 transition-transform">
                    <FontAwesomeIcon icon={faWheelchair} className="text-gray-400 text-4xl" />
                  </div>
                  <h3 className="font-semibold text-navy-900 mb-1 truncate">{p.name}</h3>
                  <p className="text-ocean-500 font-bold text-lg">{p.price} MAD</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-green-mint/20 text-green-mint font-medium px-2 py-0.5 rounded-full">{p.category}</span>
                    <span className="text-xs text-gray-400">{p.condition}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <motion.div {...fadeUp} className="text-center mt-10">
              <Link href="/marketplace" className="btn-primary">{t('marketplace.details')}</Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-700 to-ocean-500" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(82,183,136,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(0,119,182,0.15) 0%, transparent 50%)`,
        }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">{t('cta.title')}</h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">{t('cta.subtitle')}</p>
            <Link href="/auth/register" className="btn-green text-lg px-10 py-4 shadow-lg shadow-green-mint/30 inline-block">
              {t('cta.button')}
            </Link>
            <div className="flex items-center justify-center gap-8 mt-12 text-white/60 text-sm">
              <span>✓ {t('hero.freeAccount')}</span>
              <span>✓ {t('hero.noCreditCard')}</span>
              <span>✓ {t('hero.cancelAnytime')}</span>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
