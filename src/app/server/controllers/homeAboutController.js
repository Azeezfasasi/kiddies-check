import HomeAbout from "../models/HomeAbout";
import { connectDB } from "../../server/db/connect";
import mongoose from "mongoose";

// GET HomeAbout content
export async function getHomeAbout() {
  await connectDB();
  let homeAbout = await HomeAbout.findOne();
  
  // Initialize with default content if doesn't exist
  if (!homeAbout) {
    homeAbout = await HomeAbout.create({
      title: "About Kiddies Check",
      paragraphs: [
        {
          _id: new mongoose.Types.ObjectId(),
          text: "Kiddies Check is a leading educational technology company dedicated to providing innovative solutions for schools and educational institutions. With a strong focus on child safety, we offer a comprehensive platform that enables schools to manage student information, track attendance, communicate with parents, and ensure a secure learning environment.",
          order: 0,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          text: "Founded in 2020, Kiddies Check has quickly established itself as a trusted partner for schools across the globe. Our team of experienced professionals is committed to delivering high-quality products and exceptional customer service, helping schools enhance their operations and create a safe and nurturing environment for students.",
          order: 1,
        }
      ],
      image: {
        url: "/images/telecom2.jpeg",
        alt: "Kiddies Check Team",
      },
      ctaButton: {
        label: "Learn More",
        href: "/about-us",
      },
    });
  }
  
  return homeAbout;
}

// UPDATE HomeAbout content
export async function updateHomeAbout(data) {
  await connectDB();
  
  let homeAbout = await HomeAbout.findOne();
  
  if (!homeAbout) {
    homeAbout = await HomeAbout.create(data);
  } else {
    homeAbout.title = data.title || homeAbout.title;
    homeAbout.image = data.image || homeAbout.image;
    homeAbout.ctaButton = data.ctaButton || homeAbout.ctaButton;
    homeAbout.updatedAt = new Date();
    
    if (data.paragraphs) {
      homeAbout.paragraphs = data.paragraphs;
    }
    
    await homeAbout.save();
  }
  
  return homeAbout;
}

// ADD paragraph
export async function addParagraph(paragraphText) {
  await connectDB();
  
  let homeAbout = await HomeAbout.findOne();
  
  if (!homeAbout) {
    homeAbout = await HomeAbout.create({ title: "About Us", paragraphs: [] });
  }
  
  const newParagraph = {
    _id: new mongoose.Types.ObjectId(),
    text: paragraphText,
    order: homeAbout.paragraphs.length,
  };
  
  homeAbout.paragraphs.push(newParagraph);
  homeAbout.updatedAt = new Date();
  await homeAbout.save();
  
  return newParagraph;
}

// UPDATE paragraph
export async function updateParagraph(paragraphId, paragraphText) {
  await connectDB();
  
  let homeAbout = await HomeAbout.findOne();
  
  if (!homeAbout) {
    throw new Error("Home About document not found");
  }
  
  const paragraph = homeAbout.paragraphs.find(
    (p) => p._id.toString() === paragraphId
  );
  
  if (!paragraph) {
    throw new Error("Paragraph not found");
  }
  
  paragraph.text = paragraphText;
  homeAbout.updatedAt = new Date();
  await homeAbout.save();
  
  return paragraph;
}

// DELETE paragraph
export async function deleteParagraph(paragraphId) {
  await connectDB();
  
  let homeAbout = await HomeAbout.findOne();
  
  if (!homeAbout) {
    throw new Error("Home About document not found");
  }
  
  homeAbout.paragraphs = homeAbout.paragraphs.filter(
    (p) => p._id.toString() !== paragraphId
  );
  
  // Reorder remaining paragraphs
  homeAbout.paragraphs.forEach((para, index) => {
    para.order = index;
  });
  
  homeAbout.updatedAt = new Date();
  await homeAbout.save();
  
  return { success: true, message: "Paragraph deleted successfully" };
}
