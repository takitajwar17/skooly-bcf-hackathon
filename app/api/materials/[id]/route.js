import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { unlink } from "fs/promises";
import connectDB from "@/lib/mongodb/mongoose";
import Material from "@/lib/models/Material";
import { deleteEmbeddings } from "@/lib/ai/rag";
import { deleteFromCloudinary } from "@/lib/cloudinary/upload";

// GET - Get single material by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const material = await Material.findById(id);

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ material });
  } catch (error) {
    console.error("Error fetching material:", error);
    return NextResponse.json(
      { error: "Failed to fetch material" },
      { status: 500 },
    );
  }
}

// PUT - Update material
export async function PUT(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const data = await request.json();

    const material = await Material.findById(id);

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 },
      );
    }

    // Only owner can update
    if (material.uploadedBy !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update allowed fields
    const allowedUpdates = [
      "title",
      "description",
      "category",
      "type",
      "topic",
      "week",
      "tags",
    ];
    allowedUpdates.forEach((field) => {
      if (data[field] !== undefined) {
        material[field] = data[field];
      }
    });

    await material.save();

    return NextResponse.json({ success: true, material });
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json(
      { error: "Failed to update material" },
      { status: 500 },
    );
  }
}

// DELETE - Delete material and its embeddings
export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const material = await Material.findById(id);

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 },
      );
    }

    // Only owner can delete
    if (material.uploadedBy !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete file from Cloudinary if exists
    if (material.filePath) {
      try {
        // Determine resource type
        const resourceType =
          material.type === "lecture" ||
          material.type === "pdf" ||
          material.type === "notes"
            ? "raw"
            : "auto";

        await deleteFromCloudinary(material.filePath, resourceType);
      } catch (e) {
        console.warn("Could not delete cloud file:", e);
      }
    }

    // Delete embeddings
    await deleteEmbeddings(material._id);

    // Delete material
    await Material.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: "Failed to delete material" },
      { status: 500 },
    );
  }
}
