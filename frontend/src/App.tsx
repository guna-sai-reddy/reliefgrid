import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Public pages
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Features = lazy(() => import("./pages/Features"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

// Protected pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Predictor = lazy(() => import("./pages/Predictor"));
const MapPage = lazy(() => import("./pages/MapPage"));
const Incidents = lazy(() => import("./pages/Incidents"));
const Resources = lazy(() => import("./pages/Resources"));
const Missions = lazy(() => import("./pages/Missions"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Volunteers = lazy(() => import("./pages/Volunteers"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));

// Wrappers
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

        <p className="text-sm font-medium text-slate-600">
          Loading ReliefGrid...
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ==================================================== */}
        {/* PUBLIC ROUTES                                        */}
        {/* ==================================================== */}

        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ==================================================== */}
        {/* PROTECTED ROUTES                                     */}
        {/* ==================================================== */}

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/predict"
              element={<Predictor />}
            />

            <Route
              path="/map"
              element={<MapPage />}
            />

            <Route
              path="/incidents"
              element={<Incidents />}
            />

            <Route
              path="/resources"
              element={<Resources />}
            />

            <Route
              path="/missions"
              element={<Missions />}
            />

            <Route
              path="/alerts"
              element={<Alerts />}
            />

            <Route
              path="/volunteers"
              element={<Volunteers />}
            />

            <Route
              path="/analytics"
              element={<Analytics />}
            />

            <Route
              path="/admin"
              element={<Admin />}
            />

            <Route
              path="/profile"
              element={<Profile />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />

          </Route>
        </Route>

        {/* ==================================================== */}
        {/* FALLBACK                                             */}
        {/* ==================================================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </Suspense>
  );
}