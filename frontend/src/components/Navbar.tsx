import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function Navbar() {
  return (
    <header className="glass sticky top-0 z-50 border-b border-white/30">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900 group-hover:text-brand-600 transition">
            ReliefGrid
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
          <Link to="/"         className="hover:text-brand-600 transition">Home</Link>
          <Link to="/features" className="hover:text-brand-600 transition">Features</Link>
          <Link to="/pricing"  className="hover:text-brand-600 transition">Pricing</Link>
          <Link to="/about"    className="hover:text-brand-600 transition">About</Link>
          <Link to="/contact"  className="hover:text-brand-600 transition">Contact</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
          <Link to="/register" className="btn-primary text-sm">Get Started</Link>
        </div>
      </div>
    </header>
  );
}