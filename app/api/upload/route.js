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

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!file || !title || !course || !category || !topic || !week) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const fileExtension = path.extname(file.name);
    const publicId = `course_materials/${course}/${uuidv4()}`;
    
    const cloudinaryResult = await uploadToCloudinary(buffer, {
      publicId,
      folder: 'course_materials',
      resourceType: 'auto',
    });

    const fileUrl = cloudinaryResult.secure_url;

    // For text parsing, we need a temporary local file
    const tempDir = path.join(process.cwd(), "temp");
    await mkdir(tempDir, { recursive: true });
    const tempFilePath = path.join(tempDir, `${uuidv4()}${fileExtension}`);
    await writeFile(tempFilePath, buffer);

    // Parse file content
    const content = await parseFile(tempFilePath, file.type);

    // Clean up temp file
    try {
      const fs = await import('fs/promises');
      await fs.unlink(tempFilePath);
    } catch (cleanupError) {
      console.warn('Temp file cleanup failed:', cleanupError);
    }

    await connect();

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

    return NextResponse.json({ data: material }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
