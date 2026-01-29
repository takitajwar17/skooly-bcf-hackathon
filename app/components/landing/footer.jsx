import { Separator } from "@/app/components/ui/separator";
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconSchool,
} from "@tabler/icons-react";
import Link from "next/link";

const footerSections = [
  {
    title: "Product",
    links: [
      { title: "Course Materials", href: "/materials" },
      { title: "AI Tutor", href: "#" },
      { title: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { title: "Documentation", href: "#" },
      { title: "Help Center", href: "#" },
      { title: "Community", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { title: "Terms", href: "#" },
      { title: "Privacy", href: "#" },
    ],
  },
];

const Logo = () => (
  <Link href="/" className="flex items-center gap-2 group">
    <div className="p-1.5 bg-primary rounded-lg group-hover:rotate-12 transition-transform duration-300">
      <IconSchool className="h-5 w-5 text-primary-foreground" />
    </div>
    <span className="text-xl font-black tracking-tighter uppercase text-foreground">Skooly</span>
  </Link>
);

const Footer = () => {
  return (
    <footer className="mt-12 xs:mt-20 dark bg-background border-t">
      <div className="max-w-(--breakpoint-xl) mx-auto py-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-8 gap-y-10 px-6">
        <div className="col-span-full xl:col-span-2">
          <Logo />
          <p className="mt-4 text-muted-foreground max-w-xs">
            Your intelligent student companion for managing curriculum and mastering course content with AI.
          </p>
        </div>

        {footerSections.map(({ title, links }) => (
          <div key={title} className="xl:justify-self-end">
            <h6 className="font-semibold text-foreground">{title}</h6>
            <ul className="mt-6 space-y-4">
              {links.map(({ title, href }) => (
                <li key={title}>
                  <Link
                    href={href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Separator />
      <div className="max-w-(--breakpoint-xl) mx-auto py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6">
        {/* Copyright */}
        <span className="text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} Skooly AI. All rights reserved.
        </span>

        <div className="flex items-center gap-5 text-muted-foreground">
          <Link href="#" target="_blank">
            <IconBrandTwitter className="h-5 w-5 hover:text-foreground transition-colors" />
          </Link>
          <Link href="#" target="_blank">
            <IconBrandLinkedin className="h-5 w-5 hover:text-foreground transition-colors" />
          </Link>
          <Link href="#" target="_blank">
            <IconBrandGithub className="h-5 w-5 hover:text-foreground transition-colors" />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;