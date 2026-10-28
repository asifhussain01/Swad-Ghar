import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Users,
  ShoppingBag,
  Banknote,
  AlertCircle,
  ShieldCheck,
  LogOut,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Restaurants', path: '/restaurants', icon: Store },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Platform Orders', path: '/orders', icon: ShoppingBag },
  { name: 'COD Cash Monitor', path: '/cod-monitor', icon: Banknote },
  { name: 'Disputes & Complaints', path: '/complaints', icon: AlertCircle },
  { name: 'Audit Trail', path: '/audit-logs', icon: ShieldCheck },
];

export default function Sidebar() {
  const { logout, admin } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-orange-500 flex items-center justify-center text-white shadow-md shadow-primary/20">
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight text-lg leading-none">SwadGhar</h1>
          <p className="text-[11px] text-orange-400 font-semibold tracking-wider uppercase mt-1">Admin Portal</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          Operations & Control
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
            {admin?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{admin?.name || 'Administrator'}</p>
            <p className="text-[11px] text-slate-400 truncate">{admin?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 rounded-lg transition-colors border border-rose-900/30"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
