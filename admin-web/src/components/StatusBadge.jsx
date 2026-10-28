import React from 'react';

export default function StatusBadge({ status, type = 'order' }) {
  const configs = {
    // Order Statuses
    PLACED: { label: 'Placed', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    CONFIRMED: { label: 'Confirmed', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    PREPARING: { label: 'Preparing', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    READY_FOR_DELIVERY: { label: 'Out for Delivery', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    DELIVERED: { label: 'Delivered', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    REJECTED: { label: 'Rejected', bg: 'bg-red-50 text-red-700 border-red-200' },

    // Payment Statuses
    PENDING: { label: 'COD Due', bg: 'bg-amber-50 text-amber-800 border-amber-300' },
    PAID: { label: 'Cash Collected', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REFUNDED: { label: 'Refunded', bg: 'bg-slate-100 text-slate-700 border-slate-300' },

    // Restaurant Approval Statuses
    APPROVED: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    SUSPENDED: { label: 'Suspended', bg: 'bg-rose-50 text-rose-700 border-rose-200' },

    // User Statuses
    ACTIVE: { label: 'Active', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },

    // Complaint Statuses
    OPEN: { label: 'Open', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    UNDER_REVIEW: { label: 'Under Review', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    RESOLVED: { label: 'Resolved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  };

  const current = configs[status] || { label: status, bg: 'bg-slate-50 text-slate-700 border-slate-200' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg}`}
    >
      {current.label}
    </span>
  );
}
