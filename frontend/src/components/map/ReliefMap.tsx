import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mapApi } from "../../lib/api";
import { Loader2, Layers, RefreshCw, Plus } from "lucide-react";

// ------------------------------------------------------------
// Fix Leaflet default marker icons
// ------------------------------------------------------------
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ------------------------------------------------------------
// Priority → color
// ------------------------------------------------------------
const PRIORITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#eab308",
  low: "#16a34a",
};

// ------------------------------------------------------------
// Custom pin icon
// ------------------------------------------------------------
function makePinIcon(color: string, glyph: string): L.DivIcon {
  return L.divIcon({
    className: "custom-pin",
    html: `
      <div style="position: relative; width: 32px; height: 42px;">
        <svg viewBox="0 0 24 32" width="32" height="42"
             style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
          <path fill="${color}"
                d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z"/>
          <circle fill="white" cx="12" cy="12" r="6"/>
        </svg>
        <div style="position: absolute; top: 6px; left: 0;
                    width: 32px; text-align: center;
                    font-size: 12px; font-weight: 700;
                    color: ${color};">${glyph}</div>
      </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
}

interface ClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onMapClick }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface ReliefMapProps {
  onReportIncidentAt?: (coords: { lat: number; lng: number }) => void;
}

export default function ReliefMap({ onReportIncidentAt }: ReliefMapProps) {
  const queryClient = useQueryClient();
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showDepots, setShowDepots] = useState(true);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const markersQ = useQuery({
    queryKey: ["map-markers"],
    queryFn: () => mapApi.markers(),
    refetchInterval: 10000,
  });

  const heatQ = useQuery({
    queryKey: ["map-heatmap"],
    queryFn: mapApi.heatmap,
    refetchInterval: 30000,
  });

  // Real-time WebSocket connection to backend map updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: any = null;

    function connect() {
      try {
        const baseWs = import.meta.env.VITE_WS_URL || "ws://localhost:8000/api/v1/ws";
        const wsUrl = `${baseWs}/map`;
        ws = new WebSocket(wsUrl);

        ws.onmessage = () => {
          queryClient.invalidateQueries({ queryKey: ["map-markers"] });
          queryClient.invalidateQueries({ queryKey: ["map-heatmap"] });
        };

        ws.onclose = () => {
          // Reconnect after 5 seconds if disconnected
          timer = setTimeout(connect, 5000);
        };
      } catch (err) {
        // Fallback gracefully to HTTP polling
      }
    }

    connect();

    return () => {
      if (timer) clearTimeout(timer);
      if (ws) ws.close();
    };
  }, [queryClient]);

  if (markersQ.isLoading) {
    return (
      <div className="glass-card p-12 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-brand-600" />
        <div className="text-slate-600">Loading relief map…</div>
      </div>
    );
  }

  if (markersQ.isError) {
    return (
      <div className="glass-card p-6 border-l-4 border-red-500">
        <div className="font-semibold text-red-700">
          Failed to load map data
        </div>
        <div className="text-sm text-slate-600 mt-1">
          Make sure the backend is running on :8000 and you're logged in.
        </div>
      </div>
    );
  }

  const markers = (markersQ.data ?? []) as any[];
  const heat = (heatQ.data ?? []) as any[];

  const incidents = markers.filter((m) => m.type === "incident");
  const depots = markers.filter((m) => m.type === "depot");

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedCoords({ lat: parseFloat(lat.toFixed(4)), lng: parseFloat(lng.toFixed(4)) });
  };

  return (
    <div className="relative w-full h-[calc(100vh-180px)] rounded-2xl overflow-hidden glass-card">
      <MapContainer
        center={[22.5937, 78.9629]}
        zoom={5}
        style={{ width: "100%", height: "100%", borderRadius: "1rem" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={handleMapClick} />

        {/* Clicked location temporary marker */}
        {selectedCoords && (
          <Marker
            position={[selectedCoords.lat, selectedCoords.lng]}
            icon={makePinIcon("#8b5cf6", "✚")}
          >
            <Popup>
              <div className="p-1 space-y-2 text-xs">
                <div className="font-bold text-slate-800">Selected Location</div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Lat: {selectedCoords.lat}, Lng: {selectedCoords.lng}
                </div>
                {onReportIncidentAt && (
                  <button
                    onClick={() => {
                      onReportIncidentAt(selectedCoords);
                      setSelectedCoords(null);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Report Incident Here
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Heatmap */}
        {showHeatmap &&
          heat.map((h: any, i: number) => (
            <Circle
              key={`heat-${i}`}
              center={[h.latitude, h.longitude]}
              radius={40000 + (h.intensity || 0) * 60000}
              pathOptions={{
                color: "#f59e0b",
                fillColor: "#f59e0b",
                fillOpacity: 0.12 + (h.intensity || 0) * 0.15,
                weight: 1,
                dashArray: "4 4",
              }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-bold text-sm">
                    {h.label ?? "Zone"}
                  </div>
                  <div className="text-slate-500">
                    Demand: <b>{((h.intensity || 0) * 100).toFixed(0)}%</b>
                  </div>
                </div>
              </Popup>
            </Circle>
          ))}

        {/* Incident markers */}
        {showIncidents &&
          incidents.map((m: any) => (
            <Marker
              key={m.id}
              position={[m.latitude, m.longitude]}
              icon={makePinIcon(
                PRIORITY_COLORS[m.priority ?? "medium"] ?? "#eab308",
                "!"
              )}
            >
              <Popup maxWidth={300}>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-sm text-slate-900">{m.label}</div>
                  {m.meta?.code && (
                    <div className="text-slate-500 font-mono text-[11px]">
                      {m.meta.code}
                    </div>
                  )}
                  <div>
                    Priority:{" "}
                    <span
                      className="font-semibold capitalize"
                      style={{
                        color: PRIORITY_COLORS[m.priority ?? "medium"],
                      }}
                    >
                      {m.priority}
                    </span>
                  </div>
                  <div>
                    Status: <span className="capitalize font-medium">{m.status}</span>
                  </div>
                  {m.meta?.affected_population != null && (
                    <div>
                      Affected Population:{" "}
                      <b>{m.meta.affected_population.toLocaleString()}</b>
                    </div>
                  )}
                  {m.meta?.demand && (
                    <div className="pt-2 mt-2 border-t border-slate-200">
                      <div className="font-semibold text-slate-700 mb-1">
                        Estimated Demand:
                      </div>
                      <div>
                        Food:{" "}
                        <b>
                          {Math.round(m.meta.demand.food ?? 0).toLocaleString()}
                        </b>{" "}
                        pkts
                      </div>
                      <div>
                        Water:{" "}
                        <b>
                          {Math.round(m.meta.demand.water ?? 0).toLocaleString()}
                        </b>{" "}
                        L
                      </div>
                      <div>
                        Medical:{" "}
                        <b>
                          {Math.round(m.meta.demand.medical ?? 0).toLocaleString()}
                        </b>{" "}
                        kits
                      </div>
                      <div>
                        Shelter:{" "}
                        <b>
                          {Math.round(m.meta.demand.shelter ?? 0).toLocaleString()}
                        </b>{" "}
                        spots
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Depot markers */}
        {showDepots &&
          depots.map((m: any) => (
            <Marker
              key={m.id}
              position={[m.latitude, m.longitude]}
              icon={makePinIcon("#2563eb", "▣")}
            >
              <Popup maxWidth={240}>
                <div className="text-xs">
                  <div className="font-bold text-sm text-blue-900">{m.label}</div>
                  <div className="text-blue-600 font-medium">Relief Resource Warehouse</div>
                  {m.meta?.max_transport_per_trip != null && (
                    <div className="mt-1 text-slate-700">
                      Max Transport Cap:{" "}
                      <b>
                        {m.meta.max_transport_per_trip.toLocaleString()}
                      </b>{" "}
                      kg/units
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Layer toggles & Realtime indicator */}
      <div className="absolute top-4 right-4 glass rounded-xl p-3 text-xs shadow-lg z-[1000] space-y-2 min-w-[180px]">
        <div className="flex items-center justify-between font-semibold mb-1 text-slate-800">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Layers
          </div>
          <button
            onClick={() => {
              markersQ.refetch();
              heatQ.refetch();
            }}
            title="Refresh Live Data"
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${markersQ.isFetching ? "animate-spin text-brand-600" : ""}`} />
          </button>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showIncidents}
            onChange={(e) => setShowIncidents(e.target.checked)}
            className="accent-red-500"
          />
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
          <span>Active Incidents ({incidents.length})</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showDepots}
            onChange={(e) => setShowDepots(e.target.checked)}
            className="accent-blue-500"
          />
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
          <span>Warehouses ({depots.length})</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(e) => setShowHeatmap(e.target.checked)}
            className="accent-amber-500"
          />
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
          <span>Demand Heatmap ({heat.length})</span>
        </label>

        <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Map Sync
          </span>
          <span>Click map to pin</span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 glass rounded-xl p-3 text-xs shadow-lg z-[1000]">
        <div className="font-semibold mb-2 text-slate-800">Priority Levels</div>
        <div className="space-y-1">
          {Object.entries(PRIORITY_COLORS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 capitalize">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ background: v }}
              />
              {k}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}