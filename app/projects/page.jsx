import { AppSidebar } from "@/app/components/dashboard/app-sidebar"
import { SiteHeader } from "@/app/components/dashboard/site-header"
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar"
import { ProjectList } from "@/app/components/projects/project-list"
import { getProjects } from "@/lib/actions/project"

export const dynamic = "force-dynamic";

export default async function Page() {
  const projects = await getProjects();

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)"
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex-1 rounded-xl bg-muted/50 p-8">
             <ProjectList initialProjects={projects} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
