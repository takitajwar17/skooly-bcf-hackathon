import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ArrowUpRight, CirclePlay } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Hero = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center overflow-hidden border-b border-accent">
      <div className="max-w-(--breakpoint-xl) w-full flex flex-col lg:flex-row mx-auto items-center justify-between gap-y-14 gap-x-10 px-6 py-12 lg:py-0">
        <div className="max-w-xl">
          <Badge className="rounded-full py-1 border-none bg-primary/10 text-primary">
            Revolutionizing Student Learning
          </Badge>
          <h1 className="mt-6 max-w-[20ch] text-3xl xs:text-4xl sm:text-5xl lg:text-[2.75rem] xl:text-5xl font-bold leading-[1.2]! tracking-tight">
            Master Your Curriculum with Skooly
          </h1>
          <p className="mt-6 max-w-[60ch] xs:text-lg text-muted-foreground">
            The all-in-one hub for your course materials. Upload your notes, preview them instantly, and use AI to unlock deeper insights from your lectures.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-full text-base px-8 h-12 shadow-lg shadow-primary/20"
              asChild
            >
              <Link href="/sign-up">
                Get Started <ArrowUpRight className="h-5! w-5!" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto rounded-full text-base shadow-none px-8 h-12"
            >
              <CirclePlay className="h-5! w-5!" /> Watch Demo
            </Button>
          </div>
        </div>
        <div className="relative lg:max-w-lg xl:max-w-xl w-full bg-accent rounded-3xl aspect-square overflow-hidden border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent z-10" />
          <Image
            src="/placeholder.svg"
            fill
            alt="Skooly Interface"
            className="object-cover rounded-xl p-4"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;