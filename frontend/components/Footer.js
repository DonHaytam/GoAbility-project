import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-900 text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.jpeg" alt="GoAbility" className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <span className="text-xl font-bold">GoAbility</span>
                <span className="text-xs text-gray-400 block">HandiSport Connect</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-4">
              {['facebook', 'twitter', 'instagram', 'linkedin'].map((s) => (
                <a key={s} href={`https://${s}.com/goability`} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-ocean-500 transition-colors"
                  aria-label={s}>
                  <span className="text-sm font-semibold">{s[0].toUpperCase()}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3">
              {[
                { href: '/marketplace', label: 'nav.marketplace' },
                { href: '/training', label: 'nav.training' },
                { href: '/community', label: 'nav.community' },
                { href: '/about', label: 'nav.about' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">{t('footer.support')}</h3>
            <ul className="space-y-3">
              {[
                { href: '/contact', label: 'footer.contact' },
                { href: '/about', label: 'nav.about' },
                { href: '/community', label: 'community.stories' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">{t('footer.newsletter')}</h3>
            <p className="text-gray-400 text-sm mb-4">Stay updated with our latest news and events.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input type="email" placeholder={t('footer.newsletterPlaceholder')}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-ocean-500"
                aria-label={t('footer.newsletterPlaceholder')} />
              <button type="submit" className="px-4 py-2.5 bg-ocean-500 text-white rounded-lg text-sm font-medium hover:bg-ocean-400 transition-colors">
                {t('footer.subscribe')}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            &copy; {year} GoAbility (HandiSport Connect). {t('footer.rights')}
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
