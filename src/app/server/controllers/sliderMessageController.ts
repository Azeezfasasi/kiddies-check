import SliderMessage from "../models/SliderMessage";
import { connectDB } from "../../server/db/connect";
import mongoose from "mongoose";

// GET all messages (admin)
export async function getAllSliderMessages() {
  await connectDB();
  const messages = await SliderMessage.find().sort({ order: 1, createdAt: -1 });
  return messages;
}

// GET active messages (public)
export async function getActiveSliderMessages() {
  await connectDB();
  const messages = await SliderMessage.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
  return messages;
}

// CREATE new message
export async function createSliderMessage(data) {
  await connectDB();

  // Get max order
  const maxOrderDoc = await SliderMessage.findOne().sort({ order: -1 });
  const maxOrder = maxOrderDoc ? maxOrderDoc.order : 0;

  const newMessage = await SliderMessage.create({
    ...data,
    order: data.order !== undefined ? data.order : maxOrder + 1,
  });

  return newMessage;
}

// UPDATE message
export async function updateSliderMessage(id, data) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid message ID");
  }

  const updated = await SliderMessage.findByIdAndUpdate(
    id,
    { ...data, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new Error("Message not found");
  }

  return updated;
}

// DELETE message
export async function deleteSliderMessage(id) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid message ID");
  }

  const deleted = await SliderMessage.findByIdAndDelete(id);

  if (!deleted) {
    throw new Error("Message not found");
  }

  // Reorder remaining messages
  const remaining = await SliderMessage.find().sort({ order: 1 });
  for (let i = 0; i < remaining.length; i++) {
    remaining[i].order = i;
    await remaining[i].save();
  }

  return { success: true, message: "Message deleted successfully" };
}

// REORDER messages
export async function reorderSliderMessages(messageIds) {
  await connectDB();

  for (let i = 0; i < messageIds.length; i++) {
    await SliderMessage.findByIdAndUpdate(messageIds[i], { order: i });
  }

  const messages = await SliderMessage.find().sort({ order: 1 });
  return messages;
}

