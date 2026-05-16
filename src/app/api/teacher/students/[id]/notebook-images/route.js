import Student from "@/app/server/models/Student";
import { connectDB } from "@/utils/db";
import { uploadToCloudinary } from "@/app/server/utils/cloudinaryService";
import { deleteFromCloudinary } from "@/app/server/utils/cloudinaryService";
import mongoose from "mongoose";

// GET notebook images for a student
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { message: "Invalid student ID" },
        { status: 400 }
      );
    }

    const student = await Student.findById(id)
      .select("notebookImages")
      .populate("notebookImages.uploadedBy", "firstName lastName");

    if (!student) {
      return Response.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      notebookImages: student.notebookImages || [],
    });
  } catch (error) {
    console.error("Error fetching notebook images:", error);
    return Response.json(
      { message: "Failed to fetch notebook images", error: error.message },
      { status: 500 }
    );
  }
}

// POST upload notebook images
export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const userId = req.headers.get("x-user-id");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { message: "Invalid student ID" },
        { status: 400 }
      );
    }

    if (!userId) {
      return Response.json(
        { message: "User ID is required" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files");
    const captions = formData.getAll("captions");

    if (!files || files.length === 0) {
      return Response.json(
        { message: "No files provided" },
        { status: 400 }
      );
    }

    const student = await Student.findById(id);
    if (!student) {
      return Response.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    const uploadedImages = [];

    // Upload each file to Cloudinary
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const caption = captions[i] || "";

      try {
        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const result = await uploadToCloudinary(buffer, "student-notebooks");

        const imageDoc = {
          _id: new mongoose.Types.ObjectId(),
          url: result.url,
          publicId: result.publicId,
          caption: caption,
          uploadedAt: new Date(),
          uploadedBy: new mongoose.Types.ObjectId(userId),
        };

        uploadedImages.push(imageDoc);
        student.notebookImages.push(imageDoc);
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
        throw error;
      }
    }

    await student.save();

    return Response.json({
      success: true,
      message: `${uploadedImages.length} notebook image(s) uploaded successfully`,
      uploadedImages: uploadedImages,
    });
  } catch (error) {
    console.error("Error uploading notebook images:", error);
    return Response.json(
      { message: "Failed to upload notebook images", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE notebook image
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { imageId } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { message: "Invalid student ID" },
        { status: 400 }
      );
    }

    const student = await Student.findById(id);
    if (!student) {
      return Response.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    const imageIndex = student.notebookImages.findIndex(
      (img) => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      return Response.json(
        { message: "Image not found" },
        { status: 404 }
      );
    }

    const image = student.notebookImages[imageIndex];

    // Delete from Cloudinary
    if (image.publicId) {
      try {
        await deleteFromCloudinary(image.publicId);
      } catch (error) {
        console.error("Failed to delete from Cloudinary:", error);
        // Continue anyway, remove from DB
      }
    }

    // Remove from array
    student.notebookImages.splice(imageIndex, 1);
    await student.save();

    return Response.json({
      success: true,
      message: "Notebook image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notebook image:", error);
    return Response.json(
      { message: "Failed to delete notebook image", error: error.message },
      { status: 500 }
    );
  }
}
