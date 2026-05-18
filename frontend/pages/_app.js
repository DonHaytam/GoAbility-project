import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { useEffect } from 'react';
import i18n from '../lib/i18n';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const updateDir = (lng) => {
      const dir = lng === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = lng;
    };
    updateDir(i18n.language);
    i18n.on('languageChanged', updateDir);
    return () => { i18n.off('languageChanged', updateDir); };
  }, []);

  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="GoAbility - The leading inclusive sports technology platform for people with disabilities in Morocco and beyond." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Component {...pageProps} />
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      }} />
    </AuthProvider>
  );
}

export default MyApp;
