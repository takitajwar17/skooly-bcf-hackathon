import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { validateResponse } from "@/lib/ai/contentValidator";

/**
 * POST /api/chat/evaluate
 * Run validation on an assistant response on demand (Evaluate button).
 * Body: { userMessage, assistantContent }
 * Returns: { validation }
 */
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userMessage, assistantContent } = body;

    if (!userMessage || !assistantContent) {
      return NextResponse.json(
        { error: "userMessage and assistantContent are required" },
        { status: 400 },
      );
    }

    const validation = await validateResponse(
      String(assistantContent),
      String(userMessage),
    );

    return NextResponse.json({ validation });
  } catch (error) {
    console.error("Evaluate error:", error);
    return NextResponse.json(
      { error: error?.message || "Evaluation failed" },
      { status: 500 },
    );
  }
}
