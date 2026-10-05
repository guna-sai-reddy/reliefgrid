import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, UserCheck, ShieldAlert, Award, Plus, Search,
  Phone, Mail, MapPin, Loader2, CheckCircle2,
  Send, X
} from "lucide-react";
import { volunteersApi, incidentsApi, type Volunteer } from "../lib/api";
import { useTranslation } from "../store/langStore";
import { useThemeStore } from "../store/themeStore";

const statusColor: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800 border-emerald-200",
  deployed: "bg-blue-100 text-blue-800 border-blue-200",
  on_standby: "bg-amber-100 text-amber-800 border-amber-200",
  off_duty: "bg-slate-100 text-slate-700 border-slate-200",
};

const inductionColor: Record<string, string> = {
  certified: "bg-purple-100 text-purple-800 border-purple-200",
  inducted: "bg-indigo-100 text-indigo-800 border-indigo-200",
  in_induction: "bg-blue-100 text-blue-800 border-blue-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
};

export default function Volunteers() {
  const { t } = useTranslation();
  const { config } = useThemeStore();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [targetIncidentId, setTargetIncidentId] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    region: "Wayanad, Kerala",
    skills: "Medical / First Aid, Boat Rescue",
    badge_level: "Field Responder",
  });

  const statsQ = useQuery({
    queryKey: ["volunteers-stats"],
    queryFn: volunteersApi.stats,
    refetchInterval: 10000,
  });

  const volunteersQ = useQuery({
    queryKey: ["volunteers-list", filterStatus],
    queryFn: () => volunteersApi.list({ status: filterStatus }),
    refetchInterval: 10000,
  });

  const incidentsQ = useQuery({
    queryKey: ["incidents-active"],
    queryFn: () => incidentsApi.list(50),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Volunteer>) => volunteersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers-list"] });
      queryClient.invalidateQueries({ queryKey: ["volunteers-stats"] });
      setIsRegisterOpen(false);
      setFormData({
        name: "",
        phone: "",
        email: "",
        region: "Wayanad, Kerala",
        skills: "Medical / First Aid, Boat Rescue",
        badge_level: "Field Responder",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      volunteersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers-list"] });
      queryClient.invalidateQueries({ queryKey: ["volunteers-stats"] });
    },
  });

  const inductMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      volunteersApi.induct(id, "certified", "Certified Specialist"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers-list"] });
      queryClient.invalidateQueries({ queryKey: ["volunteers-stats"] });
    },
  });

  const deployMutation = useMutation({
    mutationFn: ({ volunteerId, incidentId }: { volunteerId: string; incidentId: string }) =>
      volunteersApi.deploy(volunteerId, incidentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers-list"] });
      queryClient.invalidateQueries({ queryKey: ["volunteers-stats"] });
      setIsDeployOpen(false);
      setSelectedVolunteer(null);
    },
  });

  const stats = statsQ.data;
  const filteredVolunteers = (volunteersQ.data ?? []).filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.region.toLowerCase().includes(q) ||
      v.skills.toLowerCase().includes(q) ||
      v.badge_level.toLowerCase().includes(q)
    );
  });

  const activeIncidents = incidentsQ.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t("vol.title")}</h1>
              <p className="text-sm text-slate-500">{t("vol.subtitle")}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className={`flex items-center gap-2 px-4 py-2.5 ${config.primaryColor} text-white font-medium rounded-xl transition shadow-sm text-sm`}
        >
          <Plus className="w-4 h-4" />
          {t("vol.register_btn")}
        </button>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t("vol.total")}
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {stats?.total ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Disaster response roster</div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t("vol.deployed")}
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {stats?.deployed ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Assigned to active rescue zones</div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t("vol.available")}
            </span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {stats?.available ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Standby for immediate dispatch</div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t("vol.inducted")}
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {stats?.inducted_or_certified ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Certified rescue specialists</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">{t("vol.filter_status")}</span>
          {["all", "available", "deployed", "on_standby", "off_duty"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                filterStatus === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "all" ? t("vol.all") : st.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t("vol.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* Volunteers Roster Grid */}
      {volunteersQ.isLoading ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading rescue volunteers...
        </div>
      ) : filteredVolunteers.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500">
          {t("vol.no_volunteers")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVolunteers.map((vol) => (
            <div
              key={vol.id}
              className="glass-card p-5 flex flex-col justify-between hover:shadow-md transition border-t-4 border-t-emerald-500"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{vol.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-semibold text-slate-500">{vol.badge_level}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {vol.missions_count} {t("vol.missions")}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold capitalize ${
                      statusColor[vol.status] || "bg-slate-100"
                    }`}
                  >
                    {vol.status.replace("_", " ")}
                  </span>
                </div>

                {/* Induction Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                      inductionColor[vol.induction_status] || "bg-slate-100"
                    }`}
                  >
                    <Award className="w-3 h-3" />
                    {vol.induction_status.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                {/* Station & Contacts */}
                <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{vol.region}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <a href={`tel:${vol.phone}`} className="hover:text-blue-600 transition">
                      {vol.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <a href={`mailto:${vol.email}`} className="hover:text-blue-600 truncate transition">
                      {vol.email}
                    </a>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {vol.skills.split(",").map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                    >
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {vol.status !== "deployed" ? (
                  <button
                    onClick={() => {
                      setSelectedVolunteer(vol);
                      setIsDeployOpen(true);
                      if (activeIncidents.length > 0) {
                        setTargetIncidentId(activeIncidents[0].id);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                  >
                    <Send className="w-3 h-3" />
                    {t("vol.deploy_btn")}
                  </button>
                ) : (
                  <button
                    onClick={() => statusMutation.mutate({ id: vol.id, status: "available" })}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Mark Available
                  </button>
                )}

                {vol.induction_status !== "certified" && (
                  <button
                    onClick={() => inductMutation.mutate({ id: vol.id })}
                    disabled={inductMutation.isPending}
                    title="Certify Induction"
                    className="p-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold transition"
                  >
                    <Award className="w-4 h-4" />
                  </button>
                )}

                <select
                  value={vol.status}
                  onChange={(e) => statusMutation.mutate({ id: vol.id, status: e.target.value })}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 bg-white"
                >
                  <option value="available">Available</option>
                  <option value="deployed">Deployed</option>
                  <option value="on_standby">Standby</option>
                  <option value="off_duty">Off Duty</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Volunteer Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{t("vol.reg_title")}</h2>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t("vol.full_name")}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Anjali Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {t("vol.phone")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {t("vol.email")}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="volunteer@rescue.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t("vol.region")}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Wayanad, Kerala / Puri, Odisha"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t("vol.skills")}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Medical, Boat Rescue, SAR, Drone Ops"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t("vol.badge")}
                </label>
                <select
                  value={formData.badge_level}
                  onChange={(e) => setFormData({ ...formData, badge_level: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                >
                  <option value="Field Responder">Field Responder</option>
                  <option value="Certified Specialist">Certified Specialist</option>
                  <option value="Lead Rescuer">Lead Rescuer</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  {t("vol.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className={`px-4 py-2 ${config.primaryColor} text-white rounded-xl text-xs font-semibold transition`}
                >
                  {createMutation.isPending ? "Registering..." : t("vol.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Deploy Modal */}
      {isDeployOpen && selectedVolunteer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{t("vol.deploy_title")}</h2>
              <button
                onClick={() => setIsDeployOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
              <div className="font-bold">Deploying: {selectedVolunteer.name}</div>
              <div>Skills: {selectedVolunteer.skills}</div>
              <div>Base: {selectedVolunteer.region}</div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!targetIncidentId) return;
                deployMutation.mutate({
                  volunteerId: selectedVolunteer.id,
                  incidentId: targetIncidentId,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t("vol.select_incident")}
                </label>
                <select
                  required
                  value={targetIncidentId}
                  onChange={(e) => setTargetIncidentId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                >
                  {activeIncidents.map((inc) => (
                    <option key={inc.id} value={inc.id}>
                      [{inc.priority.toUpperCase()}] {inc.code} - {inc.location} ({inc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsDeployOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  {t("vol.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={deployMutation.isPending || !targetIncidentId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
                >
                  {deployMutation.isPending ? "Deploying..." : t("vol.deploy_confirm")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
