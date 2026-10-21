import express from 'express';
import { randomUUID } from 'node:crypto';
import { pool } from './db.js';
import { requireAuth } from './auth.js';

export const paymentRouter = express.Router();
const GATEWAY = 'https://payment.rupantorpay.com/api/payment';
const SITE = process.env.FRONTEND_URL?.replace(/\/$/, '');
const API = process.env.PUBLIC_API_URL?.replace(/\/$/, '');

async function gatewayRequest(path, body) {
  if (!process.env.RUPANTORPAY_API_KEY) throw new Error('RupantorPay is not configured');
  const response = await fetch(GATEWAY + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.RUPANTORPAY_API_KEY,
      'X-CLIENT': new URL(SITE).host,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Payment provider request failed');
  return response.json();
}

export async function initializePayments() {
  await pool.query(`CREATE TABLE IF NOT EXISTS rupantorpay_payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE,
    buyer_id TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','COMPLETED')),
    transaction_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}

paymentRouter.post('/checkout', requireAuth, async (req, res) => {
  if (req.auth.role !== 'buyer') return res.status(403).json({ message: 'Buyer access required' });
  if (!SITE || !API) return res.status(503).json({ message: 'Payment URLs are not configured' });
  const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId : '';
  if (!orderId || orderId.length > 150) return res.status(400).json({ message: 'Invalid order ID' });
  try {
    const result = await pool.query("SELECT data FROM agrochain_records WHERE resource = 'orders' AND id = $1", [orderId]);
    const order = result.rows[0]?.data;
    if (!order || order.buyerId !== req.auth.sub) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentMethod !== 'ONLINE' || order.paymentStatus === 'PAID') return res.status(409).json({ message: 'Order is not awaiting online payment' });
    const amount = Number(order.totalAmount);
    if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100) return res.status(400).json({ message: 'Invalid order amount' });
    const paymentId = randomUUID();
    const saved = await pool.query(
      `INSERT INTO rupantorpay_payments (id,order_id,buyer_id,amount)
       VALUES ($1,$2,$3,$4) ON CONFLICT (order_id) DO NOTHING RETURNING id`,
      [paymentId,orderId,req.auth.sub,amount.toFixed(2)]
    );
    if (!saved.rowCount) return res.status(409).json({ message: 'Payment already initiated for this order; contact support if interrupted' });
    const successUrl = new URL(API + '/payments/return');
    successUrl.searchParams.set('paymentId', paymentId);
    const cancelUrl = new URL(API + '/payments/cancel');
    cancelUrl.searchParams.set('paymentId', paymentId);
    const gateway = await gatewayRequest('/checkout', {
      fullname: order.buyerName,
      email: req.auth.email,
      amount: amount.toFixed(2),
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      metadata: { order_id: orderId, payment_id: paymentId },
    });
    if (!gateway.status || typeof gateway.payment_url !== 'string' ||
        !gateway.payment_url.startsWith('https://payment.rupantorpay.com/')) {
      return res.status(502).json({ message: 'Provider did not return a valid payment URL' });
    }
    return res.json({ paymentUrl: gateway.payment_url });
  } catch (error) {
    console.error('Payment checkout failed:', error.message);
    return res.status(502).json({ message: 'Could not start payment; order remains unpaid' });
  }
});

async function verifyPayment(paymentId, transactionId) {
  if (!paymentId || !transactionId || transactionId.length > 100) return false;
  const verification = await gatewayRequest('/verify-payment', { transaction_id: transactionId });
  if (verification.status !== 'COMPLETED' || verification.currency !== 'BDT' ||
      verification.transaction_id !== transactionId) return false;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const paymentResult = await client.query('SELECT * FROM rupantorpay_payments WHERE id=$1 FOR UPDATE', [paymentId]);
    const payment = paymentResult.rows[0];
    if (!payment) { await client.query('ROLLBACK'); return false; }
    if (payment.status === 'COMPLETED') { await client.query('COMMIT'); return payment.transaction_id === transactionId; }
    if (Number(verification.amount) !== Number(payment.amount) ||
        verification.metadata?.order_id !== payment.order_id ||
        verification.metadata?.payment_id !== payment.id) {
      await client.query('ROLLBACK'); return false;
    }
    const orderResult = await client.query(
      "SELECT data FROM agrochain_records WHERE resource='orders' AND id=$1 FOR UPDATE", [payment.order_id]);
    const order = orderResult.rows[0]?.data;
    if (!order || order.buyerId !== payment.buyer_id || order.paymentMethod !== 'ONLINE' ||
        Number(order.totalAmount) !== Number(payment.amount) || order.paymentStatus === 'PAID') {
      await client.query('ROLLBACK'); return false;
    }
    await client.query(
      "UPDATE agrochain_records SET data=jsonb_set(data,'{paymentStatus}','\"PAID\"'::jsonb),updated_at=NOW() WHERE resource='orders' AND id=$1",
      [payment.order_id]);
    await client.query("UPDATE rupantorpay_payments SET status='COMPLETED',transaction_id=$2,updated_at=NOW() WHERE id=$1", [paymentId,transactionId]);
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

paymentRouter.get('/return', async (req, res) => {
  const paymentId = typeof req.query.paymentId === 'string' ? req.query.paymentId : '';
  const transactionId = typeof req.query.transactionId === 'string' ? req.query.transactionId : '';
  let paid = false;
  try { paid = await verifyPayment(paymentId, transactionId); }
  catch (error) { console.error('Payment verification failed:', error.message); }
  const lookup = await pool.query('SELECT order_id FROM rupantorpay_payments WHERE id=$1', [paymentId]).catch(() => ({rows:[]}));
  const target = new URL(SITE || 'http://localhost:3000');
  target.pathname = lookup.rows[0] ? '/buyer/tracking/' + encodeURIComponent(lookup.rows[0].order_id) : '/buyer';
  target.searchParams.set('payment', paid ? 'verified' : 'pending');
  return res.redirect(303, target.toString());
});

paymentRouter.get('/cancel', (req, res) => {
  const target = new URL(SITE || 'http://localhost:3000');
  target.pathname = '/buyer';
  target.searchParams.set('payment', 'cancelled');
  res.redirect(303, target.toString());
});
