import { useState, useEffect } from 'react';
import { Search, Filter, Leaf, ShoppingCart, Info } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('carbon_low');
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      const params = new URLSearchParams({ search, category, sort });
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data);
    };
    fetchProducts();
  }, [search, category, sort]);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-emerald-900 px-8 py-16 text-white">
        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Shop with <span className="text-emerald-400">Carbon Consciousness</span>
          </h1>
          <p className="text-lg text-emerald-100">
            EcoBazaar helps you track the carbon footprint of every purchase.
            Make smarter choices for a greener planet.
          </p>
        </div>
        <Leaf className="absolute -right-16 -top-16 h-96 w-96 rotate-12 text-emerald-800/50" />
      </section>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-gray-200 bg-white py-2 pl-10 pr-4 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="Apparel">Apparel</option>
            <option value="Personal Care">Personal Care</option>
            <option value="Home">Home</option>
            <option value="Appliances">Appliances</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="carbon_low">Lowest Carbon</option>
            <option value="carbon_high">Highest Carbon</option>
            <option value="price_low">Lowest Price</option>
            <option value="price_high">Highest Price</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-lg"
          >
            <div className="aspect-square w-full overflow-hidden bg-gray-100">
              <img
                src={product.image_url || `https://picsum.photos/seed/${product.id}/400/400`}
                alt={product.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  <Leaf className="h-3 w-3" />
                  {product.carbon_footprint} kg CO₂e
                </div>
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-gray-600">{product.description}</p>

              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                <button
                  onClick={() => addToCart(product)}
                  className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add
                </button>
              </div>

              {product.is_eco_certified && (
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  <Info className="h-3 w-3" />
                  Eco Certified
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
