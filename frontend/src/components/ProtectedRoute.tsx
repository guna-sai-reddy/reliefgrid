import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);

  // Authenticated only if BOTH flag and token exist
  const authed = isAuthenticated && !!token;

  return authed ? <Outlet /> : <Navigate to="/login" replace />;
}