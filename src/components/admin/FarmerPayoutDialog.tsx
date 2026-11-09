import React, { useEffect, useState } from 'react';

export type FarmerPayoutMethod = 'bKash' | 'Nagad' | 'Bank Transfer';

interface FarmerPayoutDialogProps {
  open: boolean;
  orderNumber: string;
  farmerName: string;
  payoutAccount: string;
  amount: number;
  onClose: () => void;
  onSubmit: (method: FarmerPayoutMethod, transactionReference: string) => Promise<void>;
}

export const FarmerPayoutDialog: React.FC<FarmerPayoutDialogProps> = ({
  open, orderNumber, farmerName, payoutAccount, amount, onClose, onSubmit,
}) => {
  const [method, setMethod] = useState<FarmerPayoutMethod>('bKash');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setMethod('bKash');
      setReference('');
      setError('');
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reference.trim()) {
      setError('Transaction ID / bank reference is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit(method, reference.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save farmer payout.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
      <form onSubmit={submit} className="my-6 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Confirm farmer payout</h2>
            <p className="mt-1 text-xs text-slate-500">Order {orderNumber} · {farmerName}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600">Close</button>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Farmer payout account</div>
          <div className="mt-1 break-words text-sm font-semibold text-slate-900">{payoutAccount || 'Not provided — verify farmer account before transferring'}</div>
          <div className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">Amount to send</div>
          <div className="mt-1 text-xl font-bold text-emerald-700">৳{amount.toLocaleString()}</div>
          <p className="mt-2 text-[10px] text-slate-500">Delivery fee is excluded. This is the farmer's net payout after the 10% product commission.</p>
        </div>

        <label className="mb-1 block text-xs font-semibold text-slate-700" htmlFor="farmer-payout-method">Payment method used</label>
        <select id="farmer-payout-method" value={method} onChange={(event) => setMethod(event.target.value as FarmerPayoutMethod)} className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800">
          <option value="bKash">bKash</option>
          <option value="Nagad">Nagad</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>

        <label className="mb-1 block text-xs font-semibold text-slate-700" htmlFor="farmer-payout-reference">Transaction ID / bank reference</label>
        <input id="farmer-payout-reference" value={reference} onChange={(event) => setReference(event.target.value)} maxLength={120} required placeholder="Enter the real transaction ID or bank reference" className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600" />
        {error && <p role="alert" className="mb-3 text-xs font-semibold text-red-600">{error}</p>}

        <p className="mb-4 text-[11px] leading-relaxed text-amber-800">Only submit after you have actually sent the money to the farmer. Saving records the payment in AgroChain; it does not transfer money or verify the external transaction automatically.</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">Cancel</button>
          <button type="submit" disabled={saving || !reference.trim()} className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving…' : 'Confirm payment successful'}</button>
        </div>
      </form>
    </div>
  );
};
