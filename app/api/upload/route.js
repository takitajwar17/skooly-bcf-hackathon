import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { connect } from "@/lib/mongodb/mongoose";
import Material from "@/lib/models/Material";
import { parseFile } from "@/lib/parsers/fileParser";
import { isAdmin } from "@/lib/actions/user";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { createEmbeddings } from "@/lib/ai/rag";

export async function POST(request) {
  console.log("=== UPLOAD API CALLED ===");
  try {
    console.log("1. Checking auth...");
    const { userId } = await auth();
    console.log("   userId:", userId);
    
    const adminCheck = await isAdmin();
    console.log("   isAdmin:", adminCheck);
    
    if (!userId || !adminCheck) {
      console.log("   UNAUTHORIZED - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("2. Parsing form data...");
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const course = formData.get("course");
    const description = formData.get("description");
    const category = formData.get("category");
    const type = formData.get("type");
    const topic = formData.get("topic");
    const week = formData.get("week");
    const tagsString = formData.get("tags");
    const tags = tagsString ? tagsString.split(",").map(tag => tag.trim()) : [];

    console.log("   Form data received:", { title, course, category, type, topic, week, fileName: file?.name, fileSize: file?.size });

    if (!file || !title || !course || !category || !topic || !week) {
      console.log("   MISSING FIELDS - returning 400");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("3. Converting file to buffer...");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log("   Buffer size:", buffer.length);

    // Upload to Cloudinary
    console.log("4. Uploading to Cloudinary...");
    const fileExtension = path.extname(file.name);
    const publicId = `course_materials/${course}/${uuidv4()}`;
    
    const cloudinaryResult = await uploadToCloudinary(buffer, {
      publicId,
      folder: 'course_materials',
      resourceType: 'auto',
    });
    console.log("   Cloudinary result:", { secure_url: cloudinaryResult.secure_url, public_id: cloudinaryResult.public_id });

    const fileUrl = cloudinaryResult.secure_url;

    // For text parsing, we need a temporary local file
    console.log("5. Writing temp file for parsing...");
    const tempDir = path.join(process.cwd(), "temp");
    await mkdir(tempDir, { recursive: true });
    const tempFilePath = path.join(tempDir, `${uuidv4()}${fileExtension}`);
    await writeFile(tempFilePath, buffer);
    console.log("   Temp file written:", tempFilePath);

    // Parse file content
    console.log("6. Parsing file content...");
    const content = await parseFile(tempFilePath, file.type);
    console.log("   Content parsed, length:", content?.length || 0);

    // Clean up temp file
    try {
      const fs = await import('fs/promises');
      await fs.unlink(tempFilePath);
      console.log("   Temp file cleaned up");
    } catch (cleanupError) {
      console.warn('Temp file cleanup failed:', cleanupError);
    }

    console.log("7. Connecting to MongoDB...");
    await connect();
    console.log("   MongoDB connected");

    console.log("8. Creating material document...");
    const material = await Material.create({
      title,
      course,
      description,
      category,
      type,
      topic,
      week: parseInt(week),
      tags,
      fileUrl,
      cloudinaryPublicId: cloudinaryResult.public_id,
      content,
      uploadedBy: userId,
    });
    console.log("   Material created:", material._id);

    // 9. Create embeddings for semantic search
    console.log("9. Creating embeddings for semantic search...");
    if (content && content.length > 0) {
      try {
        const embeddingCount = await createEmbeddings(
          material._id,
          content,
          {
            title,
            category,
            topic,
            type,
            week: parseInt(week),
          }
        );
        console.log(`   ✓ Created ${embeddingCount} embedding chunks for vector search`);
      } catch (embeddingError) {
        console.error("   ✗ Embedding creation failed:", embeddingError);
        // Don't fail the upload if embeddings fail - material is still saved
      }
    } else {
      console.log("   ⚠ No content to embed (file might be empty or parsing failed)");
    }

    console.log("=== UPLOAD SUCCESS ===");
    return NextResponse.json({ data: material }, { status: 201 });
  } catch (error) {
    console.error("=== UPLOAD ERROR ===");
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
