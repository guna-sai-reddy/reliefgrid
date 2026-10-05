import { useQuery } from "@tanstack/react-query";
import { Mail, Shield, Building, Phone, LogOut, Loader2 } from "lucide-react";
import { authApi } from "../lib/api";

export default function Profile() {
  const meQ = useQuery({
    queryKey: ["user-me"],
    queryFn: authApi.me,
  });

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    sessionStorage.clear();
    window.location.replace("/login");
  };

  const user = meQ.data ?? {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
        <p className="text-sm text-slate-500">
          Account credentials, assigned roles, and organizational permissions
        </p>
      </div>

      {meQ.isLoading ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading user profile...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card */}
          <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                {(user.full_name || "U")[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{user.full_name || "User"}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-brand-100 text-brand-700">
                    {user.role || "User"}
                  </span>
                  <span className="text-xs text-slate-400">
                    ID: <code className="font-mono">{user.id?.slice(0, 8)}...</code>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl font-medium text-sm transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* User Details */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 text-base border-b pb-3">
              Account Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-400">Email Address</div>
                  <div className="font-medium text-slate-900">{user.email}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <Building className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-400">Organization</div>
                  <div className="font-medium text-slate-900">
                    {user.organization || "ReliefGrid Command HQ"}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-400">Phone Contact</div>
                  <div className="font-medium text-slate-900">
                    {user.phone || "+91 (0) 11 2345 6789"}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <Shield className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-400">Security Clearance</div>
                  <div className="font-medium text-slate-900 capitalize">
                    {user.role} Level Clearance
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
