import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth/lucia";
import UserNav from "@/components/UserNav";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/");
  }

  // Se for admin, redireciona para o dashboard administrativo
  if (
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN" ||
    user.role === "STAFF"
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-black">
      <UserNav user={user} />

      {/* Main content with padding for fixed nav */}
      <main className="pt-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[200px]" />
      </div>
    </div>
  );
}
