
import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { SkipToContent } from "@/components/accessibility/SkipToContent";

interface AppLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  headerActions?: ReactNode;
}

export function AppLayout({ children, pageTitle, headerActions }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <SkipToContent />
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          {(pageTitle || headerActions) && (
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4" role="banner">
              <SidebarTrigger className="-ml-1" aria-label="Toggle sidebar" />
              <div className="flex items-center justify-between w-full">
                {pageTitle && (
                  <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
                )}
                {headerActions && (
                  <div className="flex gap-2" role="toolbar" aria-label="Page actions">
                    {headerActions}
                  </div>
                )}
              </div>
            </header>
          )}
          <main id="main-content" tabIndex={-1} className="focus:outline-none">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
