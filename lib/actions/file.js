"use server";

import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import File from "../models/fileModel";
import Project from "../models/projectModel";
import { connect } from "../mongodb/mongoose";

// Helper to verify project ownership
const verifyProjectAccess = async (projectId, userId) => {
  const project = await Project.findOne({ _id: projectId, ownerId: userId });
  return !!project;
};

export const getFiles = cache(async (projectId) => {
  const { userId } = await auth();
  if (!userId) return [];

  await connect();
  const hasAccess = await verifyProjectAccess(projectId, userId);
  if (!hasAccess) return [];

  const files = await File.find({ projectId }).sort({ name: 1 }).lean();
  return JSON.parse(JSON.stringify(files));
});

export const getFile = cache(async (fileId) => {
  const { userId } = await auth();
  if (!userId) return null;

  await connect();
  const file = await File.findById(fileId).populate('projectId').lean();
  
  if (!file || file.projectId.ownerId !== userId) {
    return null;
  }

  return JSON.parse(JSON.stringify(file));
});

export const createFile = async (projectId, name, type = "text") => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connect();
  const hasAccess = await verifyProjectAccess(projectId, userId);
  if (!hasAccess) throw new Error("Unauthorized access to project");

  const file = await File.create({
    projectId,
    name,
    type,
    content: "",
  });

  // Touch project updated time
  await Project.findByIdAndUpdate(projectId, { updatedAt: Date.now() });

  return JSON.parse(JSON.stringify(file));
};

export const updateFile = async (fileId, content) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connect();
  // Find file and populate project to check owner
  const file = await File.findById(fileId).populate('projectId');
  
  if (!file || file.projectId.ownerId !== userId) {
    throw new Error("Unauthorized or file not found");
  }

  file.content = content;
  file.updatedAt = Date.now();
  await file.save();

  return JSON.parse(JSON.stringify(file));
};

export const deleteFile = async (fileId) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connect();
  const file = await File.findById(fileId).populate('projectId');
  
  if (!file || file.projectId.ownerId !== userId) {
    throw new Error("Unauthorized or file not found");
  }

  await File.findByIdAndDelete(fileId);
  return { success: true };
};
