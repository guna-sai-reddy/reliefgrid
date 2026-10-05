import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// REQUEST INTERCEPTOR: ATTACH JWT
// ============================================================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ============================================================
// RESPONSE INTERCEPTOR: HANDLE 401
// ============================================================
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      sessionStorage.clear();

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      } else {
        isRedirecting = false;
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================
// AUTH
// ============================================================

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  full_name: string;
  password: string;
  organization?: string;
  phone?: string;
}

export const authApi = {
  login: async (payload: LoginPayload) => {
    const form = new URLSearchParams();

    form.append("username", payload.email);
    form.append("password", payload.password);

    const response = await axios.post(
      `${API_URL}/auth/login`,
      form,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  },

  register: async (payload: RegisterPayload) => {
    const response = await api.post("/auth/register", payload);
    return response.data;
  },

  me: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },
};

// ============================================================
// DASHBOARD
// ============================================================

export const dashboardApi = {
  summary: async () => {
    const response = await api.get("/dashboard/summary");
    return response.data;
  },
};

// ============================================================
// INCIDENTS
// ============================================================

export interface Incident {
  id: string;
  code: string;
  type: string;
  location: string;
  latitude: number;
  longitude: number;
  affected_population: number;
  priority: string;
  priority_override: boolean;
  status: string;
  demand_food: number;
  demand_water: number;
  demand_medical: number;
  demand_shelter: number;
}

export const incidentsApi = {
  list: async (limit = 100): Promise<Incident[]> => {
    const response = await api.get(`/incidents/?limit=${limit}`);
    return response.data;
  },

  get: async (id: string): Promise<Incident> => {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  },

  create: async (
    payload: Partial<Incident>
  ): Promise<Incident> => {
    const response = await api.post("/incidents/", payload);
    return response.data;
  },

  overridePriority: async (
    id: string,
    priority: string
  ) => {
    const response = await api.patch(
      `/incidents/${id}/priority`,
      {
        priority,
        reason: "Commander override",
      }
    );

    return response.data;
  },
};

// ============================================================
// DEPOTS
// ============================================================

export interface Depot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  max_transport_per_trip: number;
}

export const depotsApi = {
  list: async (): Promise<Depot[]> => {
    const response = await api.get("/depots/");
    return response.data;
  },

  get: async (id: string): Promise<Depot> => {
    const response = await api.get(`/depots/${id}`);
    return response.data;
  },

  create: async (payload: Omit<Depot, "id">): Promise<Depot> => {
    const response = await api.post("/depots/", payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<Omit<Depot, "id">>): Promise<Depot> => {
    const response = await api.patch(`/depots/${id}`, payload);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/depots/${id}`);
  },
};

// ============================================================
// RESOURCES
// ============================================================

export interface Resource {
  id: string;
  depot_id: string;
  type: string;
  quantity: number;
  unit: string;
}

export const resourcesApi = {
  list: async (
    depotId?: string
  ): Promise<Resource[]> => {
    const url = depotId
      ? `/resources/?depot_id=${depotId}`
      : "/resources/";

    const response = await api.get(url);
    return response.data;
  },

  create: async (payload: Omit<Resource, "id">): Promise<Resource> => {
    const response = await api.post("/resources/", payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<Omit<Resource, "id">>): Promise<Resource> => {
    const response = await api.patch(`/resources/${id}`, payload);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/resources/${id}`);
  },
};

// ============================================================
// ALERTS
// ============================================================

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  region?: string;
  is_active: boolean;
  created_at?: string;
}

export const alertsApi = {
  list: async (limit = 50): Promise<Alert[]> => {
    const response = await api.get(`/alerts/?limit=${limit}`);
    return response.data;
  },

  create: async (
    payload: Partial<Alert>
  ): Promise<Alert> => {
    const response = await api.post("/alerts/", payload);
    return response.data;
  },
};

// ============================================================
// PREDICTIONS
// ============================================================

