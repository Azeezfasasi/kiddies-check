import WhyRayob from "../models/WhyRayob";
import { connectDB } from "../../server/db/connect";
import mongoose from "mongoose";

// GET all why rayob content
export async function getWhyRayobContent() {
  await connectDB();
  let content = await WhyRayob.findOne();

  // Initialize if doesn't exist
  if (!content) {
    const defaultReasons = [
      {
        id: 1,
        title: "Multidisciplinary Expertise in Education, Project Management, and Technology",
        description:
          "Kiddies Check has a diverse team in educational technology, curriculum development, and project management. This multidisciplinary expertise allows us to understand the unique challenges of educational projects and deliver comprehensive solutions that address both technical and pedagogical needs.",
        icon: "Zap",
        order: 1,
      },
      {
        id: 2,
        title: "Proven Track Record of Successful Project Execution",
        description:
          "Kiddies Check has a strong history of successfully delivering educational technology projects for schools and institutions. Our portfolio includes a wide range of projects, from small-scale implementations to large, complex deployments, demonstrating our ability to consistently meet client expectations and achieve desired outcomes.",
        icon: "Target",
        order: 2,
      },
      {
        id: 3,
        title: "Rigorous Project Management Methodology",
        description:
          "Kiddies Check employs a structured project management approach that emphasizes clear communication, detailed planning, risk management, and continuous monitoring. This methodology ensures that projects are delivered on time, within budget, and to the highest quality standards.",
        icon: "Briefcase",
        order: 3,
      },
      {
        id: 4,
        title: "Commitment to Quality and Safety",
        description:
          "Kiddies Check prioritizes quality and safety in all aspects of our work. We adhere to strict quality assurance processes and industry best practices to ensure that our solutions are reliable, secure, and effective in creating safe learning environments for students.",
        icon: "Shield",
        order: 4,
      },
      {
        id: 5,
        title: "Client-Centric Approach with Tailored Solutions",
        description:
          "Kiddies Check takes a client-centric approach, working closely with schools to understand their specific needs and challenges. We provide customized solutions that are tailored to the unique requirements of each project, ensuring that our services deliver maximum value and impact for our clients.",
        icon: "Users",
        order: 5,
      },
      {
        id: 6,
        title: "Experienced and Skilled Project Teams",
        description:
          "Kiddies Check has a team of experienced professionals with deep expertise in educational technology and project management. Our team members are highly skilled in their respective fields, enabling us to deliver innovative solutions and effectively manage complex projects from inception to completion.",
        icon: "CheckCircle",
        order: 6,
      },
      {
        id: 7,
        title: "Strong Culture of Integrity and Accountability",
        description:
          "Kiddies Check operates with a strong culture of integrity, professionalism, and accountability. Clients can rely on honest communication, dependable delivery, and ethical business practices, making Kiddies Check not just a contractor, but a trusted long-term project partner.",
        icon: "Handshake",
        order: 7,
      },
    ];

    content = await WhyRayob.create({
      heading: "Why Choose Kiddies Check?",
      subheading: "",
      reasons: defaultReasons,
      ctaHeading: "Ready to Partner With Us?",
      ctaDescription: "Contact Kiddies Check today to discuss your project needs and discover how we can help you achieve your goals with our innovative solutions and expert project management.",
      ctaButton1: { label: "Contact Us Today", href: "/contact-us" },
      ctaButton2: { label: "Learn More", href: "#" },
    });
  }

  return content;
}

// UPDATE heading and subheading
export async function updateWhyRayobHeading(data) {
  await connectDB();

  let content = await WhyRayob.findOne();
  if (!content) {
    content = await WhyRayob.create(data);
  } else {
    if (data.heading) content.heading = data.heading;
    if (data.subheading) content.subheading = data.subheading;
    await content.save();
  }

  return content;
}

// CREATE new reason
export async function createReason(reasonData) {
  await connectDB();

  const newReason = {
    _id: new mongoose.Types.ObjectId(),
    ...reasonData,
  };

  let content = await WhyRayob.findOne();
  if (!content) {
    content = await WhyRayob.create({ reasons: [newReason] });
  } else {
    const nextId = Math.max(...content.reasons.map((r) => r.id || 0), 0) + 1;
    const maxOrder =
      content.reasons.length > 0
        ? Math.max(...content.reasons.map((r) => r.order || 0))
        : 0;

    newReason.id = nextId;
    newReason.order = maxOrder + 1;
    content.reasons.push(newReason);
    await content.save();
  }

  return newReason;
}

// UPDATE reason
export async function updateReason(reasonId, reasonData) {
  await connectDB();

  const content = await WhyRayob.findOne();
  if (!content) {
    throw new Error("WhyKiddiesCheck content not found");
  }

  const reason = content.reasons.id(reasonId);
  if (!reason) {
    throw new Error("Reason not found");
  }

  if (reasonData.title) reason.title = reasonData.title;
  if (reasonData.description) reason.description = reasonData.description;
  if (reasonData.icon) reason.icon = reasonData.icon;

  await content.save();
  return reason;
}

// DELETE reason
export async function deleteReason(reasonId) {
  await connectDB();

  const content = await WhyRayob.findOne();
  if (!content) {
    throw new Error("WhyKiddiesCheck content not found");
  }

  content.reasons.id(reasonId).deleteOne();
  await content.save();

  return { success: true };
}

// REORDER reasons
export async function reorderReasons(reorderedReasons) {
  await connectDB();

  const content = await WhyRayob.findOne();
  if (!content) {
    throw new Error("WhyKiddiesCheck content not found");
  }

  // Update order for each reason
  reorderedReasons.forEach((item) => {
    const reason = content.reasons.id(item._id);
    if (reason) {
      reason.order = item.order;
      reason.id = item.id;
    }
  });

  await content.save();
  return content.reasons;
}

// UPDATE CTA content
export async function updateCTAContent(data) {
  await connectDB();

  let content = await WhyRayob.findOne();
  if (!content) {
    content = await WhyRayob.create(data);
  } else {
    if (data.ctaHeading) content.ctaHeading = data.ctaHeading;
    if (data.ctaDescription) content.ctaDescription = data.ctaDescription;
    if (data.ctaButton1) content.ctaButton1 = data.ctaButton1;
    if (data.ctaButton2) content.ctaButton2 = data.ctaButton2;
    await content.save();
  }

  return content;
}
