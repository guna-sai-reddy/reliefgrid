import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain, Sparkles, Download, Truck, Package, Droplets,
  Shield, Home, Loader2, Sliders
} from "lucide-react";
import { predictionsApi } from "../lib/api";
import { exportPredictionPDF } from "../lib/pdfExport";
import { useTranslation } from "../store/langStore";

export default function Predictor() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Form State
  const [zoneName, setZoneName] = useState("Wayanad Sector 4 (New Disaster Alert)");
  const [magnitude, setMagnitude] = useState(6.8);
  const [depth, setDepth] = useState(12);
  const [popDensity, setPopDensity] = useState(9500);
  const [vulnerabilityIndex, setVulnerabilityIndex] = useState(0.72);
  const [childrenPct, setChildrenPct] = useState(28);
  const [eldersPct, setEldersPct] = useState(14);
  const [disabilityPct, setDisabilityPct] = useState(3.5);

  // Prediction Result State
  const [result, setResult] = useState<any>({
    zone_name: "Wayanad Sector 4 (New Disaster Alert)",
    priority: "CRITICAL",
    recommended_warehouse: "Chennai South Depot (Hub Alpha)",
    route_distance_km: 210,
    dispatch_eta_hours: 2.8,
    report_id: "Report #a6a9f3d3-0fba-4961-8437-108f6ca32e9e",
    created_at: new Date().toLocaleString(),
    food: { point: 13420, ci_lower: 8200, ci_upper: 13420, vuln_factor: 1.07 },
    water: { point: 28500, ci_lower: 17400, ci_upper: 28500, vuln_factor: 1.064 },
    medical: { point: 980, ci_lower: 540, ci_upper: 1250, vuln_factor: 1.25 },
    shelter: { point: 18400, ci_lower: 12800, ci_upper: 22600, vuln_factor: 1.05 },
  });

  const predictMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        zone_name: zoneName,
        features: {
          magnitude,
          depth,
          weather_score: 0.5,
          population_density: popDensity,
          accessibility_score: 0.7,
          vulnerability_score: vulnerabilityIndex,
          seismic_risk_score: 0.8,
          exposure_score: 0.75,
          resilience_score: 0.4,
          children_pct: childrenPct,
          elder_pct: eldersPct,
          disability_pct: disabilityPct,
        },
      };
      return await predictionsApi.predict(zoneName, payload.features);
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["prediction-history"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    predictMutation.mutate();
  };

  const handleExportPDF = () => {
    if (!result) return;
    exportPredictionPDF({
      zone_name: result.zone_name || zoneName,
      priority: result.priority || "CRITICAL",
      report_id: result.report_id,
      created_at: result.created_at,
      recommended_warehouse: result.recommended_warehouse || "Chennai South Depot (Hub Alpha)",
      route_distance_km: result.route_distance_km || 210,
      dispatch_eta_hours: result.dispatch_eta_hours || 2.8,
      food: result.food,
      water: result.water,
      medical: result.medical,
      shelter: result.shelter,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <Brain className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("pred.title")}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t("pred.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold self-start md:self-center">
          <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          <span>{t("pred.active_badge")}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form (5 columns) */}
        <div className="lg:col-span-5 glass-card p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 text-base mb-4 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-rose-500" />
            <h2>Disaster Input Parameters</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* Disaster Zone Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Disaster Zone Name
              </label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g. Wayanad Sector 4 (New Disaster Alert)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition text-sm font-medium"
                required
              />
            </div>

            {/* Magnitude & Depth */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Magnitude (Richter)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={magnitude}
                  onChange={(e) => setMagnitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Depth (km)
                </label>
                <input
                  type="number"
                  value={depth}
                  onChange={(e) => setDepth(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            {/* Pop Density & Vulnerability Index */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pop. Density (/km²)
                </label>
                <input
                  type="number"
                  value={popDensity}
                  onChange={(e) => setPopDensity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vulnerability Index (0-1)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={vulnerabilityIndex}
                  onChange={(e) => setVulnerabilityIndex(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            {/* Vulnerable Demographics */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Vulnerable Demographics (%)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Children %</span>
                  <input
                    type="number"
                    step="0.1"
                    value={childrenPct}
                    onChange={(e) => setChildrenPct(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium text-center"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Elders %</span>
                  <input
                    type="number"
                    step="0.1"
                    value={eldersPct}
                    onChange={(e) => setEldersPct(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium text-center"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Disability %</span>
                  <input
                    type="number"
                    step="0.1"
                    value={disabilityPct}
                    onChange={(e) => setDisabilityPct(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium text-center"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={predictMutation.isPending}
              className="w-full mt-4 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition shadow-md shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {predictMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Models...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Predict Demand & Warehouse</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Results Section (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Warehouse Recommendation Card */}
          <div className="glass-card p-6 border-l-4 border-l-rose-500 bg-white/90 shadow-sm relative">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recommended Supply Warehouse
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-md font-bold text-xs">
                  PRIORITY: {result?.priority || "CRITICAL"}
                </span>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-3">
              {result?.recommended_warehouse || "Chennai South Depot (Hub Alpha)"}
            </h3>

            {/* Metadata Pills */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                Route Distance: <strong className="text-slate-900">{result?.route_distance_km ?? 210} km</strong>
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                Dispatch ETA: <strong className="text-emerald-800">{result?.dispatch_eta_hours ?? 2.8} hours</strong>
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                Zone: <span className="text-slate-900">{result?.zone_name || zoneName}</span>
              </span>
            </div>
          </div>

          {/* 4 Resource Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Food Relief Needed */}
            <div className="glass-card p-5 border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Food Relief Needed
                </span>
                <Package className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {Math.round(result?.food?.point ?? 13420).toLocaleString()}{" "}
                <span className="text-sm font-semibold text-slate-500">Pks</span>
              </div>
              <div className="text-xs text-slate-500 mt-2 font-medium">
                Confidence Interval: [
                <span className="text-slate-800 font-semibold">
                  {Math.round(result?.food?.ci_lower ?? 8200).toLocaleString()}
                </span>
                ,{" "}
                <span className="text-slate-800 font-semibold">
                  {Math.round(result?.food?.ci_upper ?? 13420).toLocaleString()}
                </span>
                ]
              </div>
              <div className="mt-3 inline-block px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] font-semibold rounded-lg border border-amber-200">
                Vulnerability Multiplier: ×{result?.food?.vuln_factor ?? 1.07}
              </div>
            </div>

            {/* 2. Clean Water Needed */}
            <div className="glass-card p-5 border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Clean Water Needed
                </span>
                <Droplets className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {Math.round(result?.water?.point ?? 28500).toLocaleString()}{" "}
                <span className="text-sm font-semibold text-slate-500">Liters</span>
              </div>
              <div className="text-xs text-slate-500 mt-2 font-medium">
                Confidence Interval: [
                <span className="text-slate-800 font-semibold">
                  {Math.round(result?.water?.ci_lower ?? 17400).toLocaleString()}
                </span>
                ,{" "}
                <span className="text-slate-800 font-semibold">
                  {Math.round(result?.water?.ci_upper ?? 28500).toLocaleString()}
                </span>
                ]
              </div>
              <div className="mt-3 inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-lg border border-blue-200">
                Vulnerability Multiplier: ×{result?.water?.vuln_factor ?? 1.064}
              </div>
            </div>

            {/* 3. Medical Kits Needed */}
            <div className="glass-card p-5 border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Medical Kits Needed
                </span>
                <Shield className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {Math.round(result?.medical?.point ?? 980).toLocaleString()}{" "}
                <span className="text-sm font-semibold text-slate-500">Kits</span>
              </div>
              <div className="text-xs text-slate-500 mt-2 font-medium">
                Confidence Interval: [
                <span className="text-slate-800 font-semibold">
                  {Math.round(result?.medical?.ci_lower ?? 540).toLocaleString()}
                </span>
                ,{" "}
                <span className="text-slate-800 font-semibold">
                  {Math.round(result?.medical?.ci_upper ?? 1250).toLocaleString()}
                </span>
                ]
              </div>
            </div>

            {/* 4. Shelter Tents Needed */}
            <div className="glass-card p-5 border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Shelter Tents Needed
                </span>
                <Home className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {Math.round(result?.shelter?.point ?? 18400).toLocaleString()}{" "}
                <span className="text-sm font-semibold text-slate-500">Units</span>
              </div>
              <div className="text-xs text-slate-500 mt-2 font-medium">
                Confidence Interval: [
                <span className="text-slate-800 font-semibold">
                  {Math.round(result?.shelter?.ci_lower ?? 12800).toLocaleString()}
                </span>
                ,{" "}
                <span className="text-slate-800 font-semibold">
                  {Math.round(result?.shelter?.ci_upper ?? 22600).toLocaleString()}
                </span>
                ]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
