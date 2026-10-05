import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search, X, LayoutDashboard, Brain, AlertTriangle, Package,
  Truck, ShieldAlert, BarChart3, Map, Settings, Users,
  ArrowRight, Flame
} from "lucide-react";
import { incidentsApi, volunteersApi, alertsApi } from "../lib/api";
import { useThemeStore } from "../store/themeStore";
import { useTranslation } from "../store/langStore";

interface HeaderSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Navigation" | "Incident" | "Volunteer" | "Alert";
  url: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

export default function HeaderSearchModal({ isOpen, onClose }: HeaderSearchModalProps) {
  const navigate = useNavigate();
  const { theme, config } = useThemeStore();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Queries for live data search
  const incidentsQ = useQuery({
    queryKey: ["search-incidents"],
    queryFn: () => incidentsApi.list(20),
    enabled: isOpen,
  });

  const volunteersQ = useQuery({
    queryKey: ["search-volunteers"],
    queryFn: () => volunteersApi.list(),
    enabled: isOpen,
  });

  const alertsQ = useQuery({
    queryKey: ["search-alerts"],
    queryFn: () => alertsApi.list(20),
    enabled: isOpen,
  });

  // Base navigation pages
  const navPages: SearchItem[] = [
    {
      id: "nav-dash",
      title: t("nav.dashboard"),
      subtitle: "Overview of active incidents, resources, and live sitrep",
      category: "Navigation",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "nav-vol",
      title: t("nav.volunteers"),
      subtitle: "Deploy, induct, and manage certified rescue volunteers",
      category: "Navigation",
      url: "/volunteers",
      icon: Users,
      badge: "Active",
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    {
      id: "nav-pred",
      title: t("nav.predictor"),
      subtitle: "ML Demand Ensemble & automated warehouse recommendation",
      category: "Navigation",
      url: "/predict",
      icon: Brain,
      badge: "AI Active",
      badgeColor: "bg-rose-100 text-rose-700",
    },
    {
      id: "nav-alerts",
      title: t("nav.alerts"),
      subtitle: "Real-time emergency warning broadcasts and feeds",
      category: "Navigation",
      url: "/alerts",
      icon: ShieldAlert,
    },
    {
      id: "nav-incidents",
      title: t("nav.incidents"),
      subtitle: "Incident monitoring, reporting, and priority triage",
      category: "Navigation",
      url: "/incidents",
      icon: AlertTriangle,
    },
    {
      id: "nav-resources",
      title: t("nav.resources"),
      subtitle: "Supply stockpiles, warehouse capacities, and depot status",
      category: "Navigation",
      url: "/resources",
      icon: Package,
    },
    {
      id: "nav-missions",
      title: t("nav.missions"),
      subtitle: "Automated convoy routing and dispatch manifests",
      category: "Navigation",
      url: "/missions",
      icon: Truck,
    },
    {
      id: "nav-analytics",
      title: t("nav.analytics"),
      subtitle: "Command intelligence, prediction history, and audit logs",
      category: "Navigation",
      url: "/analytics",
      icon: BarChart3,
    },
    {
      id: "nav-map",
      title: t("nav.map"),
      subtitle: "Interactive geospatial mapping of incidents and depots",
      category: "Navigation",
      url: "/map",
      icon: Map,
    },
    {
      id: "nav-settings",
      title: t("nav.settings"),
      subtitle: "Color themes, multilingual options, and system settings",
      category: "Navigation",
      url: "/settings",
      icon: Settings,
    },
  ];

  // Dynamic Incident Items
  const incidentItems: SearchItem[] = (incidentsQ.data ?? []).map((inc) => ({
    id: `inc-${inc.id}`,
    title: `${inc.code} - ${inc.location}`,
    subtitle: `Type: ${inc.type.toUpperCase()} • Priority: ${inc.priority.toUpperCase()} • Population: ${(inc.affected_population || 0).toLocaleString()}`,
    category: "Incident",
    url: "/incidents",
    icon: Flame,
    badge: inc.status,
    badgeColor: inc.status === "active" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700",
  }));

  // Dynamic Volunteer Items
  const volunteerItems: SearchItem[] = (volunteersQ.data ?? []).map((vol) => ({
    id: `vol-${vol.id}`,
    title: vol.name,
    subtitle: `Region: ${vol.region} • Skills: ${vol.skills} • Badge: ${vol.badge_level}`,
    category: "Volunteer",
    url: "/volunteers",
    icon: Users,
    badge: vol.status,
    badgeColor: vol.status === "available" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
  }));

  // Dynamic Alert Items
  const alertItems: SearchItem[] = (alertsQ.data ?? []).slice(0, 10).map((alt) => ({
    id: `alt-${alt.id}`,
    title: alt.title,
    subtitle: alt.message,
    category: "Alert",
    url: "/alerts",
    icon: ShieldAlert,
    badge: alt.severity,
    badgeColor: alt.severity === "critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700",
  }));

  // Combine and Filter
  const allItems = [...navPages, ...incidentItems, ...volunteerItems, ...alertItems];

  const filteredItems = query.trim() === ""
    ? navPages
    : allItems.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setQuery("");
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        handleSelect(filteredItems[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  const handleSelect = (item: SearchItem) => {
    navigate(item.url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[80vh] transition-all ${
          theme === "dark"
            ? "bg-slate-900 border-slate-700 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className={`p-4 border-b flex items-center gap-3 ${
          theme === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-slate-50/50"
        }`}>
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={t("header.search_modal_placeholder", "Search operations, incidents, rescue volunteers, alerts...")}
            className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-slate-400"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-slate-200 text-slate-400 bg-white/50">
              ESC
            </span>
          )}
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No matching operations or records found for <span className="font-semibold text-slate-600 dark:text-slate-200">"{query}"</span>.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? theme === "dark"
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-900"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="p-2 rounded-xl flex-shrink-0"
                      style={isSelected ? { backgroundColor: config.accentHex, color: "#fff" } : { backgroundColor: `${config.accentHex}15`, color: config.accentHex }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{item.title}</span>
                        {item.badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.badgeColor || "bg-slate-100 text-slate-600"}`}>
                            {item.badge}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-400 border border-slate-200/60 dark:border-slate-700 px-1.5 py-0.2 rounded">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isSelected ? "translate-x-1 text-slate-900 dark:text-white" : "opacity-0"}`} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className={`p-2.5 px-4 border-t text-[11px] text-slate-400 flex items-center justify-between ${
          theme === "dark" ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-slate-50/50"
        }`}>
          <div className="flex items-center gap-3">
            <span>Use <kbd className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-[10px]">↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-[10px]">ENTER</kbd> to select</span>
          </div>
          <span className="font-semibold text-slate-500">ReliefGrid Search</span>
        </div>
      </div>
    </div>
  );
}
