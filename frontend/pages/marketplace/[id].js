import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { productsAPI, ordersAPI, paymentAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProductDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderType, setOrderType] = useState('purchase');

  useEffect(() => {
    if (id) {
      productsAPI.getById(id).then(r => setProduct(r.data.product)).catch(() => router.push('/marketplace')).finally(() => setLoading(false));
    }
  }, [id]);

  const handleBuy = async () => {
    if (!user) return router.push('/auth/login');
    setCheckingOut(true);
    try {
      const order = await ordersAPI.create({
        items: [{ productId: product.id, price: product.price, quantity: 1 }],
        orderType,
      });
      await paymentAPI.fakeCheckout({ orderId: order.data.order.id, amount: product.price, paymentMethod: 'credit_card' });
      toast.success(t('marketplace.paymentSuccess'));
      router.push('/dashboard/orders');
    } catch (err) {
      toast.error(t('marketplace.checkoutFailed'));
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) return <Layout><div className="pt-32 text-center py-20"><div className="text-3xl">{t('common.loading')}</div></div></Layout>;
  if (!product) return <Layout><div className="pt-32 text-center py-20"><div className="text-3xl">{t('common.notFound')}</div></div></Layout>;

  return (
    <Layout>
      <section className="pt-32 pb-20 bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/marketplace" className="hover:text-ocean-500">{t('nav.marketplace')}</Link>
            <span>/</span>
            <span className="text-navy-900 font-medium">{product.name}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-8xl">
                ♿
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm bg-ocean-500/10 text-ocean-500 font-medium px-3 py-1 rounded-full">{product.category}</span>
                {product.is_rentable && <span className="text-sm bg-green-mint/20 text-green-mint font-medium px-3 py-1 rounded-full">{t('marketplace.rent')}</span>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">{product.name}</h1>
              <p className="text-gray-600 leading-relaxed mb-6">{product.description || 'Premium adaptive sports equipment designed for performance and comfort.'}</p>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-ocean-500">{product.price} MAD</span>
                {product.rental_price && <span className="text-gray-400">or {product.rental_price} MAD/{product.rental_period}</span>}
              </div>

              {product.is_rentable && (
                <div className="flex gap-3 mb-6">
                  <button onClick={() => setOrderType('purchase')}
                    className={`flex-1 py-3 rounded-lg font-medium text-sm border-2 transition-all ${orderType === 'purchase' ? 'border-ocean-500 bg-ocean-500/10 text-ocean-500' : 'border-gray-200 text-gray-600'}`}>
                    {t('marketplace.buy')} - {product.price} MAD
                  </button>
                  <button onClick={() => setOrderType('rental')}
                    className={`flex-1 py-3 rounded-lg font-medium text-sm border-2 transition-all ${orderType === 'rental' ? 'border-green-mint bg-green-mint/10 text-green-mint' : 'border-gray-200 text-gray-600'}`}>
                    {t('marketplace.rent')} - {product.rental_price} MAD/{product.rental_period}
                  </button>
                </div>
              )}

              <button onClick={handleBuy} disabled={checkingOut}
                className="btn-primary w-full py-4 text-lg mb-4">
                {checkingOut ? t('marketplace.processing') : product.is_rentable && orderType === 'rental' ? t('marketplace.rentNow') : t('marketplace.buyNow')}
              </button>

              {!user && <p className="text-sm text-gray-400 text-center">{t('marketplace.loginToPurchase')} <Link href="/auth/login" className="text-ocean-500 hover:underline">{t('auth.login')}</Link> {t('marketplace.toPurchase')}</p>}

              <div className="border-t border-gray-200 mt-8 pt-8">
                <h3 className="font-bold text-navy-900 mb-4">{t('marketplace.specifications')}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">{t('marketplace.brand')}:</span> <span className="font-medium">{product.brand || t('common.generic')}</span></div>
                  <div><span className="text-gray-500">{t('marketplace.condition')}:</span> <span className="font-medium capitalize">{product.condition}</span></div>
                  <div><span className="text-gray-500">{t('marketplace.category')}:</span> <span className="font-medium">{product.category}</span></div>
                  <div><span className="text-gray-500">{t('marketplace.stock')}:</span> <span className="font-medium">{product.stock_count} {t('marketplace.units')}</span></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
