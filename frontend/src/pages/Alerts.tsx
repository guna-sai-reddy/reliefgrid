import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Filter, ShieldAlert, Loader2, MapPin,
  Sparkles, Brain, Package, Droplets, Shield, Home
} from "lucide-react";
import { alertsApi, type Alert } from "../lib/api";
import { useTranslation } from "../store/langStore";

const severityBadge: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  severe:   "bg-orange-100 text-orange-700 border-orange-200",
  warning:  "bg-amber-100 text-amber-700 border-amber-200",
  info:     "bg-blue-100 text-blue-700 border-blue-200",
};

const severityBorder: Record<string, string> = {
  critical: "border-l-red-500",
  severe:   "border-l-orange-500",
  warning:  "border-l-amber-500",
  info:     "border-l-blue-500",
};

function parseResourceRequirements(msg: string) {
  const match = msg.match(/Food\s+([\d,]+).*?Water\s+([\d,]+)\s*L.*?Medical\s+([\d,]+)\s*kits.*?Shelter\s+([\d,]+)\s*capacity/i);
  if (!match) return null;
  return {
    food: match[1],
    water: match[2],
    medical: match[3],
    shelter: match[4],
  };
}

export default function Alerts() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    severity: "severe",
    region: "National",
  });

  const alertsQ = useQuery({
    queryKey: ["alerts-all"],
    queryFn: () => alertsApi.list(100),
    refetchInterval: 10000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Alert>) => alertsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts-all"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setIsModalOpen(false);
      setFormData({ title: "", message: "", severity: "severe", region: "National" });
    },
  });

  const alerts = (alertsQ.data ?? []).filter((a) =>
    filterSeverity === "all" ? true : a.severity === filterSeverity
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("alerts.title")}</h1>
          <p className="text-sm text-slate-500">
            {t("alerts.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/predict"
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 font-medium rounded-xl hover:bg-rose-100 transition shadow-sm text-sm"
          >
            <Brain className="w-4 h-4 text-rose-600" />
            {t("alerts.ai_btn")}
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            {t("alerts.broadcast")}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600 font-medium">{t("alerts.filter")}</span>
          {["all", "critical", "severe", "warning", "info"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                filterSeverity === sev
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t(sev)}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {alerts.length} {t("alerts.active_count")}
        </span>
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {alertsQ.isLoading ? (
          <div className="glass-card p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            {t("common.loading", "Loading alert feed...")}
          </div>
        ) : alerts.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-500">
            {t("dash.no_alerts", "No active alerts matching your filter.")}
          </div>
        ) : (
          alerts.map((alert) => {
            const isAiAlert = alert.title.startsWith("AI") || alert.message.includes("AI prediction");
            const resources = parseResourceRequirements(alert.message);

            return (
              <div
                key={alert.id}
                className={`glass-card p-5 flex items-start gap-4 hover:shadow-md transition border-l-4 ${
                  severityBorder[alert.severity] || "border-l-slate-400"
                }`}
              >
                <div
                  className={`p-3 rounded-xl border flex-shrink-0 ${
                    severityBadge[alert.severity] || "bg-slate-100"
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-base">{t(alert.title, alert.title)}</h3>
                      {isAiAlert && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                          <Sparkles className="w-3 h-3 text-rose-500" />
                          {t("alerts.ai_badge", "AI Prediction")}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border font-semibold capitalize flex-shrink-0 ${
                        severityBadge[alert.severity]
                      }`}
                    >
                      {t(alert.severity)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mt-1">{t(alert.message, alert.message)}</p>

                  {resources && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium">
                        <Package className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>{t("Food")}: {resources.food}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-medium">
                        <Droplets className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span>{t("Water")}: {resources.water} L</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium">
                        <Shield className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                        <span>{t("Medical")}: {resources.medical}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium">
                        <Home className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{t("Shelter")}: {resources.shelter}</span>
                      </div>
                    </div>
                  )}

                  {alert.region && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-3 font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{alert.region}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Alert Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Broadcast Emergency Alert</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Alert Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., FLASH FLOOD WARNING: Sector 4"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Message Description
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Immediate evacuation advisory and shelter locations..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Severity
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm capitalize"
                  >
                    <option value="critical">Critical</option>
                    <option value="severe">Severe</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Region
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition"
                >
                  {createMutation.isPending ? "Broadcasting..." : "Broadcast Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
