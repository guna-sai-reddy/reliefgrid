import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, Plus, Search, Filter, ShieldAlert,
  MapPin, Users, Loader2
} from "lucide-react";
import { incidentsApi, type Incident } from "../lib/api";
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

export default function Incidents() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [overrideIncident, setOverrideIncident] = useState<Incident | null>(null);
  const [selectedPriority, setSelectedPriority] = useState("critical");

  // Form state for creating incident
  const [formData, setFormData] = useState({
    code: `INC-2026-${Math.floor(10 + Math.random() * 90)}`,
    type: "flood",
    location: "",
    latitude: 20.5937,
    longitude: 78.9629,
    affected_population: 5000,
    priority: "high",
    status: "active",
  });

  const incidentsQ = useQuery({
    queryKey: ["incidents-all"],
    queryFn: () => incidentsApi.list(100),
    refetchInterval: 15000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Incident>) => incidentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents-all"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["map-markers"] });
      queryClient.invalidateQueries({ queryKey: ["map-heatmap"] });
      setIsModalOpen(false);
      setFormData({
        code: `INC-2026-${Math.floor(10 + Math.random() * 90)}`,
        type: "flood",
        location: "",
        latitude: 20.5937,
        longitude: 78.9629,
        affected_population: 5000,
        priority: "high",
        status: "active",
      });
    },
  });

  const overrideMutation = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: string }) =>
      incidentsApi.overridePriority(id, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents-all"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setOverrideIncident(null);
    },
  });

  const filteredIncidents = (incidentsQ.data ?? []).filter((inc) => {
    const matchesSearch =
      inc.code.toLowerCase().includes(search.toLowerCase()) ||
      inc.location.toLowerCase().includes(search.toLowerCase()) ||
      inc.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || inc.status === filterStatus;
    const matchesPriority = filterPriority === "all" || inc.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("incidents.title")}</h1>
          <p className="text-sm text-slate-500">
            {t("incidents.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t("incidents.report_btn")}
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={t("Search by code, location, or type...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter className="w-4 h-4" />
            <span>{t("Filter:")}</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
          >
            <option value="all">{t("All Statuses")}</option>
            <option value="active">{t("Active")}</option>
            <option value="stabilising">{t("Stabilising")}</option>
            <option value="ongoing">{t("Ongoing")}</option>
            <option value="resolved">{t("Resolved")}</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
          >
            <option value="all">{t("All Priorities")}</option>
            <option value="critical">{t("Critical")}</option>
            <option value="high">{t("High")}</option>
            <option value="medium">{t("Medium")}</option>
            <option value="low">{t("Low")}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card p-6">
        {incidentsQ.isLoading ? (
          <div className="text-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            {t("common.loading", "Loading incidents...")}
          </div>
        ) : incidentsQ.isError ? (
          <div className="text-center py-12 text-red-500">
            {t("dash.failed_summary", "Failed to load incident records")}
          </div>
        ) : (
          <DataTable
            keyField="id"
            data={filteredIncidents}
            emptyMessage={t("No incidents match your filter")}
            columns={[
              {
                key: "code",
                header: t("table.code", "Code"),
                render: (r) => (
                  <span className="font-mono text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-1 rounded">
                    {r.code}
                  </span>
                ),
              },
              {
                key: "type",
                header: t("table.event_type", "Event Type"),
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="capitalize font-medium">{t(r.type)}</span>
                  </div>
                ),
              },
              {
                key: "location",
                header: t("table.location", "Location"),
                render: (r) => (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {r.location}
                  </div>
                ),
              },
              {
                key: "affected_population",
                header: t("table.affected", "Affected"),
                render: (r) => (
                  <div className="flex items-center gap-1 font-medium text-slate-900">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {r.affected_population?.toLocaleString()}
                  </div>
                ),
              },
              {
                key: "priority",
                header: t("table.priority", "Priority"),
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${
                        priorityColor[r.priority] ?? "bg-slate-100"
                      }`}
                    >
                      {t(r.priority)}
                    </span>
                    {r.priority_override && (
                      <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                        {t("Overridden")}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: "status",
                header: t("table.status", "Status"),
                render: (r) => (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                      statusColor[r.status] ?? "bg-slate-100"
                    }`}
                  >
                    {t(r.status)}
                  </span>
                ),
              },
              {
                key: "actions",
                header: t("table.actions", "Actions"),
                render: (r) => (
                  <button
                    onClick={() => {
                      setOverrideIncident(r);
                      setSelectedPriority(r.priority);
                    }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {t("Override")}
                  </button>
                ),
              },
            ]}
          />
        )}
      </div>

      {/* New Incident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Report New Incident</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Incident Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Event Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm capitalize"
                  >
                    <option value="flood">Flood</option>
                    <option value="earthquake">Earthquake</option>
                    <option value="cyclone">Cyclone</option>
                    <option value="drought">Drought</option>
                    <option value="landslide">Landslide</option>
                    <option value="wildfire">Wildfire</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Location Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Wayanad, Kerala"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Affected Pop.
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.affected_population}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        affected_population: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm capitalize"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm capitalize"
                  >
                    <option value="active">Active</option>
                    <option value="stabilising">Stabilising</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="resolved">Resolved</option>
                  </select>
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
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition"
                >
                  {createMutation.isPending ? "Creating..." : "Submit Incident"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Override Priority Modal */}
      {overrideIncident && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Override Priority ({overrideIncident.code})
            </h2>
            <p className="text-sm text-slate-500">
              Manually set the priority level for {overrideIncident.location}.
            </p>

            <div className="space-y-2">
              {["critical", "high", "medium", "low"].map((prio) => (
                <label
                  key={prio}
                  className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition ${
                    selectedPriority === prio
                      ? "border-brand-500 bg-brand-50/50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <span className="capitalize text-sm font-medium">{prio}</span>
                  <input
                    type="radio"
                    name="priority"
                    value={prio}
                    checked={selectedPriority === prio}
                    onChange={() => setSelectedPriority(prio)}
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setOverrideIncident(null)}
                className="px-4 py-2 border rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  overrideMutation.mutate({
                    id: overrideIncident.id,
                    priority: selectedPriority,
                  })
                }
                disabled={overrideMutation.isPending}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition"
              >
                {overrideMutation.isPending ? "Saving..." : "Save Override"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
