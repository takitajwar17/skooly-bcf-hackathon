import { notFound } from "next/navigation";
import { AppSidebar } from "@/app/components/dashboard/app-sidebar"
import { SiteHeader } from "@/app/components/dashboard/site-header"
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar"
import { FileEditor } from "@/app/components/projects/file-editor"
import { getProject } from "@/lib/actions/project"
import { getFile } from "@/lib/actions/file"

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const { id, fileId } = await params;
  
  const [project, file] = await Promise.all([
    getProject(id),
    getFile(fileId)
  ]);

  if (!project || !file) {
    notFound();
  }

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
          <div className="flex-1 rounded-xl bg-muted/50 p-8 h-full">
             <FileEditor project={project} file={file} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
