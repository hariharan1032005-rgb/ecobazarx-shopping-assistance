import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { Trash2, ShoppingBag, Leaf, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function Cart() {
  const { items, removeFromCart, clearCart, totalPrice, totalCarbon } = useCart();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    setIsCheckingOut(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          total_price: totalPrice,
          total_carbon: totalCarbon,
        }),
      });

      if (!res.ok) throw new Error('Checkout failed');

      clearCart();
      navigate('/profile');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 rounded-full bg-gray-100 p-6">
          <ShoppingBag className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-gray-600">Looks like you haven't added any eco-friendly products yet.</p>
        <Link
          to="/"
          className="mt-8 rounded-full bg-emerald-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>

        <div className="space-y-4">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-4 rounded-2xl border bg-white p-4"
            >
              <img
                src={item.image_url || `https://picsum.photos/seed/${item.id}/200/200`}
                alt={item.name}
                className="h-24 w-24 rounded-xl object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.category}</p>
                <div className="mt-2 flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900">${item.price.toFixed(2)}</span>
                  <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <Leaf className="h-3 w-3" />
                    {item.carbon_footprint} kg CO₂e
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Qty: {item.quantity}</span>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span className="text-emerald-600 font-medium">Free</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <Leaf className="h-5 w-5" />
              Carbon Footprint
            </div>
            <p className="mt-1 text-sm text-emerald-700">
              This order will emit approximately <span className="font-bold">{totalCarbon.toFixed(2)} kg CO₂e</span>.
            </p>
            {totalCarbon < 5 && (
              <p className="mt-2 text-xs text-emerald-600 italic">
                Great job! This is a low-carbon order.
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-full bg-emerald-600 py-4 font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {isCheckingOut ? 'Processing...' : 'Checkout Now'}
            <ArrowRight className="h-5 w-5" />
          </button>

          {!token && (
            <p className="mt-4 text-center text-xs text-gray-500">
              Please <Link to="/login" className="text-emerald-600 font-medium hover:underline">sign in</Link> to complete your purchase.
            </p>
          )}
        </div>

        {/* Alternatives Suggestion (Mock logic) */}
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/30 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800">Eco-Tip</h3>
          <p className="mt-2 text-sm text-emerald-700">
            Consider bundling your items to reduce shipping emissions by up to 30%.
          </p>
        </div>
      </div>
    </div>
  );
}
