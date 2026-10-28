import React, { useState, useEffect } from 'react';
import {
  Store,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  AlertTriangle,
  Eye,
  Ban,
  Plus,
} from 'lucide-react';
import api from '../api/client';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [actionModal, setActionModal] = useState({ open: false, type: '', restaurant: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Add Restaurant Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newRestName, setNewRestName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('Lucknow');
  const [newStreet, setNewStreet] = useState('');
  const [newPincode, setNewPincode] = useState('226001');
  const [newCuisines, setNewCuisines] = useState('North Indian, Biryani');
  const [newDeliveryFee, setNewDeliveryFee] = useState('30');
  const [newPrepTime, setNewPrepTime] = useState('25');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.approvalStatus = statusFilter;
      if (search) params.search = search;
      const res = await api.get('/admin/restaurants', { params });
      setRestaurants(res.data?.restaurants || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  const handleApprovalSubmit = async () => {
    if (!actionModal.restaurant) return;
    setProcessing(true);
    try {
      await api.patch(`/admin/restaurants/${actionModal.restaurant._id}/approval`, {
        approvalStatus: actionModal.type,
        rejectionReason: actionModal.type === 'REJECTED' ? rejectionReason : undefined,
      });
      setActionModal({ open: false, type: '', restaurant: null });
      setRejectionReason('');
      fetchRestaurants();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    if (!newRestName.trim()) {
      alert('Restaurant name is required');
      return;
    }

    setCreating(true);
    try {
      const cuisineArray = newCuisines.split(',').map((c) => c.trim()).filter(Boolean);
      await api.post('/admin/restaurants', {
        name: newRestName.trim(),
        ownerName: newOwnerName.trim() || undefined,
        ownerEmail: newOwnerEmail.trim() || undefined,
        phone: newPhone.trim() || '+919876543210',
        cuisineType: cuisineArray.length > 0 ? cuisineArray : ['North Indian'],
        address: {
          street: newStreet.trim() || 'Main Market Road',
          city: newCity.trim() || 'Lucknow',
          pincode: newPincode.trim() || '226001',
        },
        deliveryFee: Number(newDeliveryFee) || 30,
        estimatedPrepTimeMinutes: Number(newPrepTime) || 25,
        logoUrl: newLogoUrl.trim() || undefined,
      });

      alert('Restaurant created & approved successfully!');
      setAddModalOpen(false);
      // Reset form
      setNewRestName('');
      setNewOwnerName('');
      setNewOwnerEmail('');
      setNewPhone('');
      setNewStreet('');
      fetchRestaurants();
    } catch (err) {
      alert(err.message || 'Failed to create restaurant');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Navbar title="Restaurant Partner Management" onRefresh={fetchRestaurants} />

      <main className="p-8 space-y-6 flex-1">
        {/* Search, Filters, and Add Restaurant Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by restaurant name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {['', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === '' ? 'All Status' : st}
              </button>
            ))}

            <button
              onClick={() => setAddModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary-dark text-white flex items-center gap-1.5 transition ml-2 shadow-sm shrink-0"
            >
              <span>+ Add Restaurant</span>
            </button>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Restaurant</th>
                  <th className="py-3.5 px-5">Location</th>
                  <th className="py-3.5 px-5">Owner / Contact</th>
                  <th className="py-3.5 px-5">Cuisines</th>
                  <th className="py-3.5 px-5">Ratings</th>
                  <th className="py-3.5 px-5">Approval</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      Loading restaurants...
                    </td>
                  </tr>
                ) : restaurants.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No restaurants match your filter.
                    </td>
                  </tr>
                ) : (
                  restaurants.map((rest) => (
                    <tr key={rest._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={rest.logoUrl}
                            alt={rest.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{rest.name}</p>
                            <p className="text-[11px] text-slate-400">
                              {rest.isOpen ? '🟢 Open Now' : '🔴 Closed'} &bull; Prep: ~{rest.estimatedPrepTimeMinutes}m
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-start gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{rest.address?.city}, {rest.address?.pincode}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-800">{rest.ownerId?.name || 'Owner'}</p>
                        <p className="text-[11px] text-slate-400">{rest.phone}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex flex-wrap gap-1">
                          {rest.cuisineType?.slice(0, 2).map((c, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-amber-600">
                        ★ {rest.avgRating || 4.5} <span className="font-normal text-slate-400">({rest.totalRatings || 0})</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={rest.approvalStatus} />
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                        {rest.approvalStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => setActionModal({ open: true, type: 'APPROVED', restaurant: rest })}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-semibold text-[11px] transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setActionModal({ open: true, type: 'REJECTED', restaurant: rest })}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded font-semibold text-[11px] transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {rest.approvalStatus === 'APPROVED' && (
                          <button
                            onClick={() => setActionModal({ open: true, type: 'SUSPENDED', restaurant: rest })}
                            className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded font-semibold text-[11px] transition"
                          >
                            Suspend
                          </button>
                        )}
                        {rest.approvalStatus === 'SUSPENDED' && (
                          <button
                            onClick={() => setActionModal({ open: true, type: 'APPROVED', restaurant: rest })}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-semibold text-[11px] transition"
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New Restaurant Modal */}
        {addModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">Add & List New Restaurant</h3>
                <p className="text-xs text-slate-500">
                  Directly register and publish a new restaurant partner on SwadGhar.
                </p>
              </div>

              <form onSubmit={handleCreateRestaurant} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Restaurant Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Awadh Rasoi"
                    value={newRestName}
                    onChange={(e) => setNewRestName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Owner Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Amit Kumar"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Owner Email</label>
                    <input
                      type="email"
                      placeholder="amit@example.com"
                      value={newOwnerEmail}
                      onChange={(e) => setNewOwnerEmail(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 9876543210"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cuisines (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="Biryani, North Indian, Thali"
                      value={newCuisines}
                      onChange={(e) => setNewCuisines(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="Shop 12, Main Market"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="Lucknow"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      placeholder="226001"
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Delivery Fee (₹)</label>
                    <input
                      type="number"
                      placeholder="30"
                      value={newDeliveryFee}
                      onChange={(e) => setNewDeliveryFee(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Prep Time (mins)</label>
                    <input
                      type="number"
                      placeholder="25"
                      value={newPrepTime}
                      onChange={(e) => setNewPrepTime(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Logo URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newLogoUrl}
                    onChange={(e) => setNewLogoUrl(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create & Publish Restaurant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Approve / Reject / Suspend Modal */}
        {actionModal.open && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-slate-900">
                Confirm {actionModal.type}: {actionModal.restaurant?.name}
              </h3>
              <p className="text-xs text-slate-500">
                This action will modify partner permissions immediately and notify the owner via in-app alerts.
              </p>

              {actionModal.type === 'REJECTED' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rejection Reason (Required)
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide specific feedback (e.g. invalid FSSAI, unverified kitchen location)..."
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setActionModal({ open: false, type: '', restaurant: null })}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  disabled={processing || (actionModal.type === 'REJECTED' && !rejectionReason.trim())}
                  onClick={handleApprovalSubmit}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition disabled:opacity-50 ${
                    actionModal.type === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-primary hover:bg-primary-dark'
                  }`}
                >
                  {processing ? 'Processing...' : `Confirm ${actionModal.type}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

