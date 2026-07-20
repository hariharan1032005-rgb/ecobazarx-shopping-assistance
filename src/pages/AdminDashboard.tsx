import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AdminStats } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Users, ShoppingCart, Leaf, TrendingUp, Package, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data);
      setIsLoading(false);
    };
    fetchStats();
  }, [token]);

  if (isLoading || !stats) {
    return <div className="flex h-screen items-center justify-center text-gray-400">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <LayoutDashboard className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Carbon Saved', value: `${stats.totalCarbonSaved.toFixed(1)} kg`, icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Eco Efficiency', value: '84%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Sales by Category */}
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Sales by Category</h2>
          <div className="mt-8 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.salesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="total_sales"
                  nameKey="category"
                >
                  {stats.salesByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Carbon Footprint Trends */}
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Carbon Footprint Trends</h2>
          <div className="mt-8 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.carbonByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="carbon"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#10b981' }}
                  activeDot={{ r: 8 }}
                  name="Total CO₂e (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Performance */}
        <div className="rounded-3xl border bg-white p-8 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900">Sales Performance</h2>
          <div className="mt-8 h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.salesByCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="total_sales"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                  name="Total Sales ($)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
