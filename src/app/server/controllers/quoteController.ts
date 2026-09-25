import Quote from "../models/Quote";
import { connectDB } from "../db/connect";
import User from "../models/User";
import { NextResponse } from "next/server";

// 1. Create quote request
export const createQuote = async (req) => {
  try {
    await connectDB();
    const body = await req.json();
    const quote = new Quote({ ...body });
    await quote.save();
    return NextResponse.json({ success: true, quote }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// 2. Get all quote requests (admin/learning-specialist only)
export const getAllQuotes = async (req) => {
  try {
    await connectDB();
    const quotes = await Quote.find().populate("assignedTo").sort({ createdAt: -1 });
    return NextResponse.json({ success: true, quotes }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// 3. Edit quote request
export const updateQuote = async (req, quoteId) => {
  try {
    await connectDB();
    const body = await req.json();
    const quote = await Quote.findByIdAndUpdate(quoteId, body, { new: true });
    if (!quote) return NextResponse.json({ success: false, message: "Quote not found" }, { status: 404 });
    return NextResponse.json({ success: true, quote }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// 4. Delete quote request
export const deleteQuote = async (req, quoteId) => {
  try {
    await connectDB();
    const quote = await Quote.findByIdAndDelete(quoteId);
    if (!quote) return NextResponse.json({ success: false, message: "Quote not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Quote deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// 5. Change quote request status
export const changeQuoteStatus = async (req, quoteId) => {
  try {
    await connectDB();
    const body = await req.json();
    const { status } = body;
    const quote = await Quote.findById(quoteId);
    if (!quote) return NextResponse.json({ success: false, message: "Quote not found" }, { status: 404 });
    quote.status = status;
    await quote.save();
    return NextResponse.json({ success: true, quote }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// 6. Reply to quote request
export const replyToQuote = async (req, quoteId) => {
  try {
    await connectDB();
    const body = await req.json();
    const { message, senderId, senderName } = body;
    // Validate senderId exists and is admin or learning-specialist
    const sender = await User.findById(senderId);
    if (!sender) {
      return NextResponse.json({ success: false, message: "Sender not found" }, { status: 400 });
    }
    if (sender.role !== 'admin' && sender.role !== 'learning-specialist') {
      return NextResponse.json({ success: false, message: "Sender is not authorized to reply (must be admin or learning-specialist)" }, { status: 403 });
    }
    const quote = await Quote.findById(quoteId);
    if (!quote) return NextResponse.json({ success: false, message: "Quote not found" }, { status: 404 });
    quote.replies.push({ sender: senderId, senderName: sender.firstName + ' ' + sender.lastName, message });
    quote.status = "replied";
    await quote.save();
    return NextResponse.json({ success: true, quote }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// 7. Assign quote request to admin/learning-specialist
export const assignQuote = async (req, quoteId) => {
  try {
    await connectDB();
    const body = await req.json();
    const { assignedTo } = body;
    const quote = await Quote.findById(quoteId);
    if (!quote) return NextResponse.json({ success: false, message: "Quote not found" }, { status: 404 });
    quote.assignedTo = assignedTo;
    await quote.save();
    return NextResponse.json({ success: true, quote }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};
