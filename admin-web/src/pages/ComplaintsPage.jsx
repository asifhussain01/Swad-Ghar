import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, MessageSquare, ArrowRight } from 'lucide-react';
import api from '../api/client';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComp, setSelectedComp] = useState(null);
  const [newStatus, setNewStatus] = useState('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/complaints');
      setComplaints(res.data?.complaints || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolve = async () => {
    if (!selectedComp) return;
    setSaving(true);
    try {
      await api.patch(`/admin/complaints/${selectedComp._id}`, {
        status: newStatus,
        resolutionNotes,
      });
      setSelectedComp(null);
      setResolutionNotes('');
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Failed to update complaint');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Navbar title="Customer Disputes & Complaints" onRefresh={fetchComplaints} />

      <main className="p-8 space-y-6 flex-1">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">Active Dispute Tickets</h3>
            <p className="text-xs text-slate-400">Issues raised by customers concerning delivery or quality</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Ticket #</th>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Order #</th>
                  <th className="py-3.5 px-5">Subject</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      Loading complaints...
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No customer complaints on file.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-slate-500">{c._id.slice(-6)}</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-800">{c.customerId?.name}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-800 font-bold">{c.orderId?.orderNumber}</td>
                      <td className="py-3.5 px-5 font-medium text-slate-900">{c.subject}</td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-5 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedComp(c);
                            setNewStatus(c.status);
                            setResolutionNotes(c.resolutionNotes || '');
                          }}
                          className="px-3 py-1 bg-primary text-white hover:bg-primary-dark rounded font-semibold text-[11px] transition"
                        >
                          Review & Resolve
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resolution Modal */}
        {selectedComp && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-slate-900">
                Dispute Resolution: {selectedComp.subject}
              </h3>
              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 text-slate-700 border border-slate-200/80">
                <p>
                  <span className="font-bold">Customer:</span> {selectedComp.customerId?.name} ({selectedComp.customerId?.phone})
                </p>
                <p>
                  <span className="font-bold">Order:</span> #{selectedComp.orderId?.orderNumber} (₹{selectedComp.orderId?.finalAmount})
                </p>
                <p className="pt-2 font-medium text-slate-800">"{selectedComp.description}"</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Notes sent to customer regarding resolution..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedComp(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  onClick={handleResolve}
                  className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
