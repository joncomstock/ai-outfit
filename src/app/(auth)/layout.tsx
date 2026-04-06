import { Nav } from "@/components/layout/nav";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { ModalProvider } from "@/components/layout/modal-provider";
import { ToastProvider } from "@/components/ui/toast";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <ModalProvider>
        <Nav />
        <main className="mx-auto max-w-[1200px] px-6 py-8 pb-24 md:pb-8">
          {children}
        </main>
        <MobileTabBar />
      </ModalProvider>
    </ToastProvider>
  );
}
