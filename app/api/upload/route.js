import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import connectDB from "@/lib/mongodb/mongoose";
import Material from "@/lib/models/Material";
import { parseFile, getFileType, getMimeType } from "@/lib/parsers/fileParser";
import { createEmbeddings } from "@/lib/ai/rag";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";

// Temporary upload directory
const TEMP_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "temp");

// Ensure temp upload directory exists
async function ensureTempUploadDir() {
  await mkdir(TEMP_UPLOAD_DIR, { recursive: true });
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    await ensureTempUploadDir();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get metadata from form
    const title = formData.get("title") || file.name;
    const description = formData.get("description") || "";
    const category = formData.get("category") || "theory";
    const topic = formData.get("topic") || "General";
    const week = parseInt(formData.get("week")) || 1;
    const tags = formData.get("tags")
      ? formData
          .get("tags")
          .split(",")
          .map((t) => t.trim())
      : [];

    // Generate unique filename for temp storage
    const extension = path.extname(file.name);
    const uniqueFilename = `${uuidv4()}${extension}`;
    const tempFilePath = path.join(TEMP_UPLOAD_DIR, uniqueFilename);

    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Save file to disk temporarily for parsing
    await writeFile(tempFilePath, buffer);

    // 2. Parse file content for RAG
    const mimeType = getMimeType(file.name);
    const fileType = getFileType(file.name);
    let content = "";

    try {
      content = await parseFile(tempFilePath, mimeType);
    } catch (parseError) {
      console.error("Error parsing file:", parseError);
    }

    // 3. Upload to Cloudinary
    let fileUrl = "";
    let publicId = "";

    try {
      // Determine resource type for Cloudinary
      const resourceType =
        fileType === "lecture" || fileType === "pdf" || fileType === "notes"
          ? "raw"
          : "auto";

      const uploadResult = await uploadToCloudinary(
        buffer,
        "skooly/materials",
        resourceType,
      );
      fileUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      // Clean up temp file before returning error
      try {
        await unlink(tempFilePath);
      } catch (e) {}
      return NextResponse.json(
        { error: "Failed to upload to cloud storage" },
        { status: 500 },
      );
    }

    // 4. Create material document
    const material = await Material.create({
      title,
      description,
      category,
      type: fileType,
      topic,
      week,
      tags,
      filePath: publicId, // Store public_id in filePath
      fileUrl: fileUrl, // Store secure_url in fileUrl
      mimeType,
      content,
      uploadedBy: userId,
    });

    // 5. Generate embeddings in background
    if (content) {
      // We don't await this to keep the response fast
      createEmbeddings(material._id, content, {
        title,
        category,
        topic,
        type: fileType,
        week,
      })
        .then((count) => {
          console.log(
            `Created ${count} embeddings for material ${material._id}`,
          );
        })
        .catch((err) => {
          console.error("Error creating embeddings:", err);
        });
    }

    // 6. Clean up temporary local file
    try {
      await unlink(tempFilePath);
    } catch (unlinkError) {
      console.warn("Could not delete temp file:", unlinkError);
    }

    return NextResponse.json({
      success: true,
      material: {
        id: material._id,
        title: material.title,
        category: material.category,
        type: material.type,
        topic: material.topic,
        week: material.week,
        fileUrl: material.fileUrl,
      },
    });
  } catch (error) {
    console.error("Upload process error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 },
    );
  }
}
