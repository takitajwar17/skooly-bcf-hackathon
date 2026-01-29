import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import AiMaterial from "@/lib/models/AiMaterial";

export async function GET(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    const materials = await AiMaterial.find({
      uploadedBy: user.id,
    }).sort({
      createdAt: -1,
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 },
    );
  }
}
