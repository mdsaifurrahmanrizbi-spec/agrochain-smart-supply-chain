import express from 'express';
import { pool } from './db.js';
import { requireAuth } from './auth.js';

const router = express.Router();
const GATEWAY_URL = 'https://payment.rupantorpay.com/api/payment';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://agrochain-smart-supply-chain.vercel.app').replace(/\/$/, '');

function gatewayHeaders() {
  const apiKey = process.env.RUPANTORPAY_API_KEY;
  if (!apiKey) throw new Error('RUPANTORPAY_API_KEY is not configured');
  return {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
    'X-CLIENT': new URL(FRONTEND_URL).host,
  };
}

router.post('/rupantorpay/checkout', requireAuth, async (req, res) => {
  if (req.auth.role !== 'buyer') {
    return res.status(403).json({ message: 'Only buyers can initiate checkout' });
  }

  const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.trim() : '';
  if (!orderId) return res.status(400).json({ message: 'orderId is required' });

  try {
    const result = await pool.query(
      "SELECT data FROM agrochain_records WHERE resource = 'orders' AND id = $1",
      [orderId]
    );
    const order = result.rows[0]?.data;
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.buyerId !== req.auth.sub) return res.status(403).json({ message: 'This order does not belong to your account' });
    if (order.paymentMethod !== 'ONLINE') return res.status(400).json({ message: 'This order was not created for online payment' });
    if (order.paymentStatus === 'PAID') return res.status(409).json({ message: 'This order is already paid' });
    if (order.orderStatus === 'CANCELLED') return res.status(409).json({ message: 'Cancelled orders cannot be paid' });

    const accountResult = await pool.query(
      'SELECT name, email FROM auth_users WHERE id = $1 AND status = $2',
      [req.auth.sub, 'ACTIVE']
    );
    const account = accountResult.rows[0];
    if (!account) return res.status(401).json({ message: 'Buyer account could not be verified' });

    const response = await fetch(`${GATEWAY_URL}/checkout`, {
      method: 'POST',
      headers: gatewayHeaders(),
      body: JSON.stringify({
        fullname: order.buyerName || account.name,
        email: account.email,
        amount: Number(order.totalAmount).toFixed(2),
        success_url: `${FRONTEND_URL}/buyer/payment-result?orderId=${encodeURIComponent(orderId)}`,
        cancel_url: `${FRONTEND_URL}/buyer/payment-result?orderId=${encodeURIComponent(orderId)}&cancelled=1`,
        webhook_url: `${process.env.API_PUBLIC_URL || 'https://agrochain-api.onrender.com'}/api/payment/rupantorpay/webhook`,
        metadata: { order_id: orderId, buyer_id: req.auth.sub },
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status !== 1 || typeof data.payment_url !== 'string') {
      console.error('RupantorPay checkout rejected request:', response.status, data.message || 'No payment URL');
      return res.status(502).json({ message: data.message || 'RupantorPay could not create a payment link' });
    }
    return res.json({ paymentUrl: data.payment_url });
  } catch (error) {
    console.error('RupantorPay checkout failed:', error.message);
    return res.status(500).json({
      message: error.message === 'RUPANTORPAY_API_KEY is not configured'
        ? 'Payment gateway is not configured on the server'
        : 'Could not start RupantorPay checkout',
    });
  }
});

router.post('/rupantorpay/verify', requireAuth, async (req, res) => {
  if (req.auth.role !== 'buyer') return res.status(403).json({ message: 'Only buyers can verify their checkout' });
  const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.trim() : '';
  const transactionId = typeof req.body?.transactionId === 'string' ? req.body.transactionId.trim() : '';
  if (!orderId || !transactionId) return res.status(400).json({ message: 'orderId and transactionId are required' });

  const client = await pool.connect();
  try {
    const existingResult = await client.query(
      "SELECT data FROM agrochain_records WHERE resource = 'orders' AND id = $1",
      [orderId]
    );
    const order = existingResult.rows[0]?.data;
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.buyerId !== req.auth.sub) return res.status(403).json({ message: 'This order does not belong to your account' });
    if (order.paymentMethod !== 'ONLINE') return res.status(400).json({ message: 'This order is not an online payment order' });
    if (order.paymentStatus === 'PAID' && order.transactionId === transactionId) {
      return res.json({ status: 'PAID', orderId, transactionId });
    }
    if (order.paymentStatus === 'PAID' && order.transactionId !== transactionId) {
      return res.status(409).json({ message: 'This order is already paid with a different transaction' });
    }

    const response = await fetch(`${GATEWAY_URL}/verify-payment`, {
      method: 'POST',
      headers: gatewayHeaders(),
      body: JSON.stringify({ transaction_id: transactionId }),
    });
    const verified = await response.json().catch(() => ({}));
    if (!response.ok || String(verified.status || '').toUpperCase() !== 'COMPLETED') {
      return res.status(402).json({
        status: String(verified.status || 'PENDING').toUpperCase(),
        message: 'Gateway has not confirmed a completed payment yet',
      });
    }

    const verifiedAmount = Number(verified.amount);
    const expectedAmount = Number(order.totalAmount);
    const verifiedTransactionId = typeof verified.transaction_id === 'string' ? verified.transaction_id : '';
    const metadataOrderId = verified.metadata?.order_id;
    if (verifiedTransactionId && verifiedTransactionId !== transactionId) {
      return res.status(409).json({ message: 'Gateway returned a different transaction ID' });
    }
    if (!Number.isFinite(verifiedAmount) || Math.abs(verifiedAmount - expectedAmount) > 0.01) {
      return res.status(409).json({ message: 'Verified payment amount does not match this order' });
    }
    if (metadataOrderId !== orderId) {
      return res.status(409).json({ message: 'Verified transaction is not linked to this order' });
    }
    await client.query('BEGIN');
    const locked = await client.query(
      "SELECT data FROM agrochain_records WHERE resource = 'orders' AND id = $1 FOR UPDATE",
      [orderId]
    );
    const latest = locked.rows[0]?.data;
    if (!latest || latest.buyerId !== req.auth.sub) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Order not found' });
    }
    if (latest.paymentMethod !== 'ONLINE') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'This order is not an online payment order' });
    }
    if (latest.paymentStatus === 'PAID') {
      await client.query('ROLLBACK');
      return latest.transactionId === transactionId
        ? res.json({ status: 'PAID', orderId, transactionId })
        : res.status(409).json({ message: 'This order was paid with a different transaction' });
    }
    const usedByAnotherOrder = await client.query(
      `SELECT id FROM agrochain_records
       WHERE resource = 'orders' AND id <> $1
         AND (data->>'transactionId' = $2 OR data->>'gatewayTransactionId' = $2)
       LIMIT 1`,
      [orderId, transactionId]
    );
    if (usedByAnotherOrder.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'This transaction has already been applied to another order' });
    }
    if (latest.paymentStatus !== 'PAID') {
      const updated = {
        ...latest,
        paymentStatus: 'PAID',
        paymentMethod: 'ONLINE',
        paymentGateway: 'RUPANTORPAY',
        transactionId,
        gatewayTransactionId: verified.trx_id || transactionId,
        paymentCurrency: verified.currency || 'BDT',
        paymentVerifiedAt: new Date().toISOString(),
      };
      await client.query(
        "UPDATE agrochain_records SET data = $1::jsonb, updated_at = NOW() WHERE resource = 'orders' AND id = $2",
        [JSON.stringify(updated), orderId]
      );
    }
    await client.query('COMMIT');
    return res.json({ status: 'PAID', orderId, transactionId });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('RupantorPay verification failed:', error.message);
    return res.status(500).json({ message: 'Could not verify payment with RupantorPay' });
  } finally {
    client.release();
  }
});

