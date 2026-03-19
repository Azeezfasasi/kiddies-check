import Hero from "../models/Hero";
import { connectDB } from "../../server/db/connect";
import mongoose from "mongoose";

// GET all hero slides
export async function getHeroSlides() {
  await connectDB();
  let heroDoc = await Hero.findOne();
  
  // Initialize if doesn't exist
  if (!heroDoc) {
    heroDoc = await Hero.create({ slides: [] });
  }
  
  return heroDoc.slides || [];
}

// CREATE new hero slide
export async function createHeroSlide(slideData) {
  await connectDB();
  
  const newSlide = {
    _id: new mongoose.Types.ObjectId(),
    ...slideData,
  };

  let heroDoc = await Hero.findOne();
  
  if (!heroDoc) {
    heroDoc = await Hero.create({ slides: [newSlide] });
  } else {
    // Get the max order and set new order
    const maxOrder = heroDoc.slides.length > 0 
      ? Math.max(...heroDoc.slides.map(s => s.order || 0))
      : 0;
    
    newSlide.order = maxOrder + 1;
    heroDoc.slides.push(newSlide);
    await heroDoc.save();
  }
  
  return newSlide;
}

// UPDATE hero slide
export async function updateHeroSlide(slideId, slideData) {
  await connectDB();
  
  let heroDoc = await Hero.findOne();
  
  if (!heroDoc) {
    throw new Error("Hero document not found");
  }

  const slideIndex = heroDoc.slides.findIndex(
    (s) => s._id.toString() === slideId
  );

  if (slideIndex === -1) {
    throw new Error("Slide not found");
  }

  // Update slide data
  heroDoc.slides[slideIndex] = {
    ...heroDoc.slides[slideIndex],
    ...slideData,
    _id: heroDoc.slides[slideIndex]._id, // Keep original ID
  };

  heroDoc.updatedAt = Date.now();
  await heroDoc.save();

  return heroDoc.slides[slideIndex];
}

// DELETE hero slide
export async function deleteHeroSlide(slideId) {
  await connectDB();
  
  let heroDoc = await Hero.findOne();
  
  if (!heroDoc) {
    throw new Error("Hero document not found");
  }

  heroDoc.slides = heroDoc.slides.filter(
    (s) => s._id.toString() !== slideId
  );

  // Reorder remaining slides
  heroDoc.slides.forEach((slide, index) => {
    slide.order = index;
  });

  heroDoc.updatedAt = Date.now();
  await heroDoc.save();

  return { success: true, message: "Slide deleted successfully" };
}

// REORDER slides
export async function reorderHeroSlides(slideIds) {
  await connectDB();
  
  let heroDoc = await Hero.findOne();
  
  if (!heroDoc) {
    throw new Error("Hero document not found");
  }

  // Reorder based on provided order
  const reorderedSlides = slideIds.map((id, index) => {
    const slide = heroDoc.slides.find((s) => s._id.toString() === id);
    if (slide) {
      slide.order = index;
    }
    return slide;
  }).filter(Boolean);

  heroDoc.slides = reorderedSlides;
  heroDoc.updatedAt = Date.now();
  await heroDoc.save();

  return heroDoc.slides;
}

// GET Hero content (for backward compatibility)
export async function getHeroContent() {
  await connectDB();
  const hero = await Hero.findOne();
  return hero;
}

// UPDATE Hero content (for backward compatibility)
export async function updateHeroContent(data) {
  await connectDB();
  const updatedHero = await Hero.findOneAndUpdate({}, data, {
    new: true,
    upsert: true,
  });
  return updatedHero;
}
