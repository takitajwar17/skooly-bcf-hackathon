import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import AiMaterial from "@/lib/models/AiMaterial";

export async function GET(req, { params }) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    const { id } = await params;

    const material = await AiMaterial.findOne({
      _id: id,
      uploadedBy: user.id,
    });

    if (!material) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(material);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch material" },
      { status: 500 },
    );
  }
}
