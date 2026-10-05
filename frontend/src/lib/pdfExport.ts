export interface PredictionReportData {
  zone_name: string;
  priority: string;
  report_id?: string;
  created_at?: string;
  recommended_warehouse?: string;
  route_distance_km?: number;
  dispatch_eta_hours?: number;
  food: { point: number; ci_lower: number; ci_upper: number; vuln_factor?: number };
  water: { point: number; ci_lower: number; ci_upper: number; vuln_factor?: number };
  medical: { point: number; ci_lower: number; ci_upper: number; vuln_factor?: number };
  shelter: { point: number; ci_lower: number; ci_upper: number; vuln_factor?: number };
  inputs?: any;
}

export function exportPredictionPDF(data: PredictionReportData) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>ReliefGrid - Disaster Demand & Warehouse Prediction Report</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { font-size: 24px; font-weight: bold; color: #e11d48; }
          .title { font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 4px; }
          .meta { text-align: right; font-size: 12px; color: #64748b; }
          .badge { display: inline-block; padding: 4px 12px; font-weight: 700; font-size: 12px; border-radius: 9999px; background: #fee2e2; color: #991b1b; text-transform: uppercase; }
          .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
          .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 12px; }
          .wh-name { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
          .pills { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
          .pill { background: #ffffff; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
          .card-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; }
          .val { font-size: 24px; font-weight: 800; color: #0f172a; margin: 8px 0; }
          .sub { font-size: 12px; color: #64748b; }
          .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">ReliefGrid</div>
            <div class="title">Disaster Demand & Warehouse Prediction Audit Report</div>
          </div>
          <div class="meta">
            <div><strong>${data.report_id || 'Report #' + Math.random().toString(36).substr(2, 9)}</strong></div>
            <div>Generated: ${data.created_at || new Date().toLocaleString()}</div>
            <div style="margin-top: 6px;"><span class="badge">PRIORITY: ${data.priority}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Recommended Supply Warehouse</div>
          <div class="wh-name">${data.recommended_warehouse || 'Chennai South Depot (Hub Alpha)'}</div>
          <div class="pills">
            <span class="pill">Route Distance: ${data.route_distance_km ?? 210} km</span>
            <span class="pill">Dispatch ETA: ${data.dispatch_eta_hours ?? 2.8} hours</span>
            <span class="pill">Target Zone: ${data.zone_name}</span>
          </div>
        </div>

        <div class="section-title" style="margin-left: 4px;">Predicted Resource Requirements</div>
        <div class="grid">
          <div class="card">
            <div class="card-title">Food Relief Needed</div>
            <div class="val">${Math.round(data.food.point).toLocaleString()} Pks</div>
            <div class="sub">Confidence Interval: [${Math.round(data.food.ci_lower).toLocaleString()}, ${Math.round(data.food.ci_upper).toLocaleString()}]</div>
          </div>
          <div class="card">
            <div class="card-title">Clean Water Needed</div>
            <div class="val">${Math.round(data.water.point).toLocaleString()} Liters</div>
            <div class="sub">Confidence Interval: [${Math.round(data.water.ci_lower).toLocaleString()}, ${Math.round(data.water.ci_upper).toLocaleString()}]</div>
          </div>
          <div class="card">
            <div class="card-title">Medical Kits Needed</div>
            <div class="val">${Math.round(data.medical.point).toLocaleString()} Kits</div>
            <div class="sub">Confidence Interval: [${Math.round(data.medical.ci_lower).toLocaleString()}, ${Math.round(data.medical.ci_upper).toLocaleString()}]</div>
          </div>
          <div class="card">
            <div class="card-title">Shelter Tents Needed</div>
            <div class="val">${Math.round(data.shelter.point).toLocaleString()} Units</div>
            <div class="sub">Confidence Interval: [${Math.round(data.shelter.ci_lower).toLocaleString()}, ${Math.round(data.shelter.ci_upper).toLocaleString()}]</div>
          </div>
        </div>

        <div class="footer">
          ReliefGrid AI Engine • Powered by Scikit-Learn Demand Ensemble & OR-Tools Optimization • Confidential Disaster Audit Log
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
