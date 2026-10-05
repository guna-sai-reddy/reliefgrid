export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="glass-card p-12 text-center max-w-3xl animate-fade-in">
        <h1 className="text-6xl font-extrabold text-slate-900 mb-4 tracking-tight">ReliefGrid</h1>
        <p className="text-xl text-slate-600 mb-2">Disaster Relief Resource Allocator</p>
        <p className="text-sm text-slate-500 mb-8">AI-powered demand prediction · OR-Tools allocation · Real-time relief map</p>
        <div className="flex gap-3 justify-center">
          <a href="/login" className="btn-primary">Sign In</a>
          <a href="/register" className="btn-ghost">Create Account</a>
        </div>
      </div>
    </div>
  );
}
