import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck, ExternalLink, Sparkles } from "lucide-react";
import { alertsApi, type Alert } from "../lib/api";
import { useThemeStore } from "../store/themeStore";

const severityColors: Record<string, { bg: string; text: string; dot: string }> = {
  critical: { bg: "bg-red-50 text-red-700 border-red-200", text: "text-red-600", dot: "bg-red-500" },
  severe:   { bg: "bg-orange-50 text-orange-700 border-orange-200", text: "text-orange-600", dot: "bg-orange-500" },
  warning:  { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "text-amber-600", dot: "bg-amber-500" },
  info:     { bg: "bg-blue-50 text-blue-700 border-blue-200", text: "text-blue-600", dot: "bg-blue-500" },
};

export default function NotificationDropdown() {
  const { theme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [readAlertIds, setReadAlertIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("reliefgrid_read_alerts") || "[]");
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const alertsQ = useQuery({
    queryKey: ["header-notifications"],
    queryFn: () => alertsApi.list(15),
    refetchInterval: 15000,
  });

  const alerts: Alert[] = alertsQ.data ?? [];
  const unreadAlerts = alerts.filter((a) => !readAlertIds.includes(a.id));
  const unreadCount = unreadAlerts.length;

  const markAllAsRead = () => {
    const allIds = alerts.map((a) => a.id);
    setReadAlertIds(allIds);
    localStorage.setItem("reliefgrid_read_alerts", JSON.stringify(allIds));
  };

  const markSingleAsRead = (id: string) => {
    if (!readAlertIds.includes(id)) {
      const updated = [...readAlertIds, id];
      setReadAlertIds(updated);
      localStorage.setItem("reliefgrid_read_alerts", JSON.stringify(updated));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition-all ${
          theme === "dark"
            ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        } ${isOpen ? "ring-2 ring-rose-500/20" : ""}`}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
            theme === "dark"
              ? "bg-slate-900 border-slate-700 text-slate-100"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between ${
            theme === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-slate-50/70"
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Disaster Notifications</span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700">
                  {unreadCount} new
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                  All caught up
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* Alert List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active notifications at this time.
              </div>
            ) : (
              alerts.map((alert) => {
                const isUnread = !readAlertIds.includes(alert.id);
                const sev = severityColors[alert.severity] || severityColors.info;
                const isAiAlert = alert.title.startsWith("AI") || alert.message.includes("AI prediction");

                return (
                  <Link
                    key={alert.id}
                    to="/alerts"
                    onClick={() => {
                      markSingleAsRead(alert.id);
                      setIsOpen(false);
                    }}
                    className={`block p-3.5 transition-colors ${
                      isUnread
                        ? theme === "dark"
                          ? "bg-slate-800/60 hover:bg-slate-800"
                          : "bg-rose-50/30 hover:bg-rose-50/60"
                        : theme === "dark"
                        ? "hover:bg-slate-800/40"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sev.dot} ${isUnread ? "ring-2 ring-red-400/30" : "opacity-40"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`font-semibold text-xs truncate ${isUnread ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                              {alert.title}
                            </span>
                            {isAiAlert && (
                              <Sparkles className="w-3 h-3 text-rose-500 flex-shrink-0" />
                            )}
                          </div>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${sev.bg}`}>
                            {alert.severity}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {alert.message}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                          <span className="font-medium text-slate-500">{alert.region}</span>
                          <span>•</span>
                          <span>{alert.created_at ? new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className={`p-2.5 px-4 border-t text-center ${
            theme === "dark" ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-slate-50/60"
          }`}>
            <Link
              to="/alerts"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1.5 transition"
            >
              <span>View All Alerts Feed</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
