import { notFound } from "next/navigation";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar"
import { SiteHeader } from "@/app/components/dashboard/site-header"
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar"
import { ProjectDetail } from "@/app/components/projects/project-detail"
import { getProject } from "@/lib/actions/project"
import { getFiles } from "@/lib/actions/file"

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const { id } = await params; // Await params in Next.js 15+ (and 16)
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const files = await getFiles(id);

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
             <ProjectDetail project={project} initialFiles={files} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
