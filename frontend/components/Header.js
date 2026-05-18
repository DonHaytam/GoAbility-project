import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { key: 'home', href: '/', label: 'nav.home' },
  { key: 'about', href: '/about', label: 'nav.about' },
  { key: 'marketplace', href: '/marketplace', label: 'nav.marketplace' },
  { key: 'training', href: '/training', label: 'nav.training' },
  { key: 'community', href: '/community', label: 'nav.community' },
  { key: 'contact', href: '/contact', label: 'nav.contact' },
];

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(
    router.pathname.startsWith('/dashboard') ||
    router.pathname.startsWith('/coach') ||
    router.pathname.startsWith('/admin')
  );
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isDash = router.pathname.startsWith('/dashboard') || router.pathname.startsWith('/coach') || router.pathname.startsWith('/admin');
      setScrolled(isDash || window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [router.pathname]);

  useEffect(() => {
    setIsOpen(false);
  }, [router.asPath]);

  const switchLang = (lng) => {
    i18n.changeLanguage(lng);
    setLangOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/auth/login';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'coach': return '/coach';
      default: return '/dashboard';
    }
  };

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'glass-effect shadow-lg' : 'bg-transparent'}`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" role="navigation" aria-label="Main navigation">
        <div className="flex items-center h-16 md:h-20">
          <div className="flex-[1_1_0] min-w-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0" aria-label="GoAbility Home">
              <div className="transform group-hover:scale-105 transition-transform flex-shrink-0">
                <img src="/logo.jpeg" alt="GoAbility" className="w-9 h-9 md:w-10 md:h-10 rounded-lg object-cover" />
              </div>
              <div className="hidden sm:block">
                <span className={`text-lg md:text-xl font-bold leading-tight ${scrolled ? 'text-navy-900' : 'text-white'}`}>GoAbility</span>
                <span className={`text-[10px] md:text-xs block leading-tight ${scrolled ? 'text-gray-500' : 'text-white/60'}`}>HandiSport Connect</span>
              </div>
            </Link>
          </div>

          <div className="hidden lg:flex items-center justify-center gap-0.5 mx-2 flex-shrink-0">
            {NAV_ITEMS.map((item) => (
              <Link key={item.key} href={item.href}
                className={`px-2 xl:px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  router.pathname === item.href || router.pathname.startsWith(item.href + '/')
                    ? scrolled ? 'text-ocean-500 bg-ocean-500/10' : 'text-white bg-white/15'
                    : scrolled ? 'text-gray-600 hover:text-ocean-500 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                aria-current={router.pathname === item.href ? 'page' : undefined}>
                {t(item.label)}
              </Link>
            ))}
          </div>

          <div className="flex-[1_1_0] min-w-0 flex items-center justify-end gap-1 md:gap-2">
            <div className="relative flex-shrink-0">
              <button onClick={() => setLangOpen(!langOpen)}
                className={`px-2 py-1 text-sm font-medium rounded-lg transition-colors ${scrolled ? 'text-gray-600 hover:text-ocean-500 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                aria-label={t('nav.language')} aria-expanded={langOpen}>
                {i18n.language?.toUpperCase()}
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[120px] z-50">
                    {['en', 'fr', 'ar'].map((lng) => (
                      <button key={lng} onClick={() => switchLang(lng)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          i18n.language === lng ? 'text-ocean-500 font-semibold' : 'text-gray-700'
                        }`}>
                        {lng === 'en' ? 'English' : lng === 'fr' ? 'Français' : 'العربية'}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <div className="hidden sm:flex items-center gap-1 md:gap-2 flex-shrink-0">
                <Link href={getDashboardLink()}
                  className="btn-primary text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 whitespace-nowrap">
                  {t('nav.dashboard')}
                </Link>
                <button onClick={() => { logout(); router.push('/'); }}
                  className={`px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${scrolled ? 'text-gray-600 hover:text-red-500' : 'text-white/80 hover:text-white'}`}>
                  {t('nav.logout')}
                </button>
                <div className="w-7 h-7 md:w-8 md:h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs md:text-sm font-semibold flex-shrink-0">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 md:gap-2 flex-shrink-0">
                <Link href="/auth/login" className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${scrolled ? 'text-gray-600 hover:text-ocean-500' : 'text-white/80 hover:text-white'}`}>
                  {t('nav.login')}
                </Link>
                <Link href="/auth/register" className="btn-primary text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 whitespace-nowrap">
                  {t('nav.register')}
                </Link>
              </div>
            )}

            <button onClick={() => setIsOpen(!isOpen)} className={`lg:hidden p-1.5 md:p-2 rounded-lg transition-colors flex-shrink-0 ${scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`} aria-label="Toggle menu" aria-expanded={isOpen}>
              <svg className={`w-5 h-5 md:w-6 md:h-6 ${scrolled ? 'text-gray-700' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden border-t border-gray-100 bg-white">
              <div className="py-4 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link key={item.key} href={item.href}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                      router.pathname === item.href ? 'text-ocean-500 bg-ocean-500/10' : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                    {t(item.label)}
                  </Link>
                ))}
                <div className="border-t border-gray-100 pt-3 mt-3 space-y-2 px-3">
                  {user ? (
                    <>
                      <Link href={getDashboardLink()} className="block btn-primary text-sm text-center">{t('nav.dashboard')}</Link>
                      <button onClick={() => { logout(); router.push('/'); }} className="block w-full text-left py-2 text-sm text-red-500">{t('nav.logout')}</button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login" className="block text-center py-2 text-sm font-medium text-gray-700">{t('nav.login')}</Link>
                      <Link href="/auth/register" className="block btn-primary text-sm text-center">{t('nav.register')}</Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
