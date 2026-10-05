import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Loader2 } from "lucide-react";
import { authApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";

const schema = z.object({
  full_name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organization: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setLoading(true);
    try {
      const res = await authApi.register(data);
      login(res.access_token, res.refresh_token);
      navigate("/dashboard");
    } catch (err: any) {
     const detail = err?.response?.data?.detail;

console.error("Registration error:", err?.response?.data);

if (Array.isArray(detail)) {
  setServerError(
    detail
      .map((item: any) => item.msg || JSON.stringify(item))
      .join(", ")
  );
} else {
  setServerError(
    detail ||
    err?.message ||
    "Registration failed."
  );
}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="glass-card p-10 w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mb-4 shadow-lg shadow-brand-500/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Create account</h1>
          <p className="text-slate-500 text-sm mt-1">Join ReliefGrid</p>
        </div>

        {serverError && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full name</label>
            <input {...register("full_name")} className="input-field" placeholder="Jane Doe" />
            {errors.full_name && (
              <p className="text-red-600 text-xs mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" {...register("email")} className="input-field" placeholder="you@reliefgrid.io" />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input type="password" {...register("password")} className="input-field" placeholder="At least 8 characters" />
            {errors.password && (
              <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Organization <span className="text-slate-400">(optional)</span>
            </label>
            <input {...register("organization")} className="input-field" placeholder="NDRF, Red Cross, etc." />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}