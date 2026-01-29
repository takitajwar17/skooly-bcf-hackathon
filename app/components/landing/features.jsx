import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import {
  FolderOpen,
  Search,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Users,
} from "lucide-react";

/** Features aligned with PROBLEM_STATEMENT: CMS, Search, AI Materials, Validation, Chat, Community. */
const features = [
  {
    icon: FolderOpen,
    title: "Content Management (Theory & Lab)",
    description:
      "Admins upload and organize slides, PDFs, code, and notes. Browse by topic, week, tags, and type—all in one place.",
  },
  {
    icon: Search,
    title: "Intelligent Search (RAG-Based)",
    description:
      "Semantic search over course materials. Natural-language queries return relevant documents, excerpts, and code snippets.",
  },
  {
    icon: Sparkles,
    title: "AI-Generated Learning Materials",
    description:
      "Generate theory notes, slides, or lab code from a topic or prompt. Output is grounded in your uploaded curriculum.",
  },
  {
    icon: ShieldCheck,
    title: "Validation & Evaluation",
    description:
      "Generated content is checked for correctness, relevance, and academic reliability—syntax, grounding, and rubrics.",
  },
  {
    icon: MessageCircle,
    title: "Conversational AI Companion",
    description:
      "Chat to search, summarize, generate materials, and ask follow-ups. Responses are grounded in course data.",
  },
  {
    icon: Users,
    title: "Community & Bot Support",
    description:
      "Discuss problems with peers. Bot support provides grounded replies when the intended receiver is unavailable.",
  },
];

/**
 * Features grid mapping to PROBLEM_STATEMENT Parts 1–5 + Community bonus.
 */
const Features = () => {
  return (
    <div
      id="features"
      className="max-w-(--breakpoint-xl) mx-auto w-full py-12 xs:py-20 px-6"
    >
      <h2 className="text-3xl xs:text-4xl md:text-5xl md:leading-[3.5rem] font-semibold tracking-tight sm:max-w-2xl sm:text-center sm:mx-auto">
        Everything You Need to Master Your Course
      </h2>
      <div className="mt-8 xs:mt-14 w-full mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="flex flex-col border rounded-xl overflow-hidden shadow-none"
          >
            <CardHeader>
              <feature.icon className="h-6 w-6 text-primary" />
              <h4 className="mt-3! text-xl font-semibold tracking-tight">
                {feature.title}
              </h4>
              <p className="mt-1 text-muted-foreground text-sm xs:text-[17px]">
                {feature.description}
              </p>
            </CardHeader>
            <CardContent className="mt-auto px-0 pb-0">
              <div className="bg-muted h-52 ml-6 rounded-tl-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Features;
