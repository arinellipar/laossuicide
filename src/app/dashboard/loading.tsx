export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-purple-500/30 border-t-pink-500 animate-spin" />
        <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 blur-xl opacity-50 animate-pulse" />
      </div>
    </div>
  );
}
