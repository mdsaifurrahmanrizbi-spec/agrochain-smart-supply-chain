import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const { language, t } = useLanguage();
  const normalized = status.toUpperCase().replace(/\s+/g, '_');

  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status.replace(/_/g, ' ');

  // Success / Completed / Approved
  if (
    [
      'COMPLETED',
      'APPROVED',
      'DELIVERED',
      'VERIFIED',
      'PAID',
      'ACTIVE',
      'CASH_DEPOSIT_VERIFIED',
      'GRADE_A_-_PREMIUM',
      'GODOWN_RECEIVED',
      'COLLECTED',
      'DELIVERY_PARTNER_COLLECTED',
      'ACCEPTED_INTO_STORAGE',
    ].includes(normalized)
  ) {
    bg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  // Warning / Pending / Review
  else if (
    [
      'PENDING',
      'PENDING_APPROVAL',
      'CASH_DEPOSIT_PENDING',
      'PROCESSING',
      'RECHECK_REQUIRED',
      'CASH_COLLECTED',
      'SUSPENDED',
      'MANUAL_ROUTING_REQUIRED',
      'DELIVERY_ASSIGNMENT_PENDING',
      'ISSUE_REPORTED',
      'GODOWN_RECEIVING_ISSUE',
    ].includes(normalized)
  ) {
    bg = 'bg-amber-50 text-amber-800 border-amber-200';
  }
  // In-progress / Transit / Assigned
  else if (
    [
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'ASSIGNED',
      'ACCEPTED',
      'PICKED_UP',
      'IN_WAREHOUSE',
      'PICKUP_ASSIGNED',
      'QUALITY_VERIFIED',
      'WAREHOUSE_HANDOVER',
      'GODOWN_TRANSFER_IN_TRANSIT',
      'ARRIVED_LOCAL_GODOWN',
      'DELIVERY_PARTNER_ASSIGNED',
      'DELIVERY_ACCEPTED',
      'ARRIVED_AT_GODOWN',
      'HANDOVER_PENDING',
    ].includes(normalized)
  ) {
    bg = 'bg-blue-50 text-blue-800 border-blue-200';
  }
  // Danger / Rejected / Failed
  else if (['REJECTED', 'FAILED', 'CANCELLED', 'DAMAGED_ON_ARRIVAL', 'QUANTITY_MISMATCH'].includes(normalized)) {
    bg = 'bg-rose-50 text-rose-800 border-rose-200';
  }

  const statusLabels: Record<string, string> = { CONFIRMED: 'নিশ্চিত', CANCELLED: 'বাতিল', CANCELED: 'বাতিল', PENDING: 'অপেক্ষমাণ', PENDING_APPROVAL: 'অনুমোদনের অপেক্ষায়', DELIVERED: 'পৌঁছে দেওয়া হয়েছে', VERIFIED: 'যাচাইকৃত', APPROVED: 'অনুমোদিত', REJECTED: 'প্রত্যাখ্যাত', FAILED: 'ব্যর্থ', PAID: 'পরিশোধিত', UNPAID: 'অপরিশোধিত', IN_TRANSIT: 'পথে রয়েছে', OUT_FOR_DELIVERY: 'ডেলিভারির জন্য পথে', PICKUP_ASSIGNED: 'সংগ্রহের দায়িত্ব দেওয়া হয়েছে', PROCESSING: 'প্রক্রিয়াধীন', ACTIVE: 'সক্রিয়', COMPLETED: 'সম্পন্ন' };
  if (language === 'bn') label = statusLabels[normalized] || t(label);

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${sizeClasses} ${bg} tabular-nums whitespace-nowrap`}
    >
      {label}
    </span>
  );
};
