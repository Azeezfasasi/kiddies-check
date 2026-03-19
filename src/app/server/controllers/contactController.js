import Contact from "../models/Contact";
import User from "../models/User";
import { connectDB } from "../db/connect";
import { NextResponse } from "next/server";

// 1. Create contact form submission
export const createContact = async (req) => {
  try {
    await connectDB();
    const body = await req.json();
    const contact = new Contact({ ...body });
    await contact.save();
    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// 2. Get all contact forms (admin only)
export const getAllContacts = async (req) => {
  try {
    await connectDB();
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, contacts }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// 3. Delete contact form
export const deleteContact = async (req, contactId) => {
  try {
    await connectDB();
    const contact = await Contact.findByIdAndDelete(contactId);
    if (!contact) return NextResponse.json({ success: false, message: "Contact not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Contact deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// 4. Reply to contact form
export const replyToContact = async (req, contactId) => {
  try {
    await connectDB();
    const body = await req.json();
    const { message, senderId } = body;
    const sender = await User.findById(senderId);
    if (!sender) {
      return NextResponse.json({ success: false, message: "Sender not found" }, { status: 400 });
    }
    const contact = await Contact.findById(contactId);
    if (!contact) return NextResponse.json({ success: false, message: "Contact not found" }, { status: 404 });
    contact.replies.push({ sender: senderId, senderName: sender.firstName + ' ' + sender.lastName, message });
    contact.status = "replied";
    await contact.save();
    return NextResponse.json({ success: true, contact }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};

// 5. Get single contact form (admin)
export const getContactById = async (req, contactId) => {
  try {
    await connectDB();
    const contact = await Contact.findById(contactId);
    if (!contact) return NextResponse.json({ success: false, message: "Contact not found" }, { status: 404 });
    return NextResponse.json({ success: true, contact }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};
