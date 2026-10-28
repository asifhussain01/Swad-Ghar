import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter } from 'lucide-react';
import api from '../api/client';
import Navbar from '../components/Navbar';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (entityFilter) params.entityType = entityFilter;
      const res = await api.get('/admin/audit-logs', { params });
      setLogs(res.data?.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Navbar title="System & Security Audit Ledger" onRefresh={fetchLogs} />

      <main className="p-8 space-y-6 flex-1">
        {/* Filter */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter By Entity:</span>
            {['', 'ORDER', 'PAYMENT', 'RESTAURANT', 'USER'].map((ent) => (
              <button
                key={ent}
                onClick={() => setEntityFilter(ent)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  entityFilter === ent
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ent === '' ? 'All Actions' : ent}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5">Actor</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Action</th>
                  <th className="py-3.5 px-5">Target Entity</th>
                  <th className="py-3.5 px-5">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 font-sans">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 font-sans">
                      No audit records found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 text-slate-400 text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 font-sans font-bold text-slate-800">
                        {log.performedBy?.name || 'System Admin'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-sans font-semibold">
                          {log.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-900">{log.action}</td>
                      <td className="py-3.5 px-5 text-slate-600">{log.entityType} ({log.entityId?.slice(-6)})</td>
                      <td className="py-3.5 px-5 font-sans text-slate-600 text-[11px] max-w-xs truncate">
                        {log.details || 'State transition'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
