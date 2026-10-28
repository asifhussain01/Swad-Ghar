import React, { useState, useEffect } from 'react';
import { Banknote, AlertCircle, CheckCircle, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import api from '../api/client';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function CODMonitoringPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [correctModal, setCorrectModal] = useState({ open: false, order: null });
  const [targetStatus, setTargetStatus] = useState('PAID');
  const [auditReason, setAuditReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchCODData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/cod-monitor');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCODData();
  }, []);

  const handlePaymentCorrection = async () => {
    if (!correctModal.order || !auditReason.trim()) return;
    setProcessing(true);
    try {
      await api.patch(`/admin/orders/${correctModal.order._id}/payment`, {
        paymentStatus: targetStatus,
        reason: auditReason,
      });
      setCorrectModal({ open: false, order: null });
      setAuditReason('');
      fetchCODData();
    } catch (err) {
      alert(err.message || 'Payment adjustment failed');
    } finally {
      setProcessing(false);
    }
  };

  const pendingList = data?.pendingCollections || [];
  const paidList = data?.recentPaidCollections || [];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Navbar title="Cash on Delivery (COD) Financial Monitor" onRefresh={fetchCODData} />

      <main className="p-8 space-y-8 flex-1">
        {/* Warning / Informational Alert */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-950">Cash Collection Integrity Policy</p>
            <p className="mt-0.5 text-amber-800">
              Orders marked as "Delivered" do not automatically become "Paid". The restaurant partner or runner must
              physically confirm cash collection. Any administrative overrides are recorded permanently in the security audit trail.
            </p>
          </div>
        </div>

        {/* Financial Stat Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Delivered Orders with Cash Pending
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-extrabold text-amber-600">
                ₹{(data?.totalPendingCash || 0).toLocaleString('en-IN')}
              </h3>
              <span className="text-xs text-slate-400">({data?.pendingCollectionsCount || 0} orders awaiting cash receipt)</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Confirmed Cash Received
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-extrabold text-emerald-600">Verified Collections</h3>
              <span className="text-xs text-slate-400">Recorded by restaurant owners</span>
            </div>
          </div>
        </div>

        {/* Section 1: Pending Cash Collections Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">
                Pending Cash Due (Action Required by Restaurant)
              </h3>
              <p className="text-xs text-slate-400">
                Delivered orders where cash hand-off has not yet been registered
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Order #</th>
                  <th className="py-3 px-5">Restaurant</th>
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-5">Cash Due</th>
                  <th className="py-3 px-5">Order Status</th>
                  <th className="py-3 px-5 text-right">Audited Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">
                      Loading pending collections...
                    </td>
                  </tr>
                ) : pendingList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-emerald-600 font-medium">
                      ✓ All delivered orders have verified cash receipts!
                    </td>
                  </tr>
                ) : (
                  pendingList.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 font-bold text-slate-900 font-mono">{ord.orderNumber}</td>
                      <td className="py-3 px-5 font-medium text-slate-800">{ord.restaurantId?.name}</td>
                      <td className="py-3 px-5 text-slate-600">{ord.customerId?.name} ({ord.customerId?.phone})</td>
                      <td className="py-3 px-5 font-bold text-amber-700">₹{ord.finalAmount}</td>
                      <td className="py-3 px-5">
                        <StatusBadge status={ord.orderStatus} />
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => setCorrectModal({ open: true, order: ord })}
                          className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded font-semibold text-[11px] transition"
                        >
                          Correct Status
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Recent Verified Collections */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">Recent Verified Cash Collections</h3>
            <p className="text-xs text-slate-400">Orders successfully settled via COD</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Order #</th>
                  <th className="py-3 px-5">Restaurant</th>
                  <th className="py-3 px-5">Amount Collected</th>
                  <th className="py-3 px-5">Verified By</th>
                  <th className="py-3 px-5">Settlement Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paidList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-400">
                      No settled cash orders yet.
                    </td>
                  </tr>
                ) : (
                  paidList.map((ord) => (
                    <tr key={ord._id}>
                      <td className="py-3 px-5 font-bold text-slate-900 font-mono">{ord.orderNumber}</td>
                      <td className="py-3 px-5 font-medium text-slate-800">{ord.restaurantId?.name}</td>
                      <td className="py-3 px-5 font-bold text-emerald-600">₹{ord.finalAmount}</td>
                      <td className="py-3 px-5 text-slate-500">
                        {ord.paymentCollectedBy?.name || 'Restaurant Owner'}
                      </td>
                      <td className="py-3 px-5 text-slate-400">
                        {ord.paidAt ? new Date(ord.paidAt).toLocaleString() : 'Recently'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audited Payment Adjustment Modal */}
        {correctModal.open && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-slate-900">
                Adjust Payment for #{correctModal.order?.orderNumber}
              </h3>
              <p className="text-xs text-slate-500">
                This modification requires a mandatory justification note and will be permanently logged in the audit ledger.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Payment Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="PAID">PAID (Confirm Cash Received)</option>
                  <option value="REFUNDED">REFUNDED (Return Cash)</option>
                  <option value="PENDING">PENDING (Reset to Pending)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Justification Note (Required)
                </label>
                <textarea
                  rows={3}
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="State reason (e.g. restaurant confirmed verbal cash hand-off, physical receipt checked)..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setCorrectModal({ open: false, order: null })}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  disabled={processing || !auditReason.trim()}
                  onClick={handlePaymentCorrection}
                  className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition disabled:opacity-50"
                >
                  {processing ? 'Logging Audit...' : 'Confirm Audited Adjustment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
