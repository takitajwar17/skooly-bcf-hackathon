import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { cn } from "@/lib/utils";
import { CircleCheck } from "lucide-react";
import Link from "next/link";

/** Education-focused tiers: Student (free), Instructor, Institutional. */
const plans = [
  {
    name: "Student",
    price: "Free",
    description:
      "Full access to course materials, semantic search, AI companion chat, and AI-generated learning materials.",
    features: [
      "Browse theory & lab materials",
      "RAG-based intelligent search",
      "Conversational AI companion",
      "Generate theory notes & lab code",
      "Community discussions & bot support",
    ],
    buttonText: "Get started free",
    href: "/sign-up",
  },
  {
    name: "Instructor / TA",
    price: "Free",
    isPopular: true,
    description:
      "Everything in Student, plus upload and manage content, run validation, and oversee course structure.",
    features: [
      "All Student features",
      "Upload & organize Theory / Lab content",
      "Metadata: topic, week, tags, type",
      "Validation & evaluation tools",
      "Manage courses & materials",
    ],
    buttonText: "Start as instructor",
    href: "/sign-up",
  },
  {
    name: "Institutional",
    price: "Contact",
    description:
      "Multi-course deployment, SSO, analytics, and dedicated support for departments or institutions.",
    features: [
      "All Instructor features",
      "Multi-course management",
      "SSO & admin controls",
      "Usage analytics",
      "Dedicated support",
    ],
    buttonText: "Contact us",
    href: "#",
  },
];

/**
 * Education-first pricing: Student (free), Instructor / TA (free), Institutional (contact).
 */
const Pricing = () => {
  return (
    <div
      id="pricing"
      className="max-w-(--breakpoint-lg) mx-auto py-12 xs:py-20 px-6"
    >
      <h1 className="text-4xl xs:text-5xl font-semibold text-center tracking-tight">
        Simple, education-first pricing
      </h1>
      <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">
        Students and instructors get full access. Institutions can scale across courses.
      </p>
      <div className="mt-8 xs:mt-14 grid grid-cols-1 lg:grid-cols-3 items-center gap-8 lg:gap-0">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "relative bg-accent/50 border p-7 rounded-xl lg:rounded-none lg:first:rounded-l-xl lg:last:rounded-r-xl",
              {
                "bg-background border-[2px] border-primary py-12 rounded-xl!":
                  plan.isPopular,
              }
            )}
          >
            {plan.isPopular && (
              <Badge className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2">
                Most popular
              </Badge>
            )}
            <h3 className="text-lg font-medium">{plan.name}</h3>
            <p className="mt-2 text-4xl font-bold">{plan.price}</p>
            <p className="mt-4 font-medium text-muted-foreground">
              {plan.description}
            </p>
            <Separator className="my-6" />
            <ul className="space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CircleCheck className="h-4 w-4 mt-1 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.isPopular ? "default" : "outline"}
              size="lg"
              className="w-full mt-6 rounded-full"
              asChild
            >
              <Link href={plan.href}>{plan.buttonText}</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
