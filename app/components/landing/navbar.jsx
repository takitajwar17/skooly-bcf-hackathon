"use client";

import { useUser } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import Link from "next/link";
import { IconSchool } from "@tabler/icons-react";

import { Button } from "@/app/components/ui/button";
import ThemeToggle from "@/app/components/theme-toggle";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/app/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/ui/sheet";

const Logo = () => (
  <Link href="/" className="flex items-center gap-2 group">
    <div className="p-1.5 bg-primary rounded-lg group-hover:rotate-12 transition-transform duration-300">
      <IconSchool className="h-5 w-5 text-primary-foreground" />
    </div>
    <span className="text-xl font-black tracking-tighter uppercase">Skooly</span>
  </Link>
);

const NavMenu = (props) => (
  <NavigationMenu {...props}>
    <NavigationMenuList className="gap-6 space-x-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start">
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <Link href="/">Home</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <Link href="#features">Features</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <Link href="#faq">FAQ</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <Link href="#testimonials">Testimonials</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <Link href="#pricing">Pricing</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
);

const MobileNav = ({ isSignedIn }) => (
  <Sheet>
    <SheetTitle className="sr-only">Navigation Drawer</SheetTitle>
    <SheetTrigger asChild>
      <Button variant="outline" size="icon">
        <Menu />
      </Button>
    </SheetTrigger>
    <SheetContent>
      <div className="mb-8">
        <Logo />
      </div>
      <NavMenu orientation="vertical" className="mt-4" />
      <div className="mt-8 space-y-4">
        {!isSignedIn && (
          <Button variant="outline" className="w-full sm:hidden" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        )}
        <Button className="w-full xs:hidden" asChild>
          <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
            {isSignedIn ? "Dashboard" : "Get Started"}
          </Link>
        </Button>
      </div>
    </SheetContent>
  </Sheet>
);

const Navbar = () => {
  const { isSignedIn } = useUser();

  return (
    <nav className="h-16 bg-background border-b border-accent">
      <div className="h-full flex items-center justify-between max-w-(--breakpoint-xl) mx-auto px-4 sm:px-6">
        <Logo />

        {/* Desktop Menu */}
        <NavMenu className="hidden md:block" />

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!isSignedIn && (
            <Button variant="outline" className="hidden sm:inline-flex" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          )}
          <Button className="hidden xs:inline-flex" asChild>
            <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
              {isSignedIn ? "Dashboard" : "Get Started"}
            </Link>
          </Button>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <MobileNav isSignedIn={isSignedIn} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;