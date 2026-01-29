"use client";

import * as React from "react";
import {
  IconDashboard,
  IconFileDescription,
  IconHelp,
  IconSchool,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconUsersGroup,
  IconNotebook,
  IconVideo,
} from "@tabler/icons-react";

import { NavMain } from "@/app/components/dashboard/nav-main";
import { NavSecondary } from "@/app/components/dashboard/nav-secondary";
import { NavUser } from "@/app/components/dashboard/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/app/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Course Materials",
      url: "/materials",
      icon: IconFileDescription,
    },

    {
      title: "My Materials",
      url: "/my-materials",
      icon: IconNotebook,
    },
    {
      title: "Videos",
      url: "/videos",
      icon: IconVideo,
    },
    {
      title: "Skooly AI",
      url: "/companion",
      icon: IconSparkles,
    },
    {
      title: "Community",
      url: "/community",
      icon: IconUsersGroup,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/search",
      icon: IconSearch,
    },
  ],
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <IconSchool className="!size-5 text-primary" />
                <span className="text-base font-bold tracking-tight">
                  Skooly
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
