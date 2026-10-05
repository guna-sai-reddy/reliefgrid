import { useState } from "react";
import { Bell, Wifi, Palette, Globe, Check } from "lucide-react";
import { useThemeStore, THEMES, type ThemeType } from "../store/themeStore";
import { useTranslation } from "../store/langStore";
import { LANGUAGES, type SupportedLang } from "../lib/i18n";

export default function Settings() {
  const { theme, setTheme } = useThemeStore();
  const { lang, setLang, t } = useTranslation();

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [wsLiveFeed, setWsLiveFeed] = useState(true);
  const [criticalAlertsOnly, setCriticalAlertsOnly] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("set.title")}</h1>
        <p className="text-sm text-slate-500">
          Configure real-time disaster monitoring, color themes, multilingual support, and operations preferences
        </p>
      </div>

      {/* Settings Groups */}
      <div className="space-y-6">
        {/* Color Theme Options */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Palette className="w-5 h-5 text-purple-600" />
            <div>
              <h2 className="font-semibold text-slate-900 text-base">{t("set.theme_title")}</h2>
              <p className="text-xs text-slate-500">{t("set.theme_desc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {THEMES.map((th) => {
              const isSelected = theme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id as ThemeType)}
                  className={`p-4 rounded-xl border text-left flex items-start justify-between transition-all ${
                    isSelected
                      ? "border-slate-900 ring-2 ring-slate-900/10 shadow-sm bg-white"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full shadow-xs"
                        style={{ backgroundColor: th.accentHex }}
                      />
                      <span className="font-semibold text-xs text-slate-900">{th.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {th.id === "dark" ? "Night operational mode" : "Day high-contrast theme"}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Multilingual Options */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Globe className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="font-semibold text-slate-900 text-base">{t("set.lang_title")}</h2>
              <p className="text-xs text-slate-500">{t("set.lang_desc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {LANGUAGES.map((l) => {
              const isSelected = lang === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as SupportedLang)}
                  className={`p-4 rounded-xl border text-left flex items-start justify-between transition-all ${
                    isSelected
                      ? "border-blue-600 ring-2 ring-blue-600/10 shadow-sm bg-white"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{l.flag}</span>
                      <span className="font-bold text-xs text-slate-900">{l.nativeName}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{l.name}</div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time Monitoring */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Wifi className="w-5 h-5 text-brand-600" />
            <h2 className="font-semibold text-slate-900 text-base">Real-Time Data Streams</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900 text-sm">
                  Live WebSocket Map Stream
                </div>
                <div className="text-xs text-slate-500">
                  Receive live location & priority updates for convoys, rescue teams, and incidents
                </div>
              </div>
              <button
                onClick={() => setWsLiveFeed(!wsLiveFeed)}
                className={`w-12 h-6 rounded-full transition-colors p-1 ${
                  wsLiveFeed ? "bg-slate-900" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    wsLiveFeed ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <div className="font-medium text-slate-900 text-sm">
                  Auto-Sync Query Engine
                </div>
                <div className="text-xs text-slate-500">
                  Refetches backend summary metrics every 15 seconds
                </div>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`w-12 h-6 rounded-full transition-colors p-1 ${
                  autoRefresh ? "bg-slate-900" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    autoRefresh ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Alerts Configuration */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Bell className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-slate-900 text-base">Emergency Notifications</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900 text-sm">
                Critical Severity Filtering
              </div>
              <div className="text-xs text-slate-500">
                Only show high priority and critical emergency alert notifications
              </div>
            </div>
            <button
              onClick={() => setCriticalAlertsOnly(!criticalAlertsOnly)}
              className={`w-12 h-6 rounded-full transition-colors p-1 ${
                criticalAlertsOnly ? "bg-amber-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  criticalAlertsOnly ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