export interface ZoneFeatures {
  magnitude: number;
  depth: number;
  weather_score: number;
  population_density: number;
  accessibility_score: number;
  vulnerability_score: number;
  seismic_risk_score: number;
  exposure_score: number;
  resilience_score: number;
  children_pct: number;
  elder_pct: number;
  disability_pct: number;
}

export const predictionsApi = {
  predict: async (
    zoneName: string,
    features: ZoneFeatures
  ) => {
    const response = await api.post(
      "/predictions/predict",
      {
        zone_name: zoneName,
        features,
      }
    );

    return response.data;
  },

  history: async (limit = 10) => {
    const response = await api.get(
      `/predictions/history?limit=${limit}`
    );

    return response.data;
  },
};

// ============================================================
// OPTIMIZER
// ============================================================

export const optimizerApi = {
  allocate: async (
    maxTripKm = 500,
    priorityOverride?: Record<string, number>
  ) => {
    const response = await api.post(
      "/optimizer/allocate",
      {
        max_trip_km: maxTripKm,
        priority_override:
          priorityOverride ?? null,
      }
    );

    return response.data;
  },
};

// ============================================================
// ROUTING
// ============================================================

export const routingApi = {
  route: async (
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number
  ) => {
    const response = await api.post(
      "/routing/route",
      {
        origin_lat: originLat,
        origin_lon: originLon,
        dest_lat: destLat,
        dest_lon: destLon,
      }
    );

    return response.data;
  },
};

// ============================================================
// MAP
// ============================================================

export interface MapMarker {
  id: string;
  type: "incident" | "depot" | "mission";
  latitude: number;
  longitude: number;
  label: string;
  priority?: string;
  status?: string;
  meta: any;
}

export interface HeatPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  label?: string;
}

export const mapApi = {
  markers: async (
    type?: "incident" | "depot" | "all"
  ): Promise<MapMarker[]> => {
    const url = type
      ? `/map/markers?type=${type}`
      : "/map/markers";

    const response = await api.get(url);
    return response.data;
  },

  heatmap: async (): Promise<HeatPoint[]> => {
    const response = await api.get("/map/heatmap");
    return response.data;
  },

  layers: async () => {
    const response = await api.get("/map/layers");
    return response.data;
  },
};

// ============================================================
// MISSIONS
// ============================================================

export interface Mission {
  id: string;
  code: string;
  depot_id: string;
  incident_id: string;
  resources_summary: string;
  distance_km: number;
  eta_hours: number;
  status: string;
  assigned_to?: string;
}

export const missionsApi = {
  list: async (): Promise<Mission[]> => {
    const response = await api.get("/missions/");
    return response.data;
  },

  create: async (
    payload: Partial<Mission>
  ): Promise<Mission> => {
    const response = await api.post(
      "/missions/",
      payload
    );

    return response.data;
  },

  updateStatus: async (
    id: string,
    status: string
  ): Promise<Mission> => {
    const response = await api.patch(
      `/missions/${id}/status`,
      { status }
    );

    return response.data;
  },
};

// ============================================================
// ZONES
// ============================================================

