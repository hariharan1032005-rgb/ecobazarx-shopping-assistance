import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Leaf, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { cn } from '../lib/utils';

export function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-emerald-600">
          <Leaf className="h-8 w-8" />
          <span>EcoBazaar</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/"
            className={cn(
              "text-sm font-medium transition-colors hover:text-emerald-600",
              location.pathname === '/' ? "text-emerald-600" : "text-gray-600"
            )}
          >
            Catalog
          </Link>

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-1 text-sm font-medium transition-colors hover:text-emerald-600",
                location.pathname === '/admin' ? "text-emerald-600" : "text-gray-600"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          )}

          <Link
            to="/cart"
            className="relative flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-emerald-600">
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-gray-600 hover:text-red-500"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
