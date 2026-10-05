import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Truck, Cpu, CheckCircle2, Navigation,
  Building2, AlertTriangle, Loader2, ArrowRight, Plus, Download, X, Lock
} from "lucide-react";
import { missionsApi, optimizerApi, depotsApi, incidentsApi } from "../lib/api";
import DataTable from "../components/DataTable";
import StatCard from "../components/StatCard";
import { useTranslation } from "../store/langStore";
import { useAuthStore } from "../store/authStore";

const statusColor: Record<string, string> = {
  planned:    "bg-amber-100 text-amber-700 border-amber-200",
  dispatched: "bg-blue-100 text-blue-700 border-blue-200",
  in_transit: "bg-indigo-100 text-indigo-700 border-indigo-200",
  delivered:  "bg-purple-100 text-purple-700 border-purple-200",
  completed:  "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function Missions() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const [isOptimizerModalOpen, setIsOptimizerModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // Optimizer Form State
  const [maxTripKm, setMaxTripKm] = useState(500);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  // Dispatch Form State
  const [selectedDepotId, setSelectedDepotId] = useState("");
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [foodQty, setFoodQty] = useState(5000);
  const [waterQty, setWaterQty] = useState(10000);
  const [medicalQty, setMedicalQty] = useState(250);
  const [shelterQty, setShelterQty] = useState(500);

  const missionsQ = useQuery({
    queryKey: ["missions-all"],
    queryFn: missionsApi.list,
    refetchInterval: 10000,
  });

  const depotsQ = useQuery({ queryKey: ["depots-all"], queryFn: depotsApi.list });
  const incidentsQ = useQuery({ queryKey: ["incidents-all"], queryFn: () => incidentsApi.list(100) });

  const optimizeMutation = useMutation({
    mutationFn: () => optimizerApi.allocate(maxTripKm),
    onSuccess: (data) => {
      setOptimizationResult(data);
      queryClient.invalidateQueries({ queryKey: ["missions-all"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      const payloadSummary = `Food: ${foodQty.toLocaleString()} Pks, Water: ${waterQty.toLocaleString()} L, Medical: ${medicalQty.toLocaleString()} Kits, Shelter: ${shelterQty.toLocaleString()} Units`;
      return await missionsApi.create({
        depot_id: selectedDepotId || (depots[0]?.id ?? ""),
        incident_id: selectedIncidentId || (incidents[0]?.id ?? ""),
        resources_summary: payloadSummary,
        distance_km: 185.0,
        eta_hours: 2.5,
      });
    },
    onSuccess: () => {
      setIsDispatchModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["missions-all"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      missionsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions-all"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const missions = missionsQ.data ?? [];
  const depots = depotsQ.data ?? [];
  const incidents = incidentsQ.data ?? [];

  const inTransitCount = missions.filter((m) => m.status === "in_transit" || m.status === "dispatched").length;
  const completedCount = missions.filter((m) => m.status === "completed" || m.status === "delivered").length;
  const totalKm = missions.reduce((acc, m) => acc + (m.distance_km || 0), 0);

  const handleExportManifest = (m: any) => {
    const depot = depots.find((d) => d.id === m.depot_id);
    const incident = incidents.find((i) => i.id === m.incident_id);

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ReliefGrid - Convoy Dispatch Manifest (${m.code})</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
            .header { border-bottom: 2px solid #cbd5e1; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; }
            .title { font-size: 24px; font-weight: 800; color: #e11d48; }
            .code { font-family: monospace; font-size: 18px; background: #f1f5f9; padding: 4px 12px; border-radius: 6px; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .lbl { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; }
            .val { font-size: 16px; font-weight: 700; color: #0f172a; }
            .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">ReliefGrid Convoy Dispatch Manifest</div>
              <div style="font-size: 14px; color: #64748b;">Official Emergency Convoy Transport Document</div>
            </div>
            <div>
              <div class="code">${m.code}</div>
            </div>
          </div>

          <div class="box grid">
            <div>
              <div class="lbl">Origin Supply Depot</div>
              <div class="val">${depot?.name || 'Central Depot'}</div>
            </div>
            <div>
              <div class="lbl">Destination Disaster Site</div>
              <div class="val">${incident?.location || 'Emergency Relief Zone'}</div>
            </div>
          </div>

          <div class="box">
            <div class="lbl">Cargo & Payload Summary</div>
            <div class="val" style="margin-top: 6px; color: #0369a1;">${m.resources_summary}</div>
          </div>

          <div class="box grid">
            <div>
              <div class="lbl">Estimated Distance</div>
              <div class="val">${m.distance_km} km</div>
            </div>
            <div>
              <div class="lbl">Target Dispatch ETA</div>
              <div class="val">~${m.eta_hours} hours</div>
            </div>
          </div>

          <div class="footer">
            ReliefGrid Dispatch System • Authorized Convoy Manifest • Keep document with vehicle commander
          </div>

          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("missions.title")}</h1>
          <p className="text-sm text-slate-500">
            {t("missions.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition shadow-sm cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            {t("missions.dispatch_btn")}
          </button>

          <button
            onClick={() => setIsOptimizerModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition shadow-sm cursor-pointer text-sm"
          >
            <Cpu className="w-4 h-4" />
            {t("Run AI Optimizer", "Run AI Optimizer")}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Missions"
          value={missions.length}
          icon={Truck}
          color="blue"
          subtitle={`${inTransitCount} currently active/in-transit`}
        />
        <StatCard
          label="Delivered & Completed"
          value={completedCount}
          icon={CheckCircle2}
          color="green"
          subtitle="Successful relief deliveries"
        />
        <StatCard
          label="Total Distance Covered"
          value={`${Math.round(totalKm).toLocaleString()} km`}
          icon={Navigation}
          color="amber"
          subtitle="Across active convoys"
        />
      </div>

      {/* Missions Table */}
      <div className="glass-card p-6 border border-slate-200/80 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-rose-600" />
            <h2 className="font-bold text-slate-900 text-base">{t("Active Missions", "Active Missions")}</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {missions.length} recorded dispatch routes
          </span>
        </div>

        {missionsQ.isLoading ? (
          <div className="text-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            {t("common.loading", "Loading missions...")}
          </div>
        ) : (
          <DataTable
            keyField="id"
            data={missions}
            emptyMessage={t("No missions dispatched yet.")}
            columns={[
              {
                key: "code",
                header: t("Mission Code", "Mission Code"),
                render: (m) => (
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    {m.code}
                  </span>
                ),
              },
              {
                key: "route",
                header: t("Depot -> Incident", "Depot -> Incident"),
                render: (m) => {
                  const depot = depots.find((d) => d.id === m.depot_id);
                  const incident = incidents.find((i) => i.id === m.incident_id);
                  return (
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {depot?.name || "Depot"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="flex items-center gap-1 text-slate-900 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        {incident?.location || "Incident Site"}
                      </span>
                    </div>
                  );
                },
              },
              {
                key: "resources_summary",
                header: t("Cargo Summary", "Payload"),
                render: (m) => (
                  <span className="text-xs font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 block max-w-md">
                    {m.resources_summary}
                  </span>
                ),
              },
              {
                key: "distance",
                header: t("Distance / ETA", "Distance / ETA"),
                render: (m) => (
                  <div className="text-xs text-slate-700 font-medium">
                    <span className="font-bold text-slate-900">{m.distance_km?.toFixed(1)} km</span>
                    <span className="text-slate-400 ml-1">
                      (~{(m.eta_hours || 0).toFixed(1)} hrs)
                    </span>
                  </div>
                ),
              },
              {
                key: "status",
                header: t("table.status", "Status"),
                render: (m) => (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border font-bold capitalize ${
                      statusColor[m.status] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {t(m.status)}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (m) => (
                  <div className="flex items-center gap-1.5">
                    {(m.status === "planned" || m.status === "dispatched") && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({ id: m.id, status: "in_transit" })
                        }
                        className="text-xs px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition font-semibold cursor-pointer"
                      >
                        Start Transit
                      </button>
                    )}
                    {m.status === "in_transit" && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({ id: m.id, status: "delivered" })
                        }
                        className="text-xs px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition font-semibold cursor-pointer"
                      >
                        Mark Delivered
                      </button>
                    )}
                    {m.status === "delivered" && (
                      isAdmin ? (
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({ id: m.id, status: "completed" })
                          }
                          disabled={updateStatusMutation.isPending}
                          className="text-xs px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-semibold cursor-pointer shadow-sm flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Complete (Admin)
                        </button>
                      ) : (
                        <span
                          title="Only System Administrators are authorized to mark missions as completed"
                          className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 font-medium inline-flex items-center gap-1 cursor-help"
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
                          Admin Required
                        </span>
                      )
                    )}
                    {m.status === "completed" && (
                      <span className="text-[11px] px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified Complete
                      </span>
                    )}
                    <button
                      onClick={() => handleExportManifest(m)}
                      title="Export Driver Manifest"
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>

      {/* Dispatch New Mission Modal */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Dispatch New Relief Mission
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manually assign convoy route and cargo payload
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                dispatchMutation.mutate();
              }}
              className="space-y-4 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Origin Supply Depot
                </label>
                <select
                  value={selectedDepotId}
                  onChange={(e) => setSelectedDepotId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-medium bg-slate-50"
                >
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.max_transport_per_trip} cap)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Target Incident Site
                </label>
                <select
                  value={selectedIncidentId}
                  onChange={(e) => setSelectedIncidentId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-medium bg-slate-50"
                >
                  {incidents.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.code} - {i.location} ({i.priority.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Food Packages (Pks)
                  </label>
                  <input
                    type="number"
                    value={foodQty}
                    onChange={(e) => setFoodQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Clean Water (L)
                  </label>
                  <input
                    type="number"
                    value={waterQty}
                    onChange={(e) => setWaterQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Medical Kits
                  </label>
                  <input
                    type="number"
                    value={medicalQty}
                    onChange={(e) => setMedicalQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Shelter Tents
                  </label>
                  <input
                    type="number"
                    value={shelterQty}
                    onChange={(e) => setShelterQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatchMutation.isPending}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-60"
                >
                  {dispatchMutation.isPending ? "Dispatching..." : "Dispatch Convoy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Optimizer Modal */}
      {isOptimizerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    AI Resource Allocation Optimizer
                  </h2>
                  <p className="text-xs text-slate-500">
                    Runs OR-Tools linear programming algorithm to match depot inventory with disaster demands
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOptimizerModalOpen(false);
                  setOptimizationResult(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Maximum Trip Distance Limit (km)
                </label>
                <input
                  type="number"
                  value={maxTripKm}
                  onChange={(e) => setMaxTripKm(parseInt(e.target.value) || 500)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-medium"
                />
              </div>

              {optimizationResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Optimization & Mission Dispatch Complete!</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    OR-Tools solver successfully generated optimized convoy dispatch routes and recorded them into the active missions log.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setIsOptimizerModalOpen(false);
                  setOptimizationResult(null);
                }}
                className="px-4 py-2 border rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => optimizeMutation.mutate()}
                disabled={optimizeMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition cursor-pointer disabled:opacity-60"
              >
                {optimizeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Solving LP...
                  </>
                ) : (
                  "Execute Optimizer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
