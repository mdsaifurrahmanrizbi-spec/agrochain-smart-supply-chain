import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { agroApi } from '../../services/api';
import { useCart } from '../../context/CartContext';

export const BuyerPaymentResult: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const orderId = params.get('orderId') || '';
  const transactionId = params.get('transactionId') || '';
  const cancelled = params.get('cancelled') === '1';
  const [status, setStatus] = useState<'checking' | 'paid' | 'pending' | 'cancelled' | 'error'>(
    cancelled ? 'cancelled' : transactionId ? 'checking' : 'pending'
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (cancelled) {
      setStatus('cancelled');
      setMessage('Payment was cancelled. Your order remains unpaid; you can retry from checkout.');
      return;
    }
    if (!orderId || !transactionId) {
      setStatus('pending');
      setMessage('No completed transaction was returned. If you already paid, refresh later or contact support with your order ID.');
      return;
    }

    let active = true;
    agroApi.verifyRupantorPayPayment(orderId, transactionId)
      .then((result) => {
        if (!active) return;
        if (result.status === 'PAID') {
          setStatus('paid');
          setMessage('RupantorPay verified this transaction successfully.');
          clearCart();
        } else {
          setStatus('pending');
          setMessage('The gateway has not confirmed payment yet.');
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Payment verification failed.');
      });
    return () => { active = false; };
  }, [orderId, transactionId, cancelled, clearCart]);

  const Icon = status === 'paid' ? CheckCircle : status === 'cancelled' || status === 'error' ? XCircle : Clock;
  const color = status === 'paid' ? 'text-emerald-700' : status === 'cancelled' || status === 'error' ? 'text-red-700' : 'text-amber-700';

  return (
    <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
      <Icon className={`w-12 h-12 mx-auto ${color}`} />
      <h1 className="text-xl font-bold text-slate-900">
        {status === 'paid' ? 'Payment verified' : status === 'checking' ? 'Verifying payment…' : status === 'cancelled' ? 'Payment cancelled' : status === 'error' ? 'Verification needs attention' : 'Payment pending'}
      </h1>
      <p className="text-sm text-slate-600">{message || 'Checking transaction directly with RupantorPay.'}</p>
      {orderId && <p className="text-xs text-slate-500">Order: <span className="font-mono">{orderId}</span></p>}
      {transactionId && <p className="text-xs text-slate-500">Transaction: <span className="font-mono">{transactionId}</span></p>}
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        {status === 'paid' && <button onClick={() => navigate(`/buyer/tracking/${encodeURIComponent(orderId)}`)} className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold">View order</button>}
        {(status === 'cancelled' || status === 'error' || status === 'pending') && <Link to="/buyer/orders" className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700">View my orders</Link>}
      </div>
    </div>
  );
};
