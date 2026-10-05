import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ReliefMap from "../components/map/ReliefMap";
import { useTranslation } from "../store/langStore";
import { incidentsApi, type Incident } from "../lib/api";
import { Plus, AlertTriangle, MapPin, X, CheckCircle2 } from "lucide-react";

export default function MapPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
    type: "flood",
    location: "",
    latitude: 20.5937,
    longitude: 78.9629,
    affected_population: 3000,
    priority: "high",
    status: "active",
    description: "",
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Incident>) => incidentsApi.create(payload),
    onSuccess: (newInc) => {
      // Invalidate both map and incident queries so it shows up immediately everywhere
      queryClient.invalidateQueries({ queryKey: ["map-markers"] });
      queryClient.invalidateQueries({ queryKey: ["map-heatmap"] });
      queryClient.invalidateQueries({ queryKey: ["incidents-all"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-health"] });

      setIsModalOpen(false);
      setSuccessToast(`Incident "${newInc.code} — ${newInc.location}" reported and placed on Relief Map!`);
      setTimeout(() => setSuccessToast(null), 5000);

      // Reset form
      setFormData({
        code: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
        type: "flood",
        location: "",
        latitude: 20.5937,
        longitude: 78.9629,
        affected_population: 3000,
        priority: "high",
        status: "active",
        description: "",
      });
    },
  });

  const handleReportIncidentAt = (coords: { lat: number; lng: number }) => {
    setFormData((prev) => ({
      ...prev,
      latitude: coords.lat,
      longitude: coords.lng,
      location: prev.location || `Coordinates (${coords.lat}, ${coords.lng})`,
    }));
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("map.title")}</h1>
          <p className="text-sm text-slate-500">
            {t("map.subtitle")} — Click anywhere on the map to pin & report an incident.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Report Incident</span>
        </button>
      </div>

      {successToast && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <ReliefMap onReportIncidentAt={handleReportIncidentAt} />

      {/* Incident Reporting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-lg font-bold text-slate-900">
                  Report Disaster Incident
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Incident Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Disaster Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm capitalize"
                  >
                    <option value="flood">Flood</option>
                    <option value="earthquake">Earthquake</option>
                    <option value="cyclone">Cyclone</option>
                    <option value="landslide">Landslide</option>
                    <option value="wildfire">Wildfire</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Location / Landmark
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wayanad Sector 4 or Marina Beach"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                      setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
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
                      setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Quick region presets */}
              <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500">Quick Location Presets:</div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    { name: "Kerala (Wayanad)", lat: 11.6854, lng: 76.1320 },
                    { name: "Odisha (Puri)", lat: 19.8135, lng: 85.8312 },
                    { name: "Tamil Nadu (Chennai)", lat: 13.0827, lng: 80.2707 },
                    { name: "Maharashtra (Mumbai)", lat: 19.0760, lng: 72.8777 },
                    { name: "Assam (Guwahati)", lat: 26.1445, lng: 91.7362 },
                    { name: "Uttarakhand (Joshimath)", lat: 30.5564, lng: 79.5663 },
                  ].map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          location: p.name,
                          latitude: p.lat,
                          longitude: p.lng,
                        })
                      }
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition text-[11px]"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Affected Population
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.affected_population}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        affected_population: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm capitalize"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? "Reporting..." : "Submit & Plot to Map"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}