import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Package, Building2, Droplets, Utensils, Shield,
  Home, Truck, Loader2, MapPin
} from "lucide-react";
import { depotsApi, resourcesApi } from "../lib/api";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import { useTranslation } from "../store/langStore";

const resourceIcons: Record<string, any> = {
  food: Utensils,
  water: Droplets,
  medical: Shield,
  shelter: Home,
};

const resourceColors: Record<string, string> = {
  food: "text-amber-600 bg-amber-50 border-amber-200",
  water: "text-blue-600 bg-blue-50 border-blue-200",
  medical: "text-red-600 bg-red-50 border-red-200",
  shelter: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

export default function Resources() {
  const { t } = useTranslation();
  const [selectedDepot, setSelectedDepot] = useState<string>("all");

  const depotsQ = useQuery({
    queryKey: ["depots-all"],
    queryFn: depotsApi.list,
  });

  const resourcesQ = useQuery({
    queryKey: ["resources", selectedDepot],
    queryFn: () => resourcesApi.list(selectedDepot === "all" ? undefined : selectedDepot),
  });

  const depots = depotsQ.data ?? [];
  const resources = resourcesQ.data ?? [];

  // Calculate resource totals across current view
  const totals = resources.reduce(
    (acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + r.quantity;
      return acc;
    },
    { food: 0, water: 0, medical: 0, shelter: 0 } as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("res.title")}</h1>
          <p className="text-sm text-slate-500">
            {t("res.subtitle")}
          </p>
        </div>

        {/* Depot Filter Selector */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDepot}
            onChange={(e) => setSelectedDepot(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm"
          >
            <option value="all">{t("All Depots")} ({depots.length})</option>
            {depots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resource Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Food Ration Units"
          value={totals.food.toLocaleString()}
          icon={Utensils}
          color="amber"
          subtitle="Packaged meals & rations"
        />
        <StatCard
          label="Potable Water (L)"
          value={totals.water.toLocaleString()}
          icon={Droplets}
          color="blue"
          subtitle="Clean drinking water"
        />
        <StatCard
          label="Medical Kits"
          value={totals.medical.toLocaleString()}
          icon={Shield}
          color="red"
          subtitle="First-aid & trauma kits"
        />
        <StatCard
          label="Temporary Shelters"
          value={totals.shelter.toLocaleString()}
          icon={Home}
          color="green"
          subtitle="Emergency tents & tarps"
        />
      </div>

      {/* Depots Inventory Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Depots List */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-brand-600" />
            <h2 className="font-semibold text-slate-900">{t("Relief Depots")}</h2>
          </div>

          {depotsQ.isLoading ? (
            <div className="text-center py-8 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              {t("common.loading", "Loading depots...")}
            </div>
          ) : (
            <div className="space-y-3">
              {depots.map((depot) => (
                <div
                  key={depot.id}
                  onClick={() => setSelectedDepot(depot.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    selectedDepot === depot.id
                      ? "border-brand-500 bg-brand-50/50 shadow-sm"
                      : "border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{depot.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {depot.latitude.toFixed(2)}°N, {depot.longitude.toFixed(2)}°E
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                      <Truck className="w-3 h-3 text-slate-500" />
                      <span>{depot.max_transport_per_trip} kg/trip</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resources Breakdown Table */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-600" />
              <h2 className="font-semibold text-slate-900">{t("table.details", "Stockpile Details")}</h2>
            </div>
            <span className="text-xs text-slate-500">
              {resources.length} {t("items")}
            </span>
          </div>

          {resourcesQ.isLoading ? (
            <div className="text-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              {t("common.loading", "Loading resource inventory...")}
            </div>
          ) : (
            <DataTable
              keyField="id"
              data={resources}
              emptyMessage={t("No resource records found for this depot")}
              columns={[
                {
                  key: "type",
                  header: t("table.type", "Resource Type"),
                  render: (r) => {
                    const Icon = resourceIcons[r.type] || Package;
                    return (
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-2 rounded-lg border ${
                            resourceColors[r.type] || "bg-slate-100"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="capitalize font-semibold text-slate-900">
                          {t(r.type)}
                        </span>
                      </div>
                    );
                  },
                },
                {
                  key: "depot",
                  header: "Depot Location",
                  render: (r) => {
                    const depot = depots.find((d) => d.id === r.depot_id);
                    return (
                      <span className="text-sm text-slate-600 font-medium">
                        {depot?.name || "Global Supply Depot"}
                      </span>
                    );
                  },
                },
                {
                  key: "quantity",
                  header: "Available Quantity",
                  render: (r) => (
                    <span className="font-bold text-slate-900">
                      {r.quantity.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        {r.unit || "units"}
                      </span>
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Stock Level",
                  render: (r) => {
                    const pct = Math.min(100, Math.round((r.quantity / 50000) * 100));
                    return (
                      <div className="w-36">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>{pct}% stock</span>
                          <span>{r.quantity > 5000 ? "Sufficient" : "Low"}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              r.quantity > 10000
                                ? "bg-emerald-500"
                                : r.quantity > 2000
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.max(5, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  },
                },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
