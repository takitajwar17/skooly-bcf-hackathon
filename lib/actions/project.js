"use server";

import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import Project from "../models/projectModel";
import { connect } from "../mongodb/mongoose";

export const getProjects = cache(async () => {
  const { userId } = await auth();
  if (!userId) return [];

  await connect();
  const projects = await Project.find({ ownerId: userId }).sort({ updatedAt: -1 }).lean();
  return JSON.parse(JSON.stringify(projects));
});

export const getProject = cache(async (projectId) => {
  const { userId } = await auth();
  if (!userId) return null;

  await connect();
  const project = await Project.findOne({ _id: projectId, ownerId: userId }).lean();
  return project ? JSON.parse(JSON.stringify(project)) : null;
});

export const createProject = async (title, description) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connect();
  const project = await Project.create({
    title,
    description,
    ownerId: userId,
  });

  return JSON.parse(JSON.stringify(project));
};

export const deleteProject = async (projectId) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connect();
  const result = await Project.findOneAndDelete({ _id: projectId, ownerId: userId });
  return result ? JSON.parse(JSON.stringify(result)) : null;
};