router.post('/rupantorpay/webhook', async (req, res) => {
  // Never trust webhook status fields. Verify the transaction directly with
  // RupantorPay, then bind the verified amount and metadata to one order.
  const transactionId = typeof req.body?.transactionId === 'string'
    ? req.body.transactionId.trim()
    : typeof req.body?.transaction_id === 'string' ? req.body.transaction_id.trim() : '';
  if (!transactionId) return res.status(400).json({ message: 'transaction ID is required' });

  let client;
  try {
    const response = await fetch(`${GATEWAY_URL}/verify-payment`, {
      method: 'POST',
      headers: gatewayHeaders(),
      body: JSON.stringify({ transaction_id: transactionId }),
    });
    const verified = await response.json().catch(() => ({}));
    if (!response.ok || String(verified.status || '').toUpperCase() !== 'COMPLETED') {
      return res.status(202).json({ received: true, status: 'PENDING' });
    }

    const orderId = typeof verified.metadata?.order_id === 'string'
      ? verified.metadata.order_id
      : '';
    const verifiedTransactionId = typeof verified.transaction_id === 'string'
      ? verified.transaction_id
      : '';
    if (!orderId || (verifiedTransactionId && verifiedTransactionId !== transactionId)) {
      return res.status(409).json({ message: 'Verified transaction metadata is invalid' });
    }

    client = await pool.connect();
    await client.query('BEGIN');
    const locked = await client.query(
      "SELECT data FROM agrochain_records WHERE resource = 'orders' AND id = $1 FOR UPDATE",
      [orderId]
    );
    const order = locked.rows[0]?.data;
    if (!order || order.paymentMethod !== 'ONLINE') {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Matching online order was not found' });
    }
    if (order.orderStatus === 'CANCELLED') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Cancelled orders cannot be marked paid' });
    }

    const verifiedAmount = Number(verified.amount);
    const expectedAmount = Number(order.totalAmount);
    if (!Number.isFinite(verifiedAmount) || !Number.isFinite(expectedAmount) ||
        Math.abs(verifiedAmount - expectedAmount) > 0.01) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Verified payment amount does not match the order' });
    }

    if (order.paymentStatus === 'PAID') {
      await client.query('ROLLBACK');
      return order.transactionId === transactionId
        ? res.status(200).json({ received: true, status: 'PAID', orderId })
        : res.status(409).json({ message: 'Order is already paid with another transaction' });
    }

    const usedByAnotherOrder = await client.query(
      `SELECT id FROM agrochain_records
       WHERE resource = 'orders' AND id <> $1
         AND (data->>'transactionId' = $2 OR data->>'gatewayTransactionId' = $2)
       LIMIT 1`,
      [orderId, transactionId]
    );
    if (usedByAnotherOrder.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Transaction has already been applied to another order' });
    }

    const updated = {
      ...order,
      paymentStatus: 'PAID',
      paymentMethod: 'ONLINE',
      paymentGateway: 'RUPANTORPAY',
      transactionId,
      gatewayTransactionId: verified.trx_id || transactionId,
      paymentCurrency: verified.currency || 'BDT',
      paymentVerifiedAt: new Date().toISOString(),
    };
    await client.query(
      "UPDATE agrochain_records SET data = $1::jsonb, updated_at = NOW() WHERE resource = 'orders' AND id = $2",
      [JSON.stringify(updated), orderId]
    );
    await client.query('COMMIT');
    return res.status(200).json({ received: true, status: 'PAID', orderId });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('RupantorPay webhook verification failed:', error.message);
    return res.status(500).json({ message: 'Could not verify payment notification' });
  } finally {
    client?.release();
  }
});

export default router;
