import Project from "../models/Project";
import { connectDB } from "../db/connect";
import { NextResponse } from "next/server";
import { uploadToCloudinary } from "../utils/cloudinary";

// Create a new project (with Cloudinary image upload)
export const createProject = async (req) => {
  try {
    await connectDB();
    const formData = await req.formData();
    const fields = JSON.parse(formData.get("fields"));
    let featuredImageUrl = "";
    let galleryUrls = [];

    // Handle featured image
    if (formData.get("featuredImage")) {
      const file = formData.get("featuredImage");
      featuredImageUrl = await uploadToCloudinary(file, "projects/featured");
    }

    // Handle gallery images (multiple)
    if (formData.getAll("galleryImages").length > 0) {
      const files = formData.getAll("galleryImages");
      for (const file of files) {
        const url = await uploadToCloudinary(file, "projects/gallery");
        galleryUrls.push(url);
      }
    }

    const project = new Project({
      ...fields,
      featuredImage: featuredImageUrl,
      galleryImages: galleryUrls,
    });
    await project.save();
    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// Edit project by admin
export const editProject = async (req, projectId) => {
  try {
    await connectDB();
    const formData = await req.formData();
    const fields = JSON.parse(formData.get("fields"));
    let update = { ...fields, updatedAt: new Date() };

    // Optionally update images
    if (formData.get("featuredImage")) {
      const file = formData.get("featuredImage");
      update.featuredImage = await uploadToCloudinary(file, "projects/featured");
    }
    
    // Handle gallery images - merge with existing if not completely replacing
    const newGalleryFiles = formData.getAll("galleryImages");
    const existingGalleryImages = fields.existingGalleryImages || [];
    
    if (newGalleryFiles.length > 0 || existingGalleryImages.length > 0) {
      update.galleryImages = [...existingGalleryImages];
      for (const file of newGalleryFiles) {
        const url = await uploadToCloudinary(file, "projects/gallery");
        update.galleryImages.push(url);
      }
    }
    
    // Remove existingGalleryImages from update as it's not a database field
    delete update.existingGalleryImages;

    const project = await Project.findByIdAndUpdate(projectId, update, { new: true });
    if (!project) return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    return NextResponse.json({ success: true, project }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// Delete project by admin
export const deleteProject = async (req, projectId) => {
  try {
    await connectDB();
    const project = await Project.findByIdAndDelete(projectId);
    if (!project) return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Project deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// View all projects
export const getAllProjects = async (req) => {
  try {
    await connectDB();
    const projects = await Project.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, projects }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// Get single project
export const getProjectById = async (req, projectId) => {
  try {
    await connectDB();
    const project = await Project.findById(projectId);
    if (!project) return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    return NextResponse.json({ success: true, project }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// Change project status
export const changeProjectStatus = async (req, projectId) => {
  try {
    await connectDB();
    const { status } = await req.json();
    const project = await Project.findByIdAndUpdate(projectId, { projectStatus: status, updatedAt: new Date() }, { new: true });
    if (!project) return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    return NextResponse.json({ success: true, project }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// Disable project
export const disableProject = async (req, projectId) => {
  try {
    await connectDB();
    const project = await Project.findByIdAndUpdate(projectId, { isDisabled: true, projectStatus: "disabled", updatedAt: new Date() }, { new: true });
    if (!project) return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    return NextResponse.json({ success: true, project }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// Enable project controller
export const enableProject = async (req, projectId) => {
  try {
    await connectDB();
    const project = await Project.findByIdAndUpdate(projectId, { isDisabled: false, projectStatus: "active", updatedAt: new Date() }, { new: true });
    if (!project) return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    return NextResponse.json({ success: true, project }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};