import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
	sender: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	senderName: String,
	message: String,
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

const contactSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true },
	subject: { type: String, required: true },
	message: { type: String, required: true },
	status: {
		type: String,
		enum: ["pending", "replied", "closed"],
		default: "pending",
	},
	replies: [replySchema],
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

export default mongoose.models.Contact || mongoose.model("Contact", contactSchema);
