import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ToastProvider } from "@/components/ui/toast";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await currentUser();
  if (!user || (user.publicMetadata as any)?.role !== "admin") {
    redirect("/");
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 bg-surface p-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
