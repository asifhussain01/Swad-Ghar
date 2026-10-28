import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Eye,
  MapPin,
  Phone,
  User,
  Calendar,
  X,
  FileSpreadsheet,
  Download,
  Store,
} from 'lucide-react';
import api, { API_BASE_URL } from '../api/client';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Fetch list of restaurants for the store filter
  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/admin/restaurants', { params: { limit: 100 } });
      setRestaurants(res.data?.restaurants || []);
    } catch (err) {
      console.error('Error fetching restaurants for filter:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (restaurantId) params.restaurantId = restaurantId;
      if (orderStatus) params.orderStatus = orderStatus;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      if (search) params.search = search;

      const res = await api.get('/admin/orders', { params });
      setOrders(res.data?.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [restaurantId, orderStatus, paymentStatus]);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('swadghar_admin_token');
      const params = new URLSearchParams();
      if (restaurantId) params.append('restaurantId', restaurantId);
      if (orderStatus) params.append('orderStatus', orderStatus);
      if (paymentStatus) params.append('paymentStatus', paymentStatus);
      if (search) params.append('search', search);

      const baseURL = API_BASE_URL;
      const url = `${baseURL}/admin/orders/export-excel?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download Excel report.');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const dateStr = new Date().toISOString().split('T')[0];
      const selectedRestObj = restaurants.find((r) => r._id === restaurantId);
      const storePrefix = selectedRestObj
        ? selectedRestObj.name.replace(/[^a-zA-Z0-9]/g, '_')
        : 'All_Stores';

      a.download = `SwadGhar_${storePrefix}_Orders_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert(err.message || 'Excel export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Navbar title="Platform Food Orders & Store Records" onRefresh={fetchOrders} />

      <main className="p-8 space-y-6 flex-1">
        {/* Filter Controls & Excel Export Button */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchOrders();
            }}
            className="relative w-full lg:w-72"
          >
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order ID (e.g. SG-2610...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Store / Restaurant Filter */}
            <select
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">🏬 All Stores & Restaurants</option>
              {restaurants.map((rest) => (
                <option key={rest._id} value={rest._id}>
                  {rest.name} ({rest.address?.city})
                </option>
              ))}
            </select>

            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Order Statuses</option>
              <option value="PLACED">Placed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Payment Statuses</option>
              <option value="PENDING">COD Pending</option>
              <option value="PAID">Cash Collected (PAID)</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            {/* Export to Excel Button */}
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm disabled:opacity-50 shrink-0"
              title="Export filtered food order records to Excel (.csv format with UTF-8 BOM)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{exporting ? 'Exporting...' : 'Export to Excel'}</span>
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Order #</th>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Restaurant</th>
                  <th className="py-3.5 px-5">Items</th>
                  <th className="py-3.5 px-5">Final Bill</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Payment</th>
                  <th className="py-3.5 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-800">{ord.customerId?.name || 'Customer'}</p>
                        <p className="text-[11px] text-slate-400">{ord.customerId?.phone}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-800">{ord.restaurantId?.name || 'Restaurant'}</p>
                        <p className="text-[11px] text-slate-400">{ord.restaurantId?.address?.city}</p>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {ord.items?.length || 0} item(s)
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        ₹{ord.finalAmount}
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={ord.orderStatus} />
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={ord.paymentStatus} type="payment" />
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Inspection Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                    <span>Order #{selectedOrder.orderNumber}</span>
                    <StatusBadge status={selectedOrder.orderStatus} />
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items Snapshot */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Ordered Dishes (Frozen Snapshot)
                </h4>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.isVegetarian ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="font-semibold text-slate-800">{item.name}</span>
                        <span className="text-slate-400">× {item.quantity}</span>
                      </div>
                      <span className="font-bold text-slate-800">₹{item.subtotal}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200/60 flex justify-between text-xs font-semibold text-slate-600">
                    <span>Item Subtotal:</span>
                    <span>₹{selectedOrder.itemSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Delivery Fee (Arranged by Restaurant):</span>
                    <span>₹{selectedOrder.deliveryFee}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                    <span>Total Bill (Cash on Delivery):</span>
                    <span>₹{selectedOrder.finalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address Snapshot */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Delivery Destination
                </h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900">
                    {selectedOrder.deliveryAddress?.recipientName} ({selectedOrder.deliveryAddress?.label})
                  </p>
                  <p>{selectedOrder.deliveryAddress?.fullAddress}</p>
                  {selectedOrder.deliveryAddress?.landmark && (
                    <p className="text-slate-500">Landmark: {selectedOrder.deliveryAddress?.landmark}</p>
                  )}
                  <p className="text-slate-500">
                    {selectedOrder.deliveryAddress?.city} - {selectedOrder.deliveryAddress?.pincode}
                  </p>
                  <p className="font-medium text-slate-800 pt-1">📞 {selectedOrder.deliveryAddress?.phone}</p>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Audit Lifecycle Timeline
                </h4>
                <div className="space-y-2 border-l-2 border-primary/30 ml-2 pl-4 py-1 text-xs">
                  {selectedOrder.statusTimeline?.map((t, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                      <p className="font-bold text-slate-800">{t.status}</p>
                      <p className="text-slate-500 text-[11px]">{t.note}</p>
                      <p className="text-[10px] text-slate-400">{new Date(t.timestamp).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
