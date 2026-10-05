import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="glass border-t border-white/30 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">ReliefGrid</span>
            </div>
            <p className="text-sm text-slate-600">
              AI-powered disaster relief resource allocation.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/features" className="hover:text-brand-600">Features</Link></li>
              <li><Link to="/pricing"  className="hover:text-brand-600">Pricing</Link></li>
              <li><Link to="/map"      className="hover:text-brand-600">Relief Map</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/about"   className="hover:text-brand-600">About</Link></li>
              <li><Link to="/contact" className="hover:text-brand-600">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-brand-600">Privacy</a></li>
              <li><a href="#" className="hover:text-brand-600">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/30 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} ReliefGrid. All rights reserved.
        </div>
      </div>
    </footer>
  );
}