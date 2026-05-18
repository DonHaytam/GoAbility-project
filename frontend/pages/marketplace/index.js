import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { productsAPI } from '../../lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faWheelchair, faStar } from '@fortawesome/free-solid-svg-icons';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

const CATEGORIES = ['Wheelchair', 'Prosthetic', 'Visual Aid', 'Hearing Aid', 'Sports Apparel', 'Training Equipment'];

export default function Marketplace() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', search: '', sort: 'newest', minPrice: '', maxPrice: '' });

  useEffect(() => {
    setLoading(true);
    productsAPI.getAll(filters).then(r => setProducts(r.data.products || [])).catch(() => setProducts([])).finally(() => setLoading(false));
  }, [filters]);

  return (
    <Layout>
      <section className="pt-32 pb-16 gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('marketplace.title')}</h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">{t('marketplace.subtitle')}</p>
          </motion.div>

          <motion.div {...fadeUp} className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <input type="text" value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})}
                placeholder={t('marketplace.search')}
                className="flex-1 px-5 py-3.5 rounded-xl text-navy-900 bg-white/95 focus:outline-none focus:ring-2 focus:ring-ocean-500" />
              <select value={filters.sort} onChange={(e) => setFilters({...filters, sort: e.target.value})}
                className="px-4 py-3.5 rounded-xl text-navy-900 bg-white/95 focus:outline-none focus:ring-2 focus:ring-ocean-500">
                <option value="newest">{t('marketplace.sortNewest')}</option>
                <option value="price_asc">{t('marketplace.sortPriceLow')}</option>
                <option value="price_desc">{t('marketplace.sortPriceHigh')}</option>
                <option value="rating">{t('marketplace.sortRating')}</option>
              </select>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 mb-8">
              <button onClick={() => setFilters({...filters, category: ''})}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!filters.category ? 'bg-ocean-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                {t('marketplace.all')}
              </button>
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setFilters({...filters, category: cat === filters.category ? '' : cat})}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filters.category === cat ? 'bg-ocean-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <FontAwesomeIcon icon={faSearch} className="text-5xl mb-4" />
              <h3 className="text-xl font-bold text-navy-900 mb-2">{t('marketplace.noProducts')}</h3>
              <p className="text-gray-500">{t('marketplace.noProductsFilter')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="card group hover:-translate-y-1">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform overflow-hidden">
                    <FontAwesomeIcon icon={faWheelchair} className="text-gray-400 text-5xl" />
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-navy-900 truncate">{p.name}</h3>
                      <p className="text-xs text-gray-400 capitalize">{p.category}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.is_rentable ? 'bg-green-mint/20 text-green-mint' : 'bg-ocean-500/10 text-ocean-500'}`}>
                      {p.is_rentable ? t('marketplace.rent') : t('marketplace.buy')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <span className="text-xl font-bold text-ocean-500">{p.price} MAD</span>
                      {p.rental_price && <span className="text-xs text-gray-400 block">or {p.rental_price} MAD/{p.rental_period}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <FontAwesomeIcon icon={faStar} className="text-yellow-400" /> <span>{p.rating || 'New'}</span>
                    </div>
                  </div>
                  <Link href={`/marketplace/${p.id}`}
                    className="mt-4 block w-full text-center py-2.5 border-2 border-ocean-500 text-ocean-500 rounded-lg font-medium text-sm hover:bg-ocean-500 hover:text-white transition-all">
                    {t('marketplace.details')}
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
