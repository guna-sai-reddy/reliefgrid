import type { ReactNode } from "react";
import { X, BookOpen, Brain, Truck, ShieldCheck, CheckCircle2 } from "lucide-react";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-rose-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">ReliefGrid Operations & AI Guide</h2>
              <p className="text-xs text-white/80">How the AI Predictor & LP Resource Allocator work</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition text-white/90 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-700 text-sm">
          {/* Section 1: Demand Prediction */}
          <GuideSection
            icon={<Brain className="w-5 h-5 text-rose-500" />}
            title="1. AI/ML Disaster Demand Predictor"
          >
            <p>
              The demand predictor utilizes a <strong>Scikit-Learn Ensemble Model</strong> trained on historical disaster datasets.
              By entering disaster parameters (Magnitude, Depth, Population Density, Vulnerability Index, and Demographic %s), the model outputs:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
              <li><strong>Food Relief Packages</strong> (Pks)</li>
              <li><strong>Clean Drinking Water</strong> (Liters)</li>
              <li><strong>Medical First-Aid Kits</strong> (Kits)</li>
              <li><strong>Shelter & Emergency Tents</strong> (Units)</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              💡 <em>Quantile Regressors (p10, p50, p90) generate 90% confidence intervals and scale predictions using vulnerable demographic multipliers.</em>
            </p>
          </GuideSection>

          {/* Section 2: Recommended Supply Warehouse */}
          <GuideSection
            icon={<Truck className="w-5 h-5 text-blue-500" />}
            title="2. Recommended Supply Warehouse & Dispatch Routing"
          >
            <p>
              Once resource demands are generated, ReliefGrid matches the affected zone against nearby supply depots using <strong>Google OR-Tools Linear Programming (LP)</strong>.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
              <li>Calculates optimal route distance (km) and estimated dispatch ETA (hours).</li>
              <li>Determines severity priority rating (<code>CRITICAL</code>, <code>HIGH</code>, <code>MEDIUM</code>).</li>
              <li>Generates an audit report ID for export to PDF.</li>
            </ul>
          </GuideSection>

          {/* Section 3: Priority & Missions */}
          <GuideSection
            icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
            title="3. Convoy Mission Dispatch & Live Tracking"
          >
            <p>
              After reviewing predictions, commanders can dispatch relief missions directly from the <strong>Missions</strong> tab or export prediction reports for field units.
            </p>
          </GuideSection>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Scikit-Learn Demand Ensemble & OR-Tools Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl text-xs transition shadow-sm"
          >
            Got it, close guide
          </button>
        </div>
      </div>
    </div>
  );
}

function GuideSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
      <div className="flex items-center gap-2.5 font-semibold text-slate-900 mb-2">
        {icon}
        <span>{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
