import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connect } from "@/lib/mongodb/mongoose";
import Material from "@/lib/models/Material";
import { isAdmin } from "@/lib/actions/user";
import { deleteFromCloudinary } from "@/lib/cloudinary";

/**
 * DELETE /api/materials/[id]
 * Delete a material and its associated file from Cloudinary
 */
export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connect();

    const material = await Material.findById(id);
    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // Delete the file from Cloudinary
    if (material.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(material.cloudinaryPublicId);
      } catch (e) {
        console.error("Cloudinary deletion failed:", e);
      }
    }

    await Material.findByIdAndDelete(id);

    return NextResponse.json({ message: "Material deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}