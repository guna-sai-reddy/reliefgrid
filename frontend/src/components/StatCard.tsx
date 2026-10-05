import type { LucideIcon } from "lucide-react";
import { useTranslation } from "../store/langStore";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: string;
  subtitle?: string;
  trend?: string;
}

const colorStyles: Record<string, { bg: string; text: string }> = {
  red: { bg: "bg-red-50 text-red-600 border border-red-100", text: "text-red-600" },
  blue: { bg: "bg-blue-50 text-blue-600 border border-blue-100", text: "text-blue-600" },
  green: { bg: "bg-emerald-50 text-emerald-600 border border-emerald-100", text: "text-emerald-600" },
  amber: { bg: "bg-amber-50 text-amber-600 border border-amber-100", text: "text-amber-600" },
  purple: { bg: "bg-purple-50 text-purple-600 border border-purple-100", text: "text-purple-600" },
  indigo: { bg: "bg-indigo-50 text-indigo-600 border border-indigo-100", text: "text-indigo-600" },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "blue",
  subtitle,
  trend,
}: StatCardProps) {
  const { t } = useTranslation();
  const colorConfig = colorStyles[color] || colorStyles.blue;

  return (
    <div className="glass-card p-5 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{t(label)}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${colorConfig.bg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {(subtitle || trend) && (
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            {trend && <span className="font-semibold text-emerald-600">{t(trend)}</span>}
            {subtitle && <span>{t(subtitle)}</span>}
          </div>
        )}
      </div>
    </div>
  );
}