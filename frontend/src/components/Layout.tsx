import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Brain, Map, AlertTriangle, Package,
  Users, Bell, BarChart3, User, Settings, LogOut, Shield, ShieldCheck,
  HelpCircle, BookOpen, HeartHandshake, Palette, Globe,
  ChevronDown, Search
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../lib/api";
import UserGuideModal from "./UserGuideModal";
import HeaderSearchModal from "./HeaderSearchModal";
import NotificationDropdown from "./NotificationDropdown";
import { useThemeStore, THEMES, type ThemeType } from "../store/themeStore";
import { useTranslation } from "../store/langStore";
import { LANGUAGES, type SupportedLang } from "../lib/i18n";

export default function Layout() {
  const { user, setUser, logout } = useAuthStore();
  const { theme, setTheme, config } = useThemeStore();
  const { lang, setLang, t } = useTranslation();
  const navigate = useNavigate();

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    // Apply data-theme attribute on root element
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    const publicPaths = ["/login", "/register", "/"];
    if (publicPaths.includes(window.location.pathname)) return;

    if (!user) {
      authApi.me()
        .then(setUser)
        .catch(() => {
          logout();
        });
    }
  }, [user, setUser, logout]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const displayName = user?.full_name || "Yaparla Bhargavi";
  const displayRole = user?.role || "Viewer";
  const initial = displayName[0]?.toUpperCase() || "Y";

  const navItems = [
    { to: "/dashboard",  icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: "/predict",    icon: Brain,           label: t("nav.predictor"), badge: "AI" },
    { to: "/map",        icon: Map,             label: t("nav.map") },
    { to: "/incidents",  icon: AlertTriangle,   label: t("nav.incidents") },
    { to: "/resources",  icon: Package,         label: t("nav.resources") },
    { to: "/missions",   icon: Users,           label: t("nav.missions") },
    { to: "/alerts",     icon: Bell,            label: t("nav.alerts") },
    { to: "/volunteers", icon: HeartHandshake,  label: t("nav.volunteers"), badge: "NEW" },
    { to: "/analytics",  icon: BarChart3,       label: t("nav.analytics") },
  ];

  const accountItems = [
    { to: "/profile",  icon: User,     label: t("nav.profile") },
    { to: "/settings", icon: Settings, label: t("nav.settings") },
  ];

  return (
    <div className={`min-h-screen flex ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50/50 text-slate-900"}`}>
      {/* Sidebar */}
      <aside className={`w-64 glass border-r ${theme === "dark" ? "bg-slate-900/90 border-slate-800 text-slate-100" : "border-white/30 bg-white/70"} flex flex-col fixed h-full z-30`}>
        <div className={`p-5 border-b ${theme === "dark" ? "border-slate-800" : "border-slate-200/50"}`}>
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-colors"
              style={{ backgroundColor: config.accentHex }}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className={`font-extrabold text-xl tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              ReliefGrid
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            {t("nav.operations")}
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "text-white shadow-lg"
                    : theme === "dark"
                    ? "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
                }`
              }
              style={({ isActive }) =>
                isActive ? { backgroundColor: config.accentHex, boxShadow: `0 10px 15px -3px ${config.accentHex}40` } : {}
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-white/20 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          {user?.role === "admin" && (
            <>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-6">
                {t("nav.administration")}
              </div>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "text-white shadow-lg"
                      : theme === "dark"
                      ? "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { backgroundColor: config.accentHex, boxShadow: `0 10px 15px -3px ${config.accentHex}40` } : {}
                }
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  <span>{t("nav.admin")}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  ROOT
                </span>
              </NavLink>
            </>
          )}

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-6">
            {t("nav.account")}
          </div>
          {accountItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "text-white shadow-lg"
                    : theme === "dark"
                    ? "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
                }`
              }
              style={({ isActive }) =>
                isActive ? { backgroundColor: config.accentHex, boxShadow: `0 10px 15px -3px ${config.accentHex}40` } : {}
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Sidebar Buttons */}
        <div className={`p-4 space-y-2 border-t ${theme === "dark" ? "border-slate-800 bg-slate-900/60" : "border-slate-200/50 bg-white/40"}`}>
          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100/80 w-full transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>{t("nav.guide")}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 w-full transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t("nav.logout")}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64 min-w-0">
        <header className={`border-b sticky top-0 z-40 backdrop-blur-md transition-colors ${
          theme === "dark"
            ? "bg-slate-900/80 border-slate-800"
            : "bg-white/80 border-slate-200/60"
        }`}>
          <div className="px-8 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className={`font-bold text-lg leading-tight truncate ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                {t("dash.title")}
              </h2>
              <p className="text-xs font-medium text-slate-500 truncate hidden xl:block">
                {t("dash.subtitle")}
              </p>
            </div>

            {/* Global Searchbar in Header */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs font-medium w-48 sm:w-64 md:w-80 transition-all cursor-pointer ${
                theme === "dark"
                  ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white shadow-2xs"
              }`}
              title={t("header.quick_search", "Quick Search (Ctrl+K)")}
            >
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="flex-1 text-left truncate">{t("header.search_placeholder", "Search operations, responders...")}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400">
                ⌘K
              </kbd>
            </button>

            <div className="flex items-center gap-2.5">
              {/* Emergency Notification Option */}
              <NotificationDropdown />

              {/* Multilingual Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsLangOpen(!isLangOpen);
                    setIsThemeOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                    theme === "dark"
                      ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span>{LANGUAGES.find((l) => l.code === lang)?.flag}</span>
                  <span className="hidden md:inline">{LANGUAGES.find((l) => l.code === lang)?.nativeName}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isLangOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border p-1 z-50 animate-in fade-in slide-in-from-top-1 ${
                    theme === "dark"
                      ? "bg-slate-900 border-slate-800 text-slate-200"
                      : "bg-white border-slate-200 text-slate-800"
                  }`}>
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {t("nav.language")}
                    </div>
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLang(l.code as SupportedLang);
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                          lang === l.code
                            ? "bg-blue-50 text-blue-700 font-bold"
                            : theme === "dark"
                            ? "hover:bg-slate-800 text-slate-300"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{l.flag}</span>
                          <span>{l.nativeName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase">{l.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsThemeOpen(!isThemeOpen);
                    setIsLangOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                    theme === "dark"
                      ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-purple-500" />
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: config.accentHex }}
                  />
                  <span className="hidden md:inline">{config.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isThemeOpen && (
                  <div className={`absolute right-0 mt-2 w-52 rounded-xl shadow-xl border p-1 z-50 animate-in fade-in slide-in-from-top-1 ${
                    theme === "dark"
                      ? "bg-slate-900 border-slate-800 text-slate-200"
                      : "bg-white border-slate-200 text-slate-800"
                  }`}>
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {t("nav.theme")}
                    </div>
                    {THEMES.map((th) => (
                      <button
                        key={th.id}
                        onClick={() => {
                          setTheme(th.id as ThemeType);
                          setIsThemeOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                          theme === th.id
                            ? "bg-slate-100 font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
                            : theme === "dark"
                            ? "hover:bg-slate-800 text-slate-300"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: th.accentHex }}
                          />
                          <span>{th.name}</span>
                        </div>
                        {theme === th.id && (
                          <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User Guide Pill Button */}
              <button
                onClick={() => setIsGuideOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t("nav.guide")}</span>
              </button>

              {/* User Badge */}
              <div className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-full border ${
                theme === "dark"
                  ? "bg-slate-800/80 border-slate-700"
                  : "bg-slate-100/80 border-slate-200"
              }`}>
                <div
                  className="w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: config.accentHex }}
                >
                  {initial}
                </div>
                <div className="text-left hidden sm:block">
                  <div className={`text-xs font-bold leading-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    {displayName}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 capitalize">{displayRole}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>

      {/* User Guide Modal */}
      <UserGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Global Command Palette / Search Modal */}
      <HeaderSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}