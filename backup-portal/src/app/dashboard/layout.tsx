import { SidebarNav } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar'; // Import SidebarProvider

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider> {/* Wrap with SidebarProvider */}
      <div className="flex min-h-screen w-full">
        <SidebarNav /> {/* Use SidebarNav component */}
        <div className="flex w-full flex-col">
          <Header />
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
