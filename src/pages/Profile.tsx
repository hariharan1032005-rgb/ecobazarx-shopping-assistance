import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { User as UserType, Leaf, Calendar, Package, TrendingUp, Award, ShoppingBag, Edit2, Save, X, Lock, Mail, User } from 'lucide-react';
import { Order } from '../types';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface EcoBreakdown {
  totalScore: number;
  breakdown: {
    orderPoints: number;
    certPoints: number;
    efficiencyBonus: number;
    details: {
      totalOrders: number;
      ecoCertifiedItems: number;
      averageCarbonPerItem: string;
    };
  };
}

export function Profile() {
  const { user, token, updateUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ecoBreakdown, setEcoBreakdown] = useState<EcoBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPassword, setEditPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const [ordersRes, ecoRes] = await Promise.all([
          fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/profile/eco-breakdown', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const ordersData = await ordersRes.json();
        const ecoData = await ecoRes.json();
        
        setOrders(ordersData);
        setEcoBreakdown(ecoData);
      } catch (err) {
        console.error('Failed to fetch profile data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          password: editPassword || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      updateUser(data.user);
      setIsEditing(false);
      setEditPassword('');
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
            <User className="h-10 w-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-emerald-600 transition-colors"
              >
                {isEditing ? <X className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-gray-500">{user.email}</p>
            <div className="mt-1 flex items-center gap-2 text-sm font-medium text-emerald-600">
              <Award className="h-4 w-4" />
              {user.role} Member
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="rounded-3xl border-2 border-emerald-500 bg-emerald-50 p-6 text-center shadow-sm"
          >
            <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-4xl">
              <Leaf className="h-8 w-8" />
              {ecoBreakdown?.totalScore || user.eco_score}
            </div>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">Your Eco Score</p>
          </motion.div>
        </div>
      </div>

      {message.text && (
        <div className={cn(
          "rounded-xl p-4 text-sm font-medium",
          message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
        )}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile Edit / Info */}
        <div className="space-y-6 lg:col-span-1">
          {isEditing ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Profile</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">New Password (optional)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <>
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">Eco Breakdown</h2>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Order Activity</span>
                    <span className="text-sm font-bold text-emerald-600">+{ecoBreakdown?.breakdown.orderPoints || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Eco Certifications</span>
                    <span className="text-sm font-bold text-emerald-600">+{ecoBreakdown?.breakdown.certPoints || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Efficiency Bonus</span>
                    <span className="text-sm font-bold text-emerald-600">+{ecoBreakdown?.breakdown.efficiencyBonus || 0}</span>
                  </div>
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Avg Carbon / Item</span>
                      <span className="font-medium">{ecoBreakdown?.breakdown.details.averageCarbonPerItem || 0} kg</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">Eco Badges</h2>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {[
                    { name: 'Seedling', icon: Leaf, active: (ecoBreakdown?.totalScore || 0) > 0 },
                    { name: 'Eco Warrior', icon: Award, active: (ecoBreakdown?.totalScore || 0) > 500 },
                    { name: 'Carbon Neutral', icon: TrendingUp, active: (ecoBreakdown?.totalScore || 0) > 1000 },
                  ].map((badge) => (
                    <div
                      key={badge.name}
                      className={cn(
                        "flex flex-col items-center gap-2 text-center",
                        badge.active ? "text-emerald-600" : "text-gray-300"
                      )}
                    >
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full border-2",
                        badge.active ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
                      )}>
                        <badge.icon className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Order History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {orders.length} Total Orders
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-gray-400">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                <span>Loading your eco-history...</span>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 py-16 text-center bg-white/50">
              <ShoppingBag className="h-16 w-16 text-gray-200" />
              <h3 className="mt-4 text-lg font-bold text-gray-900">No orders yet</h3>
              <p className="mt-2 text-gray-500 max-w-xs mx-auto">Start your sustainable shopping journey to build your eco-score!</p>
              <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-colors">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group flex items-center justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-900">Order #{order.id}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-bold text-gray-900">${order.total_price.toFixed(2)}</p>
                    <div className="flex items-center justify-end gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Leaf className="h-3 w-3" />
                      {order.total_carbon.toFixed(1)} kg CO₂e
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
