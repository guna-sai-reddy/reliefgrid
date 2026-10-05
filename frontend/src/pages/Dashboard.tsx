import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, Package, Users, Bell,
  TrendingUp, Activity, Loader2, MapPin,
} from "lucide-react";
import { dashboardApi, incidentsApi, alertsApi } from "../lib/api";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";

import { useTranslation } from "../store/langStore";

const priorityColor: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high:     "bg-orange-100 text-orange-700 border-orange-200",
  medium:   "bg-amber-100 text-amber-700 border-amber-200",
  low:      "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const statusColor: Record<string, string> = {
  active:       "bg-red-100 text-red-700",
  stabilising:  "bg-amber-100 text-amber-700",
  ongoing:      "bg-blue-100 text-blue-700",
  resolved:     "bg-emerald-100 text-emerald-700",
};

export default function Dashboard() {
  const { t } = useTranslation();
  const summaryQ = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: dashboardApi.summary,
    refetchInterval: 15000,
  });

  const incidentsQ = useQuery({
    queryKey: ["incidents-recent"],
    queryFn: () => incidentsApi.list(5),
    refetchInterval: 20000,
  });

  const alertsQ = useQuery({
    queryKey: ["alerts-recent"],
    queryFn: () => alertsApi.list(5),
    refetchInterval: 15000,
  });

  const cards = summaryQ.data?.cards;
  const breakdown = summaryQ.data?.priority_breakdown;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("dash.title")}</h1>
          <p className="text-sm text-slate-500">
            {t("dash.subtitle")}
          </p>
        </div>
        {summaryQ.isFetching && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            {t("nav.syncing")}
          </div>
        )}
      </div>

      {/* Stat cards */}
      {summaryQ.isLoading ? (
        <div className="glass-card p-10 text-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          {t("dash.loading", "Loading dashboard…")}
        </div>
      ) : summaryQ.isError ? (
        <div className="glass-card p-6 border-l-4 border-red-500">
          <div className="font-semibold text-red-700">{t("dash.failed_summary", "Failed to load summary")}</div>
          <div className="text-sm text-slate-600 mt-1">
            {t("dash.check_backend", "Make sure the backend is running on :8000")}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t("dash.active_incidents")}
            value={cards?.active_incidents ?? 0}
            icon={AlertTriangle}
            color="red"
            subtitle={`${cards?.critical_incidents ?? 0} ${t("dash.critical")}`}
          />
          <StatCard
            label={t("dash.resources_deployed")}
            value={(cards?.resources_deployed ?? 0).toLocaleString()}
            icon={Package}
            color="blue"
            subtitle={`${cards?.active_depots ?? 0} ${t("dash.depots")}`}
          />
          <StatCard
            label={t("dash.people_assisted")}
            value={(cards?.people_assisted ?? 0).toLocaleString()}
            icon={Users}
            color="green"
          />
          <StatCard
            label={t("dash.active_alerts")}
            value={cards?.active_alerts ?? 0}
            icon={Bell}
            color="amber"
          />
        </div>
      )}

      {/* Priority breakdown + Incidents table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority breakdown */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-brand-600" />
            <h2 className="font-semibold">{t("dash.priority_breakdown", "Priority Breakdown")}</h2>
          </div>
          {breakdown && (
            <div className="space-y-3">
              {Object.entries(breakdown).map(([key, count]) => {
                const total = Object.values(breakdown).reduce(
                  (a, b) => (a as number) + (b as number), 0
                ) as number;
                const pct = total ? Math.round(((count as number) / total) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{t(key)}</span>
                      <span className="text-slate-500">
                        {count as number} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          key === "critical" ? "bg-red-500" :
                          key === "high"     ? "bg-orange-500" :
                          key === "medium"   ? "bg-amber-500" :
                                               "bg-emerald-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent incidents */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-brand-600" />
            <h2 className="font-semibold">{t("dash.recent_incidents", "Recent Incidents")}</h2>
          </div>
          {incidentsQ.isLoading ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              {t("common.loading", "Loading…")}
            </div>
          ) : incidentsQ.isError ? (
            <div className="text-center py-6 text-red-500 text-sm">
              {t("dash.failed_summary", "Failed to load incidents")}
            </div>
          ) : (
            <DataTable
              keyField="id"
              data={incidentsQ.data ?? []}
              emptyMessage={t("dash.no_incidents", "No incidents yet")}
              columns={[
                {
                  key: "code",
                  header: t("table.code", "Code"),
                  render: (r) => (
                    <span className="font-mono text-xs text-slate-600">
                      {r.code}
                    </span>
                  ),
                },
                {
                  key: "type",
                  header: t("table.type", "Type"),
                  render: (r) => (
                    <span className="capitalize">{t(r.type)}</span>
                  ),
                },
                {
                  key: "location",
                  header: t("table.location", "Location"),
                  render: (r) => (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {r.location}
                    </div>
                  ),
                },
                {
                  key: "affected_population",
                  header: t("table.affected", "Affected"),
                  render: (r) => (
                    <span className="font-medium">
                      {r.affected_population?.toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: "priority",
                  header: t("table.priority", "Priority"),
                  render: (r) => (
                    <span
                      className={`text-xs px-2 py-1 rounded-full border font-medium capitalize ${
                        priorityColor[r.priority] ?? "bg-slate-100"
                      }`}
                    >
                      {t(r.priority)}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: t("table.status", "Status"),
                  render: (r) => (
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                        statusColor[r.status] ?? "bg-slate-100"
                      }`}
                    >
                      {t(r.status)}
                    </span>
                  ),
                },
              ]}
            />
          )}
        </div>
      </div>

      {/* Alerts feed */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-brand-600" />
          <h2 className="font-semibold">{t("dash.recent_alerts", "Recent Alerts")}</h2>
        </div>
        {alertsQ.isLoading ? (
          <div className="text-center py-6 text-slate-400 text-sm">{t("common.loading", "Loading…")}</div>
        ) : (alertsQ.data ?? []).length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            {t("dash.no_alerts", "No alerts")}
          </div>
        ) : (
          <div className="space-y-3">
            {(alertsQ.data ?? []).map((a: any) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/60 transition"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    a.severity === "critical" ? "bg-red-500" :
                    a.severity === "severe"   ? "bg-orange-500" :
                    a.severity === "warning"  ? "bg-amber-500" :
                                                "bg-blue-500"
                  }`}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{t(a.title, a.title)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {t(a.message, a.message)}
                  </div>
                </div>
                <span className="text-xs text-slate-400 capitalize">
                  {t(a.severity)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}