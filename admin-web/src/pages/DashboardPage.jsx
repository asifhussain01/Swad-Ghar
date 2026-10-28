import React, { useEffect, useState } from 'react';
import {
  Users,
  Store,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Banknote,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../api/client';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/admin/dashboard');
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar title="Platform Overview" />
        <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Loading platform statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  const counts = data?.counts || {};
  const financials = data?.financials || {};
  const chartData = data?.monthlyChartData || [];
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Navbar title="Platform Overview & Operations" onRefresh={fetchMetrics} refreshing={refreshing} />

      <main className="p-8 space-y-8 flex-1">
        {/* Important Financial Distinction Alert */}
        <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-4 flex items-start gap-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-950">Financial Separation Notice</p>
            <p className="mt-0.5 text-amber-800">
              SwadGhar operates exclusively on Cash on Delivery (COD). Total Order Value represents customer order volume, while
              Confirmed Cash Collected represents physical cash acknowledged by restaurant partners. Order value is NOT platform profit.
            </p>
          </div>
        </div>

        {/* Primary KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Customers"
            value={counts.totalCustomers || 0}
            subtitle="Registered food consumers"
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Active Restaurants"
            value={counts.approvedRestaurants || 0}
            subtitle={`${counts.pendingRestaurants || 0} pending review`}
            icon={Store}
            color={counts.pendingRestaurants > 0 ? 'amber' : 'emerald'}
          />
          <StatCard
            title="Total Orders"
            value={counts.totalOrders || 0}
            subtitle={`${counts.activeOrders || 0} currently in kitchen`}
            icon={ShoppingBag}
            color="primary"
          />
          <StatCard
            title="Cash Collected (COD)"
            value={`₹${(financials.confirmedCashCollected || 0).toLocaleString('en-IN')}`}
            subtitle={`Pending Cash: ₹${(financials.pendingCashCollection || 0).toLocaleString('en-IN')}`}
            icon={Banknote}
            color="emerald"
          />
        </div>

        {/* Secondary Detailed Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="border-r border-slate-100 pr-4">
            <span className="text-xs text-slate-400 font-medium">Placed (Unaccepted)</span>
            <p className="text-xl font-bold text-blue-600 mt-1">{counts.placedOrders || 0}</p>
          </div>
          <div className="border-r border-slate-100 pr-4">
            <span className="text-xs text-slate-400 font-medium">Preparing & In-Transit</span>
            <p className="text-xl font-bold text-amber-600 mt-1">{counts.activeOrders || 0}</p>
          </div>
          <div className="border-r border-slate-100 pr-4">
            <span className="text-xs text-slate-400 font-medium">Completed Deliveries</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{counts.completedOrders || 0}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Cancelled / Rejected</span>
            <p className="text-xl font-bold text-rose-600 mt-1">{counts.cancelledOrders || 0}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Value Trend */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">Order Value & Cash Collected (2026)</h3>
                <p className="text-xs text-slate-400">Monthly gross order volume vs confirmed cash</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-md text-slate-600">INR (₹)</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E23744" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#E23744" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="orderValue" name="Gross Order Value" stroke="#E23744" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
                  <Area type="monotone" dataKey="cashCollected" name="Cash Received" stroke="#10B981" fillOpacity={1} fill="url(#colorCash)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders Volume Bar Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">Total Orders Processed</h3>
                <p className="text-xs text-slate-400">Monthly order counts through SwadGhar</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-md text-slate-600">Orders</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="orders" name="Order Count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">Recent Platform Orders</h3>
              <p className="text-xs text-slate-400">Live feed of orders placed across Indian cities</p>
            </div>
            <a href="/orders" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Order #</th>
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-5">Restaurant</th>
                  <th className="py-3 px-5">Amount</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Payment</th>
                  <th className="py-3 px-5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-6 text-center text-slate-400">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 font-bold text-slate-900">{ord.orderNumber}</td>
                      <td className="py-3 px-5">
                        <p className="font-semibold text-slate-800">{ord.customerId?.name || 'Customer'}</p>
                        <p className="text-[11px] text-slate-400">{ord.customerId?.phone}</p>
                      </td>
                      <td className="py-3 px-5 font-medium text-slate-800">{ord.restaurantId?.name || 'Restaurant'}</td>
                      <td className="py-3 px-5 font-bold text-slate-900">₹{ord.finalAmount}</td>
                      <td className="py-3 px-5">
                        <StatusBadge status={ord.orderStatus} />
                      </td>
                      <td className="py-3 px-5">
                        <StatusBadge status={ord.paymentStatus} type="payment" />
                      </td>
                      <td className="py-3 px-5 text-slate-400">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
