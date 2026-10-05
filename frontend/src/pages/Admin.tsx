import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import {
  Shield, Users, Database, Cpu, Activity, CheckCircle2,
  AlertTriangle, Trash2, RefreshCw, Search, UserCheck, UserX,
  Radio, Send, Truck, BarChart3, ArrowRight,
  Building2, Sparkles, Layers, Plus, Edit, Package, Droplets, Utensils, Home, X
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  adminApi, alertsApi, missionsApi, depotsApi, incidentsApi, resourcesApi,
  type SystemHealth, type Alert, type Mission, type Depot, type Resource
} from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { useTranslation } from "../store/langStore";

const roleColors: Record<string, string> = {
  admin: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
  commander: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  coordinator: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  viewer: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
};

const severityStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  critical: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    dot: "bg-rose-600",
  },
  severe: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
};

const PIE_COLORS = ["#e11d48", "#f59e0b", "#3b82f6", "#64748b"];

export default function Admin() {
  const { user } = useAuthStore();
  const { config } = useThemeStore();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"overview" | "alerts" | "missions" | "users" | "warehouses">("overview");

  // User management state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Alert broadcast state
  const [broadcastData, setBroadcastData] = useState({
    title: "",
    message: "",
    severity: "critical",
    region: "All Disaster Zones",
  });

  // Warehouse & Resource management state
  const [selectedDepotFilter, setSelectedDepotFilter] = useState<string>("all");
  const [isDepotModalOpen, setIsDepotModalOpen] = useState(false);
  const [editingDepot, setEditingDepot] = useState<Depot | null>(null);
  const [depotForm, setDepotForm] = useState({
    name: "",
    latitude: 20.5937,
    longitude: 78.9629,
    max_transport_per_trip: 5000,
  });

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceForm, setResourceForm] = useState({
    depot_id: "",
    type: "food",
    quantity: 1000,
    unit: "pkts",
  });

  // Guard: Only admin can access this page
  if (user && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Queries
  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.listUsers,
    refetchInterval: 15000,
  });

  const healthQ = useQuery({
    queryKey: ["admin-health"],
    queryFn: adminApi.getSystemHealth,
    refetchInterval: 10000,
  });

  const alertsQ = useQuery({
    queryKey: ["alerts-all"],
    queryFn: () => alertsApi.list(50),
    refetchInterval: 10000,
  });

  const missionsQ = useQuery({
    queryKey: ["missions-all"],
    queryFn: missionsApi.list,
    refetchInterval: 10000,
  });

  const depotsQ = useQuery({ queryKey: ["depots-all"], queryFn: depotsApi.list });
  const incidentsQ = useQuery({ queryKey: ["incidents-all"], queryFn: () => incidentsApi.list(100) });
  const resourcesQ = useQuery({ queryKey: ["resources-all"], queryFn: () => resourcesApi.list(), refetchInterval: 10000 });

  // Warehouse (Depot) Mutations
  const createDepotMutation = useMutation({
    mutationFn: (payload: { name: string; latitude: number; longitude: number; max_transport_per_trip: number }) =>
      depotsApi.create(payload),
    onSuccess: (depot) => {
      queryClient.invalidateQueries({ queryKey: ["depots-all"] });
      queryClient.invalidateQueries({ queryKey: ["map-markers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-health"] });
      setIsDepotModalOpen(false);
      setEditingDepot(null);
      setDepotForm({ name: "", latitude: 20.5937, longitude: 78.9629, max_transport_per_trip: 5000 });
      setActionMessage({ text: `Warehouse "${depot.name}" created successfully!`, type: "success" });
      setTimeout(() => setActionMessage(null), 5000);
    },
    onError: (err: any) => {
      setActionMessage({ text: err?.response?.data?.detail || "Failed to create warehouse", type: "error" });
      setTimeout(() => setActionMessage(null), 5000);
    },
  });

  const updateDepotMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Depot> }) =>
      depotsApi.update(id, payload),
    onSuccess: (depot) => {
      queryClient.invalidateQueries({ queryKey: ["depots-all"] });
      queryClient.invalidateQueries({ queryKey: ["map-markers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-health"] });
      setIsDepotModalOpen(false);
      setEditingDepot(null);
      setActionMessage({ text: `Warehouse "${depot.name}" updated successfully!`, type: "success" });
      setTimeout(() => setActionMessage(null), 5000);
    },
    onError: (err: any) => {
      setActionMessage({ text: err?.response?.data?.detail || "Failed to update warehouse", type: "error" });
      setTimeout(() => setActionMessage(null), 5000);
    },
  });

  const deleteDepotMutation = useMutation({
    mutationFn: (id: string) => depotsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["depots-all"] });
      queryClient.invalidateQueries({ queryKey: ["resources-all"] });
      queryClient.invalidateQueries({ queryKey: ["map-markers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-health"] });
      setActionMessage({ text: "Warehouse and associated resources removed successfully.", type: "success" });
      setTimeout(() => setActionMessage(null), 5000);
    },
    onError: (err: any) => {
      setActionMessage({ text: err?.response?.data?.detail || "Failed to delete warehouse", type: "error" });
      setTimeout(() => setActionMessage(null), 5000);
    },
  });

  // Resource Mutations
  const createResourceMutation = useMutation({
    mutationFn: (payload: { depot_id: string; type: string; quantity: number; unit: string }) =>
      resourcesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources-all"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setIsResourceModalOpen(false);
      setEditingResource(null);
      setActionMessage({ text: "Resource stock added successfully!", type: "success" });
      setTimeout(() => setActionMessage(null), 5000);
    },
    onError: (err: any) => {
      setActionMessage({ text: err?.response?.data?.detail || "Failed to add resource", type: "error" });
      setTimeout(() => setActionMessage(null), 5000);
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { quantity?: number; unit?: string } }) =>
      resourcesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources-all"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setIsResourceModalOpen(false);
      setEditingResource(null);
      setActionMessage({ text: "Resource quantity updated successfully!", type: "success" });
      setTimeout(() => setActionMessage(null), 5000);
    },
    onError: (err: any) => {
      setActionMessage({ text: err?.response?.data?.detail || "Failed to update resource", type: "error" });
      setTimeout(() => setActionMessage(null), 5000);
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => resourcesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources-all"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setActionMessage({ text: "Resource entry removed.", type: "success" });
      setTimeout(() => setActionMessage(null), 5000);
    },
    onError: (err: any) => {
      setActionMessage({ text: err?.response?.data?.detail || "Failed to delete resource", type: "error" });
      setTimeout(() => setActionMessage(null), 5000);
    },
  });

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setActionMessage({ text: `Updated ${updated.email} to role "${updated.role}"`, type: "success" });
      setTimeout(() => setActionMessage(null), 4000);
    },
    onError: (err: any) => {
      setActionMessage({ text: err?.response?.data?.detail || "Failed to update role", type: "error" });
      setTimeout(() => setActionMessage(null), 4000);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminApi.toggleUserStatus(userId, isActive),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setActionMessage({
        text: `Account ${updated.email} is now ${updated.is_active ? "ACTIVE" : "SUSPENDED"}`,
        type: "success",
      });
      setTimeout(() => setActionMessage(null), 4000);
    },
    onError: (err: any) => {
      setActionMessage({ text: err?.response?.data?.detail || "Failed to toggle status", type: "error" });
      setTimeout(() => setActionMessage(null), 4000);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-health"] });
      setActionMessage({ text: "User account deleted successfully", type: "success" });
      setTimeout(() => setActionMessage(null), 4000);
    },
    onError: (err: any) => {
      setActionMessage({ text: err?.response?.data?.detail || "Failed to delete user", type: "error" });
      setTimeout(() => setActionMessage(null), 4000);
    },
  });

  // Admin Broadcast Alert Mutation
  const broadcastMutation = useMutation({
    mutationFn: (payload: Partial<Alert>) => alertsApi.create(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["alerts-all"] });
      queryClient.invalidateQueries({ queryKey: ["admin-health"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setActionMessage({
        text: `EMERGENCY ALERT BROADCASTED: "${created.title}" sent to all responders!`,
        type: "success",
      });
      setBroadcastData({
        title: "",
        message: "",
        severity: "critical",
        region: "All Disaster Zones",
      });
      setTimeout(() => setActionMessage(null), 5000);
    },
    onError: (err: any) => {
      setActionMessage({ text: err?.response?.data?.detail || "Failed to broadcast alert", type: "error" });
      setTimeout(() => setActionMessage(null), 5000);
    },
  });

  // Admin Complete Mission Mutation
  const completeMissionMutation = useMutation({
    mutationFn: (missionId: string) => missionsApi.updateStatus(missionId, "completed"),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["missions-all"] });
      queryClient.invalidateQueries({ queryKey: ["admin-health"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setActionMessage({
        text: `Mission ${updated.code} verified and marked as COMPLETED by Administrator!`,
        type: "success",
      });
      setTimeout(() => setActionMessage(null), 5000);
    },
    onError: (err: any) => {
      setActionMessage({ text: err?.response?.data?.detail || "Failed to complete mission", type: "error" });
      setTimeout(() => setActionMessage(null), 5000);
    },
  });

  const users = usersQ.data || [];
  const health: SystemHealth | undefined = healthQ.data;
  const alerts: Alert[] = alertsQ.data || [];
  const missions: Mission[] = missionsQ.data || [];
  const depots = depotsQ.data || [];
  const incidents = incidentsQ.data || [];
  const resources = resourcesQ.data || [];

  const resourceTotals = resources.reduce(
    (acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + (r.quantity || 0);
      return acc;
    },
    { food: 0, water: 0, medical: 0, shelter: 0 } as Record<string, number>
  );

  const totalTransportCap = depots.reduce(
    (acc, d) => acc + (d.max_transport_per_trip || 0),
    0
  );

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.organization && u.organization.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  // Analytics & Chart Data preparation
  const entityDistributionData = [
    { name: "Incidents", count: health?.total_incidents ?? incidents.length, fill: "#f43f5e" },
    { name: "Missions", count: health?.total_missions ?? missions.length, fill: "#3b82f6" },
    { name: "Volunteers", count: health?.total_volunteers ?? 7, fill: "#10b981" },
    { name: "Alerts", count: health?.total_alerts ?? alerts.length, fill: "#f59e0b" },
    { name: "Depots", count: health?.total_depots ?? depots.length, fill: "#8b5cf6" },
    { name: "Accounts", count: health?.total_users ?? users.length, fill: "#06b6d4" },
  ];

  const roleCounts: Record<string, number> = { admin: 0, commander: 0, coordinator: 0, viewer: 0 };
  users.forEach((u) => {
    if (roleCounts[u.role] !== undefined) roleCounts[u.role]++;
    else roleCounts.viewer++;
  });

  const roleChartData = [
    { name: "Admins", value: roleCounts.admin, color: "#e11d48" },
    { name: "Commanders", value: roleCounts.commander, color: "#f59e0b" },
    { name: "Coordinators", value: roleCounts.coordinator, color: "#3b82f6" },
    { name: "Viewers", value: roleCounts.viewer, color: "#64748b" },
  ];

  const missionStatusCounts = {
    planned: missions.filter((m) => m.status === "planned" || m.status === "dispatched").length,
    in_transit: missions.filter((m) => m.status === "in_transit").length,
    delivered: missions.filter((m) => m.status === "delivered").length,
    completed: missions.filter((m) => m.status === "completed").length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                style={{ backgroundColor: config.accentHex }}
              >
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {t("admin.title")}
                  </h1>
                  <span className="px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    ROOT CONTROL
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Superuser system governance, emergency alert broadcasting, mission completion verification & telemetry.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                usersQ.refetch();
                healthQ.refetch();
                alertsQ.refetch();
                missionsQ.refetch();
              }}
              disabled={usersQ.isFetching || healthQ.isFetching}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${usersQ.isFetching ? "animate-spin text-rose-500" : ""}`} />
              <span>Sync Telemetry</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "overview"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview & Visualizations</span>
          </button>

          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer relative ${
              activeTab === "alerts"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Radio className="w-4 h-4 text-rose-500" />
            <span>Broadcast Alerts</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-2 right-2" />
          </button>

          <button
            onClick={() => setActiveTab("missions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "missions"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Truck className="w-4 h-4 text-emerald-500" />
            <span>Mission Completion Oversight</span>
            {missions.filter((m) => m.status === "delivered").length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                {missions.filter((m) => m.status === "delivered").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "users"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4 text-blue-500" />
            <span>User Governance</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("warehouses")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "warehouses"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4 text-purple-500" />
            <span>Warehouses & Resources</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold">
              {depots.length}
            </span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-sm font-semibold flex items-center justify-between border shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW & DATA VISUALIZATIONS                    */}
      {/* ======================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Registered Accounts
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black mt-2 text-slate-900 dark:text-slate-100">
                {health?.total_users ?? users.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Superusers, commanders & responders</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  PostgreSQL Cluster
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {health?.database_connected ? "Operational" : "Degraded"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Port 5432 · Latency &lt; 3ms · ACID active</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  AI / OR-Tools Ensemble
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-xl font-black text-purple-600 dark:text-purple-400">
                  {health?.ml_ensemble_ready ? "Online & Ready" : "Initializing"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Predictor & Convoy Optimizer synced</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Rescue Responders
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black mt-2 text-slate-900 dark:text-slate-100">
                {health?.total_volunteers ?? 7}
              </div>
              <p className="text-xs text-slate-500 mt-1">Inducted certified personnel</p>
            </div>
          </div>

          {/* Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Entity Distribution Bar Chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    System Resources & Entity Distribution
                  </h2>
                  <p className="text-xs text-slate-500">Live counts across all database models</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  <Layers className="w-3.5 h-3.5 text-rose-500" />
                  <span>Real-Time Sync</span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={entityDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        backgroundColor: "#0f172a",
                        color: "#fff",
                        border: "none",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Role Composition Donut Chart */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  User Role Distribution (RBAC)
                </h2>
                <p className="text-xs text-slate-500">Breakdown of active system credentials</p>
              </div>

              <div className="h-52 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {roleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        backgroundColor: "#0f172a",
                        color: "#fff",
                        border: "none",
                        fontSize: "12px",
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[11px] text-slate-400 text-center border-t border-slate-100 dark:border-slate-800/80 pt-3">
                Total: <strong className="text-slate-900 dark:text-slate-100">{users.length} authenticated profiles</strong>
              </div>
            </div>
          </div>

          {/* Chart 3: Mission Fleet Operational Health */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Relief Mission Fleet Lifecycle
                </h2>
                <p className="text-xs text-slate-500">
                  Tracking from dispatch allocation to Admin-verified completion
                </p>
              </div>
              <button
                onClick={() => setActiveTab("missions")}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All Missions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                  Planned / Dispatched
                </span>
                <div className="text-2xl font-black text-amber-800 dark:text-amber-200 mt-1">
                  {missionStatusCounts.planned}
                </div>
                <div className="text-[11px] text-amber-600 mt-0.5">Route assigned</div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                  In Transit
                </span>
                <div className="text-2xl font-black text-blue-800 dark:text-blue-200 mt-1">
                  {missionStatusCounts.in_transit}
                </div>
                <div className="text-[11px] text-blue-600 mt-0.5">Convoys on the road</div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase">
                  Delivered at Site
                </span>
                <div className="text-2xl font-black text-purple-800 dark:text-purple-200 mt-1">
                  {missionStatusCounts.delivered}
                </div>
                <div className="text-[11px] text-purple-600 mt-0.5">Awaiting Admin sign-off</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                  Verified Complete
                </span>
                <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
                  {missionStatusCounts.completed}
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Admin authorized</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: EMERGENCY ALERT BROADCAST (ADMIN-ONLY FEATURE)   */}
      {/* ======================================================== */}
      {activeTab === "alerts" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Alert Composer */}
          <div className="lg:col-span-6 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Admin Emergency Alert Broadcaster
                </h2>
                <p className="text-xs text-slate-500">
                  Issue high-priority announcements and live alerts pushed instantaneously to all responders
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!broadcastData.title.trim() || !broadcastData.message.trim()) {
                  setActionMessage({ text: "Please enter an alert title and message bulletin", type: "error" });
                  return;
                }
                broadcastMutation.mutate(broadcastData);
              }}
              className="space-y-4 pt-2"
            >
              {/* Severity Pill Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Severity Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["critical", "severe", "warning", "info"] as const).map((sev) => {
                    const isSelected = broadcastData.severity === sev;
                    return (
                      <button
                        type="button"
                        key={sev}
                        onClick={() => setBroadcastData({ ...broadcastData, severity: sev })}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold capitalize border transition cursor-pointer flex flex-col items-center gap-1 ${
                          isSelected
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md ring-2 ring-rose-500/50"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${severityStyles[sev]?.dot || "bg-slate-400"}`} />
                        <span>{sev}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Alert Title / Headline
                </label>
                <input
                  type="text"
                  required
                  value={broadcastData.title}
                  onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                  placeholder="e.g. FLASH FLOOD RED ALERT: IMMEDIATE EVACUATION"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              {/* Target Region */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Target Disaster Zone / Region
                </label>
                <input
                  type="text"
                  required
                  value={broadcastData.region}
                  onChange={(e) => setBroadcastData({ ...broadcastData, region: e.target.value })}
                  placeholder="e.g. Wayanad, Kerala or National"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["National", "Wayanad, Kerala", "Puri, Odisha", "Shimla, HP", "Chennai, TN"].map((reg) => (
                    <button
                      type="button"
                      key={reg}
                      onClick={() => setBroadcastData({ ...broadcastData, region: reg })}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                    >
                      {reg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Emergency Bulletin / Advisory Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={broadcastData.message}
                  onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                  placeholder="Provide urgent evacuation details, emergency shelters, safety instructions, or supply locations..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={broadcastMutation.isPending}
                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs tracking-wide uppercase transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{broadcastMutation.isPending ? "Broadcasting..." : "Broadcast Emergency Alert (Admin Root)"}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Live Alert Preview & Recent Broadcasts */}
          <div className="lg:col-span-6 space-y-6">
            {/* Live Preview Box */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Live Alert Preview
                </span>
                <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Real-time Render
                </span>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  severityStyles[broadcastData.severity]?.bg || "bg-slate-50"
                } ${severityStyles[broadcastData.severity]?.border || "border-slate-200"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        severityStyles[broadcastData.severity]?.dot || "bg-rose-600"
                      }`}
                    />
                    <span
                      className={`text-[11px] font-black uppercase tracking-wider ${
                        severityStyles[broadcastData.severity]?.text || "text-rose-600"
                      }`}
                    >
                      {broadcastData.severity} PRIORITY
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    {broadcastData.region || "All Zones"}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  {broadcastData.title || "Emergency Alert Headline Will Appear Here"}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  {broadcastData.message ||
                    "Enter your bulletin text on the left to preview how this alert renders in the top navigation bar, WebSocket popup, and notification drawer."}
                </p>
              </div>
            </div>

            {/* Recent Broadcasts List */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Broadcast History & Active Alerts ({alerts.length})
                </h3>
                <span className="text-xs text-slate-400">Live feed</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto pr-1">
                {alerts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No alerts broadcasted yet.</p>
                ) : (
                  alerts.slice(0, 5).map((a) => (
                    <div key={a.id} className="py-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase border ${
                              severityStyles[a.severity]?.text || "text-slate-600"
                            } ${severityStyles[a.severity]?.bg || "bg-slate-100"} ${
                              severityStyles[a.severity]?.border || "border-slate-200"
                            }`}
                          >
                            {a.severity}
                          </span>
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{a.title}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{a.message}</p>
                        <div className="text-[10px] text-slate-400 mt-1">Zone: {a.region || "National"}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MISSION COMPLETION OVERSIGHT (ADMIN-ONLY)         */}
      {/* ======================================================== */}
      {activeTab === "missions" && (
        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Mission Completion Oversight (Admin Superuser Only)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard commanders cannot finalize deliveries. Only System Administrators have security clearance to mark relief missions as completed.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                {missions.filter((m) => m.status === "completed").length} / {missions.length} Completed
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Depot &rarr; Incident Route</th>
                  <th className="py-3 px-4">Payload Summary</th>
                  <th className="py-3 px-4">Distance / ETA</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {missions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No missions found.
                    </td>
                  </tr>
                ) : (
                  missions.map((m) => {
                    const depot = depots.find((d) => d.id === m.depot_id);
                    const incident = incidents.find((i) => i.id === m.incident_id);
                    const isCompleted = m.status === "completed";

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        {/* Code */}
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200/60">
                            {m.code}
                          </span>
                        </td>

                        {/* Route */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {depot?.name || "Depot"}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-900 dark:text-slate-100 font-bold">
                              {incident?.location || "Disaster Site"}
                            </span>
                          </div>
                        </td>

                        {/* Payload */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {m.resources_summary}
                        </td>

                        {/* Distance */}
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {m.distance_km?.toFixed(1)} km (~{(m.eta_hours || 0).toFixed(1)}h)
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold capitalize border ${
                              isCompleted
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                : m.status === "delivered"
                                ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                                : "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                            }`}
                          >
                            {m.status.replace("_", " ")}
                          </span>
                        </td>

                        {/* Admin Action */}
                        <td className="py-3 px-4 text-right">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Completed
                            </span>
                          ) : (
                            <button
                              onClick={() => completeMissionMutation.mutate(m.id)}
                              disabled={completeMissionMutation.isPending}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Completed</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: USER ACCOUNT GOVERNANCE                          */}
      {/* ======================================================== */}
      {activeTab === "users" && (
        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                User Account & Security Governance
              </h2>
              <p className="text-xs text-slate-500">
                Promote roles, toggle account statuses, or delete unauthorized users
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, email, org..."
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/50 w-48 sm:w-60"
                />
              </div>

              {/* Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="commander">Commander</option>
                <option value="coordinator">Coordinator</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Role Assignment</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No users found matching query
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === user?.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        {/* User Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0"
                              style={{ backgroundColor: config.accentHex }}
                            >
                              {u.full_name?.[0]?.toUpperCase() || u.email[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{u.full_name || "Unnamed Responder"}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Organization */}
                        <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                          {u.organization || "ReliefGrid Command HQ"}
                        </td>

                        {/* Role Selector */}
                        <td className="py-3.5 px-4">
                          <select
                            value={u.role}
                            disabled={isSelf || updateRoleMutation.isPending}
                            onChange={(e) => updateRoleMutation.mutate({ userId: u.id, role: e.target.value })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                              roleColors[u.role] || "bg-slate-100 border-slate-200"
                            } ${isSelf ? "opacity-75 cursor-not-allowed" : "cursor-pointer hover:shadow-sm"}`}
                          >
                            <option value="admin">admin (Full Root)</option>
                            <option value="commander">commander (Tactical)</option>
                            <option value="coordinator">coordinator (Logistics)</option>
                            <option value="viewer">viewer (Read-Only)</option>
                          </select>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            disabled={isSelf || toggleStatusMutation.isPending}
                            onClick={() => toggleStatusMutation.mutate({ userId: u.id, isActive: !u.is_active })}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                              u.is_active
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                            } ${isSelf ? "opacity-75 cursor-not-allowed" : "cursor-pointer hover:brightness-95"}`}
                          >
                            {u.is_active ? (
                              <>
                                <UserCheck className="w-3 h-3" /> Active
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3" /> Suspended
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            disabled={isSelf || deleteUserMutation.isPending}
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to permanently delete account ${u.email}?`)) {
                                deleteUserMutation.mutate(u.id);
                              }
                            }}
                            className={`p-1.5 rounded-lg border text-rose-600 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition ${
                              isSelf ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                            }`}
                            title={isSelf ? "Cannot delete your own admin account" : "Delete User"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: WAREHOUSES & RESOURCES MANAGEMENT */}
      {/* ============================================================ */}
      {activeTab === "warehouses" && (
        <div className="space-y-6">
          {/* Top Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-500" />
                Warehouses
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {depots.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Operational hubs</div>
            </div>

            <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-500" />
                Transport Cap.
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {totalTransportCap.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">kg/units per trip</div>
            </div>

            <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-500" />
                Food Stock
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {resourceTotals.food.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Meal rations</div>
            </div>

            <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                Water Stock
              </div>
              <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                {resourceTotals.water.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Potable Liters</div>
            </div>

            <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-rose-500" />
                Medical Aid
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {resourceTotals.medical.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Trauma & first aid</div>
            </div>

            <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-emerald-500" />
                Shelter Units
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {resourceTotals.shelter.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Tents & bedding</div>
            </div>
          </div>

          {/* Section 1: Warehouses / Depots */}
          <div className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  Relief Warehouses & Regional Hubs
                </h3>
                <p className="text-xs text-slate-500">
                  Manage warehouse facilities, dispatch locations, and trip payload limits.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingDepot(null);
                  setDepotForm({
                    name: "",
                    latitude: 20.5937,
                    longitude: 78.9629,
                    max_transport_per_trip: 5000,
                  });
                  setIsDepotModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition cursor-pointer shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Add Additional Warehouse
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Warehouse Name</th>
                    <th className="py-3 px-4">Coordinates (Lat, Lng)</th>
                    <th className="py-3 px-4">Transport Capacity</th>
                    <th className="py-3 px-4">Stocked Items</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {depots.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No warehouses configured. Click "Add Additional Warehouse" to register one.
                      </td>
                    </tr>
                  ) : (
                    depots.map((d) => {
                      const warehouseResources = resources.filter((r) => r.depot_id === d.id);
                      return (
                        <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-purple-500 shrink-0" />
                              <span>{d.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {d.id}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                            {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {d.max_transport_per_trip.toLocaleString()}
                            </span>{" "}
                            <span className="text-slate-400 text-[10px]">kg/trip</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {warehouseResources.length === 0 ? (
                                <span className="text-slate-400 italic text-[11px]">No stock</span>
                              ) : (
                                warehouseResources.map((r) => (
                                  <span
                                    key={r.id}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize"
                                  >
                                    {r.type}: {r.quantity.toLocaleString()} {r.unit}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingDepot(d);
                                  setDepotForm({
                                    name: d.name,
                                    latitude: d.latitude,
                                    longitude: d.longitude,
                                    max_transport_per_trip: d.max_transport_per_trip,
                                  });
                                  setIsDepotModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                title="Edit Warehouse"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete warehouse "${d.name}" and all its resources?`)) {
                                    deleteDepotMutation.mutate(d.id);
                                  }
                                }}
                                disabled={deleteDepotMutation.isPending}
                                className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition cursor-pointer"
                                title="Delete Warehouse"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Resources & Inventory */}
          <div className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-600" />
                  Resource Stock & Inventory Allocation
                </h3>
                <p className="text-xs text-slate-500">
                  Update inventory levels, units, and supply reserves per warehouse.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <select
                  value={selectedDepotFilter}
                  onChange={(e) => setSelectedDepotFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">All Warehouses ({depots.length})</option>
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setEditingResource(null);
                    setResourceForm({
                      depot_id: depots[0]?.id || "",
                      type: "food",
                      quantity: 1000,
                      unit: "pkts",
                    });
                    setIsResourceModalOpen(true);
                  }}
                  disabled={depots.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Stock Resource
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Warehouse Facility</th>
                    <th className="py-3 px-4">Resource Category</th>
                    <th className="py-3 px-4">Current Stock Level</th>
                    <th className="py-3 px-4">Measurement Unit</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {resources
                    .filter((r) => selectedDepotFilter === "all" || r.depot_id === selectedDepotFilter)
                    .map((r) => {
                      const warehouse = depots.find((d) => d.id === r.depot_id);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                            {warehouse?.name || "Unknown Warehouse"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                                r.type === "food"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                  : r.type === "water"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                  : r.type === "medical"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              }`}
                            >
                              {r.type === "food" && <Utensils className="w-3 h-3" />}
                              {r.type === "water" && <Droplets className="w-3 h-3" />}
                              {r.type === "medical" && <Shield className="w-3 h-3" />}
                              {r.type === "shelter" && <Home className="w-3 h-3" />}
                              {r.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              {r.quantity.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-medium">
                            {r.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingResource(r);
                                  setResourceForm({
                                    depot_id: r.depot_id,
                                    type: r.type,
                                    quantity: r.quantity,
                                    unit: r.unit,
                                  });
                                  setIsResourceModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                title="Adjust Stock"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm("Delete this resource record?")) {
                                    deleteResourceMutation.mutate(r.id);
                                  }
                                }}
                                disabled={deleteResourceMutation.isPending}
                                className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition cursor-pointer"
                                title="Delete Resource"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Modal (Add / Edit) */}
      {isDepotModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-purple-600">
                <Building2 className="w-5 h-5" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingDepot ? `Edit Warehouse (${editingDepot.name})` : "Add Additional Warehouse"}
                </h3>
              </div>
              <button
                onClick={() => setIsDepotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingDepot) {
                  updateDepotMutation.mutate({
                    id: editingDepot.id,
                    payload: depotForm,
                  });
                } else {
                  createDepotMutation.mutate(depotForm);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Warehouse Facility Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kolkata Regional Relief Hub"
                  value={depotForm.name}
                  onChange={(e) => setDepotForm({ ...depotForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={depotForm.latitude}
                    onChange={(e) => setDepotForm({ ...depotForm, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={depotForm.longitude}
                    onChange={(e) => setDepotForm({ ...depotForm, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Quick Preset Coordinates for India Hubs */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500">Quick City Hub Presets:</div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    { name: "Kolkata Hub", lat: 22.5726, lng: 88.3639 },
                    { name: "Chennai Port", lat: 13.0827, lng: 80.2707 },
                    { name: "Delhi Central", lat: 28.6139, lng: 77.2090 },
                    { name: "Mumbai West", lat: 19.0760, lng: 72.8777 },
                    { name: "Bengaluru South", lat: 12.9716, lng: 77.5946 },
                    { name: "Guwahati North", lat: 26.1445, lng: 91.7362 },
                  ].map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() =>
                        setDepotForm({
                          ...depotForm,
                          name: depotForm.name || p.name,
                          latitude: p.lat,
                          longitude: p.lng,
                        })
                      }
                      className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Max Transport Fleet Capacity (kg/units per trip)
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  step="100"
                  value={depotForm.max_transport_per_trip}
                  onChange={(e) =>
                    setDepotForm({ ...depotForm, max_transport_per_trip: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDepotModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDepotMutation.isPending || updateDepotMutation.isPending}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition cursor-pointer disabled:opacity-50"
                >
                  {editingDepot ? "Save Warehouse Changes" : "Create Warehouse Hub"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Modal (Add / Edit) */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600">
                <Package className="w-5 h-5" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingResource ? "Adjust Resource Stock" : "Stock New Resource"}
                </h3>
              </div>
              <button
                onClick={() => setIsResourceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingResource) {
                  updateResourceMutation.mutate({
                    id: editingResource.id,
                    payload: {
                      quantity: resourceForm.quantity,
                      unit: resourceForm.unit,
                    },
                  });
                } else {
                  createResourceMutation.mutate(resourceForm);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Target Warehouse Facility
                </label>
                <select
                  disabled={!!editingResource}
                  value={resourceForm.depot_id}
                  onChange={(e) => setResourceForm({ ...resourceForm, depot_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60"
                >
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Resource Category
                </label>
                <select
                  disabled={!!editingResource}
                  value={resourceForm.type}
                  onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white capitalize disabled:opacity-60"
                >
                  <option value="food">Food Rations</option>
                  <option value="water">Potable Water</option>
                  <option value="medical">Medical First Aid Kits</option>
                  <option value="shelter">Emergency Shelter / Tents</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={resourceForm.quantity}
                    onChange={(e) =>
                      setResourceForm({ ...resourceForm, quantity: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Measurement Unit
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pkts, Liters, kits"
                    value={resourceForm.unit}
                    onChange={(e) => setResourceForm({ ...resourceForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResourceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createResourceMutation.isPending || updateResourceMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50"
                >
                  {editingResource ? "Save Stock Level" : "Add Stock to Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
