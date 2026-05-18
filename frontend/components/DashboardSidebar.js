import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faUser, faBox, faDumbbell, faChartLine, faHeart, faComments, faUsers, faShoppingCart, faChalkboardTeacher } from '@fortawesome/free-solid-svg-icons';

const athleteLinks = [
  { href: '/dashboard', label: 'dashboard.overview', icon: faChartBar },
  { href: '/dashboard/profile', label: 'dashboard.profile', icon: faUser },
  { href: '/dashboard/orders', label: 'dashboard.orders', icon: faBox },
  { href: '/dashboard/training', label: 'dashboard.training', icon: faDumbbell },
  { href: '/dashboard/performance', label: 'dashboard.performance', icon: faChartLine },
  { href: '/dashboard/saved', label: 'dashboard.saved', icon: faHeart },
  { href: '/dashboard/messages', label: 'dashboard.messages', icon: faComments },
];

const coachLinks = [
  { href: '/coach', label: 'dashboard.overview', icon: faChartBar },
  { href: '/coach/athletes', label: 'coach.athletes', icon: faUsers },
  { href: '/coach/programs', label: 'coach.programs', icon: faDumbbell },
  { href: '/coach/reports', label: 'coach.reports', icon: faChartLine },
  { href: '/dashboard/messages', label: 'dashboard.messages', icon: faComments },
];

const adminLinks = [
  { href: '/admin', label: 'admin.dashboard', icon: faChartBar },
  { href: '/admin/users', label: 'admin.users', icon: faUsers },
  { href: '/admin/products', label: 'admin.products', icon: faBox },
  { href: '/admin/orders', label: 'admin.orders', icon: faShoppingCart },
  { href: '/admin/analytics', label: 'admin.analytics', icon: faChartLine },
  { href: '/admin/coaches', label: 'admin.coaches', icon: faChalkboardTeacher },
  { href: '/admin/community', label: 'admin.community', icon: faComments },
];

export default function DashboardSidebar({ role, isOpen, onClose }) {
  const { t } = useTranslation();
  const router = useRouter();

  const links = role === 'admin' ? adminLinks : role === 'coach' ? coachLinks : athleteLinks;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:sticky top-0 lg:top-20 h-screen lg:h-[calc(100vh-5rem)] w-64 bg-white border-r border-gray-200 shadow-lg z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6">
          <nav className="space-y-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  router.pathname === link.href
                    ? 'bg-ocean-500/10 text-ocean-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-navy-900'
                }`}>
                <FontAwesomeIcon icon={link.icon} className="text-lg w-5" />
                <span>{t(link.label)}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
