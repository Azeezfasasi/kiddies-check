import ExamQuestion from "@/app/server/models/ExamQuestion";
import { deleteFromCloudinary } from "@/app/server/utils/cloudinaryService";

// Question diagrams are uploaded to this Cloudinary folder by the exam form.
const EXAM_IMAGE_FOLDER = "rayob/exam-questions/";

// Keep only a diagram that was uploaded to the exam-questions folder.
export function questionImageFields(q) {
  const imageUrl = typeof q.imageUrl === "string" && q.imageUrl.startsWith("https://") ? q.imageUrl : null;
  const imagePublicId =
    imageUrl && typeof q.imagePublicId === "string" && q.imagePublicId.startsWith(EXAM_IMAGE_FOLDER)
      ? q.imagePublicId
      : null;
  return { imageUrl, imagePublicId };
}

// Delete diagrams from Cloudinary that no exam question references any more.
// Failures are logged rather than thrown so they never block saving an exam.
export async function deleteUnusedExamImages(publicIds: (string | null | undefined)[]) {
  const candidates = [...new Set(publicIds.filter((id): id is string => Boolean(id)))];

  for (const publicId of candidates) {
    try {
      if (await ExamQuestion.exists({ imagePublicId: publicId })) continue;
      await deleteFromCloudinary(publicId);
    } catch (error) {
      console.error("[Exam image cleanup error]", publicId, error);
    }
  }
}
