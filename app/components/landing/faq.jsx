"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/app/components/ui/accordion";
import { cn } from "@/lib/utils";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { PlusIcon } from "lucide-react";

/** FAQ focused on the AI supplementary learning platform (theory, lab, search, generation, chat). */
const faq = [
  {
    question: "What kinds of course materials can I use?",
    answer:
      "Skooly supports lecture slides, PDFs, code files, and supplementary notes. Content is organized under Theory or Lab, with metadata like topic, week, and tags.",
  },
  {
    question: "How does intelligent search work?",
    answer:
      "We use semantic search and RAG over your course content. You can query in natural language and get relevant documents, excerpts, or code snippets—not just keyword matches.",
  },
  {
    question: "What can the AI generate?",
    answer:
      "For theory: reading notes, slides, or PDFs. For lab: code-centric materials in specified languages. All outputs are grounded in your uploaded materials and validated for correctness.",
  },
  {
    question: "How is generated content validated?",
    answer:
      "We use syntax checks and linting for code, reference grounding against uploaded materials, rubric-based evaluation, and optional AI-assisted self-evaluation with explainability.",
  },
  {
    question: "What can I do through the chat interface?",
    answer:
      "Search course materials, request summaries or explanations, generate theory or lab materials, and ask follow-up questions. Responses are grounded in your course data and maintain context.",
  },
  {
    question: "What is Community & Bot Support?",
    answer:
      "A discussion space where students can post questions. When the intended receiver is unavailable, a bot can provide grounded, course-backed replies automatically.",
  },
];

/**
 * FAQ for the AI supplementary learning platform (materials, search, generation, chat, community).
 */
const FAQ = () => {
  return (
    <div
      id="faq"
      className="w-full max-w-(--breakpoint-xl) mx-auto py-8 xs:py-16 px-6"
    >
      <h2 className="md:text-center text-3xl xs:text-4xl md:text-5xl leading-[1.15]! font-semibold tracking-tighter">
        Frequently Asked Questions
      </h2>
      <p className="mt-1.5 md:text-center xs:text-lg text-muted-foreground">
        Quick answers about course materials, AI search, generation, and the chat companion.
      </p>

      <div className="min-h-[550px] md:min-h-[320px] xl:min-h-[300px]">
        <Accordion
          type="single"
          collapsible
          className="mt-8 space-y-4 md:columns-2 gap-4"
        >
          {faq.map(({ question, answer }, index) => (
            <AccordionItem
              key={question}
              value={`question-${index}`}
              className="bg-accent py-1 px-4 rounded-xl border-none mt-0! mb-4! break-inside-avoid"
            >
              <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger
                  className={cn(
                    "flex flex-1 items-center justify-between py-4 font-semibold tracking-tight transition-all hover:underline [&[data-state=open]>svg]:rotate-45",
                    "text-start text-lg"
                  )}
                >
                  {question}
                  <PlusIcon className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200" />
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionContent className="text-[15px]">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FAQ;
