import type { ReactNode } from "react";
import { useTranslation } from "../store/langStore";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, keyField, emptyMessage = "No data",
}: DataTableProps<T>) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`text-left font-semibold text-slate-600 py-3 px-4 ${c.className ?? ""}`}
              >
                {t(c.header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-slate-400">
                {t(emptyMessage)}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={String(row[keyField])}
                className="border-b border-slate-100 hover:bg-white/50 transition"
              >
                {columns.map((c) => (
                  <td key={c.key} className={`py-3 px-4 ${c.className ?? ""}`}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}