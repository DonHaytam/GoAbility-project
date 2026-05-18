import React from 'react';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, hideFooter = false }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1" role="main">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