export const zonesApi = {
  list: async () => {
    const response = await api.get("/zones/");
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/zones/${id}`);
    return response.data;
  },
};

// ============================================================
// ANALYTICS
// ============================================================

export const analyticsApi = {
  sitrep: async () => {
    const response = await api.get("/analytics/sitrep");
    return response.data;
  },
};

// ============================================================
// RESCUE VOLUNTEERS
// ============================================================

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  email: string;
  region: string;
  skills: string;
  status:
    | "available"
    | "deployed"
    | "on_standby"
    | "off_duty";
  induction_status:
    | "inducted"
    | "in_induction"
    | "certified"
    | "pending";
  badge_level: string;
  missions_count: number;
  assigned_incident_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface VolunteerStats {
  total: number;
  available: number;
  deployed: number;
  on_standby: number;
  inducted_or_certified: number;
}

export const volunteersApi = {
  list: async (
    params?: {
      status?: string;
      region?: string;
      skill?: string;
      induction?: string;
    }
  ): Promise<Volunteer[]> => {
    const query = new URLSearchParams();

    if (
      params?.status &&
      params.status !== "all"
    ) {
      query.append("status", params.status);
    }

    if (
      params?.region &&
      params.region !== "all"
    ) {
      query.append("region", params.region);
    }

    if (
      params?.skill &&
      params.skill !== "all"
    ) {
      query.append("skill", params.skill);
    }

    if (
      params?.induction &&
      params.induction !== "all"
    ) {
      query.append(
        "induction",
        params.induction
      );
    }

    const queryString = query.toString();

    const response = await api.get(
      `/volunteers/${
        queryString ? `?${queryString}` : ""
      }`
    );

    return response.data;
  },

  stats: async (): Promise<VolunteerStats> => {
    const response = await api.get(
      "/volunteers/stats"
    );

    return response.data;
  },

  get: async (
    id: string
  ): Promise<Volunteer> => {
    const response = await api.get(
      `/volunteers/${id}`
    );

    return response.data;
  },

  create: async (
    payload: Partial<Volunteer>
  ): Promise<Volunteer> => {
    const response = await api.post(
      "/volunteers/",
      payload
    );

    return response.data;
  },

  updateStatus: async (
    id: string,
    status: string
  ): Promise<Volunteer> => {
    const response = await api.patch(
      `/volunteers/${id}/status`,
      { status }
    );

    return response.data;
  },

  deploy: async (
    id: string,
    incidentId: string
  ): Promise<Volunteer> => {
    const response = await api.post(
      `/volunteers/${id}/deploy`,
      {
        incident_id: incidentId,
      }
    );

    return response.data;
  },

  induct: async (
    id: string,
    inductionStatus = "certified",
    badgeLevel = "Certified Specialist"
  ): Promise<Volunteer> => {
    const response = await api.post(
      `/volunteers/${id}/induct`,
      {
        induction_status: inductionStatus,
        badge_level: badgeLevel,
      }
    );

    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/volunteers/${id}`);
  },
};

// ============================================================
// TRANSLATIONS
// ============================================================

export const translationsApi = {
  getDictionary: async (lang: string) => {
    const response = await api.get(
      `/translations/${lang}`
    );

    return response.data;
  },

  induct: async (
    text: string,
    targetLang: string,
    sourceLang = "en"
  ) => {
    const response = await api.post(
      "/translations/induct",
      {
        text,
        target_lang: targetLang,
        source_lang: sourceLang,
      }
    );

    return response.data;
  },
};

// ============================================================
// ADMIN GOVERNANCE & TELEMETRY
// ============================================================

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role:
    | "admin"
    | "commander"
    | "coordinator"
    | "viewer";
  is_active: boolean;
  organization?: string;
  phone?: string;
  created_at?: string;
}

export interface SystemHealth {
  status: string;
  database_connected: boolean;
  ml_ensemble_ready: boolean;
  total_users: number;
  total_incidents: number;
  total_depots: number;
  total_missions: number;
  total_alerts: number;
  total_volunteers: number;
  server_time: string;
}

export const adminApi = {
  listUsers: async (): Promise<AdminUser[]> => {
    const response = await api.get(
      "/admin/users"
    );

    return response.data;
  },

  updateUserRole: async (
    userId: string,
    role: string
  ): Promise<AdminUser> => {
    const response = await api.patch(
      `/admin/users/${userId}/role`,
      { role }
    );

    return response.data;
  },

  toggleUserStatus: async (
    userId: string,
    isActive: boolean
  ): Promise<AdminUser> => {
    const response = await api.patch(
      `/admin/users/${userId}/status`,
      {
        is_active: isActive,
      }
    );

    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(
      `/admin/users/${userId}`
    );

    return response.data;
  },

  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await api.get(
      "/admin/system/health"
    );

    return response.data;
  },
};

export default api;