import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const team = [
  { name: 'Haytam Lamrhnbar', role: 'Founder & CEO', bio: 'Visionary leader driving inclusive sports innovation.', avatar: 'HL' },
  { name: 'Mohamed Amine Fourkani', role: 'CTO', bio: 'Full-stack developer and accessibility advocate.', avatar: 'MF' },
  { name: 'Halima Faraj', role: 'Head of Community', bio: 'Community organizer and inclusive sports advocate.', avatar: 'HF' },
  { name: 'Khaoula Zahrane', role: 'Product Lead', bio: 'UX specialist focused on inclusive design.', avatar: 'KZ' },
];

export default function About() {
  const { t } = useTranslation();

  return (
    <Layout>
      <section className="pt-32 pb-20 gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('about.title')}</h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">{t('about.subtitle')}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp}>
              <h2 className="section-title">{t('about.visionTitle')}</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('about.visionDesc1')}
              </p>
              <p className="text-gray-600 leading-relaxed">
                {t('about.visionDesc2')}
              </p>
            </motion.div>
            <motion.div {...fadeUp} className="bg-light rounded-2xl p-8">
              <h3 className="text-xl font-bold text-navy-900 mb-4">{t('about.goalsTitle')}</h3>
              <ul className="space-y-4">
                {[
                  'Reach 100,000 athletes across Morocco by 2028',
                  'Partner with 200+ associations and sports clubs',
                  'Launch adaptive sports centers in all 12 Moroccan regions',
                  'Create an AI-powered personalized training system',
                  'Establish GoAbility as the standard for inclusive sports tech in Africa',
                ].map((goal, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-mint/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-mint text-sm">✓</span>
                    </span>
                    <span className="text-gray-700">{goal}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="section-title">{t('about.teamTitle')}</h2>
            <p className="section-subtitle">{t('about.teamSubtitle')}</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, i) => (
              <motion.div key={i} {...fadeUp} className="card text-center group hover:-translate-y-1">
                <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {member.avatar}
                </div>
                <h3 className="font-bold text-navy-900">{member.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 gradient-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('about.partnersTitle')}</h2>
            <p className="text-white/80 mb-10">{t('about.partnersSubtitle')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              {['Ministry of Sports', 'Moroccan Paralympic Committee', 'UNICEF Morocco', 'Tech4Good Africa'].map((partner, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="text-lg font-bold">{partner}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
