import Services from "../models/Services";
import { connectDB } from "../../server/db/connect";
import mongoose from "mongoose";

// Default services data
const DEFAULT_SERVICES = [
  {
    title: 'Engineering Services',
    shortDesc: 'Design, planning and technical delivery across civil and infrastructure projects.',
    icon: 'general engineering services',
    color: 'from-indigo-600 to-indigo-700',
  },
  {
    title: 'Telecoms Services',
    shortDesc: 'End-to-end telecommunications services including network rollout and optimization.',
    icon: 'telecoms services',
    color: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Optical fibre implementation & maintenance.',
    shortDesc: 'Optical fibre network implementation and maintenance services for telecoms infrastructure.',
    icon: 'optical fibre implementation & maintenance.',
    color: 'from-orange-600 to-orange-700',
  },
  {
    title: 'Building & Construction Services',
    shortDesc: 'Civil and building works delivered to specification, on time and on budget.',
    icon: 'building & construction services',
    color: 'from-green-600 to-green-700',
  },
  {
    title: 'Procurement Services',
    shortDesc: 'End-to-end procurement solutions ensuring quality, efficiency, and transparency.',
    icon: 'procurement services',
    color: 'from-pink-600 to-pink-700',
  },
  {
    title: 'Sales and Distribution of Telecoms Equipment and Materials',
    shortDesc: 'Telecoms equipment and building materials distribution across regions.',
    icon: 'sales and distribution of telecoms equipment and materials',
    color: 'from-yellow-600 to-yellow-700',
  },
  {
    title: 'Project Management Services',
    shortDesc: 'End-to-end project management delivering projects on time, within budget, and to world-class standards.',
    icon: 'project management services',
    color: 'from-teal-600 to-teal-700',
  },
  {
    title: 'Risk Management Services',
    shortDesc: 'Proactive risk identification, evaluation, and mitigation for project success.',
    icon: 'risk management services',
    color: 'from-red-600 to-red-700',
  },
  {
    title: 'Training and Manpower Development',
    shortDesc: 'Skills development and continuous professional growth for teams.',
    icon: 'training and manpower development',
    color: 'from-purple-600 to-purple-700',
  },
  {
    title: 'General Contracts',
    shortDesc: 'Uplifting communities, protecting the environment, and creating opportunities for the next generation.',
    icon: 'general contracts',
    color: 'from-cyan-600 to-cyan-700',
  },
];

// GET all services
export async function getServices() {
  await connectDB();
  let servicesDoc = await Services.findOne();

  // Initialize with defaults if doesn't exist
  if (!servicesDoc) {
    const servicesWithIds = DEFAULT_SERVICES.map((service, index) => ({
      _id: new mongoose.Types.ObjectId(),
      ...service,
      order: index,
      details: [],
    }));
    
    servicesDoc = await Services.create({ services: servicesWithIds });
  }

  return servicesDoc.services || [];
}

// CREATE new service
export async function createService(serviceData) {
  await connectDB();

  const newService = {
    _id: new mongoose.Types.ObjectId(),
    ...serviceData,
  };

  let servicesDoc = await Services.findOne();

  if (!servicesDoc) {
    servicesDoc = await Services.create({ services: [newService] });
  } else {
    const maxOrder = servicesDoc.services.length > 0
      ? Math.max(...servicesDoc.services.map(s => s.order || 0))
      : 0;

    newService.order = maxOrder + 1;
    servicesDoc.services.push(newService);
    servicesDoc.updatedAt = new Date();
    await servicesDoc.save();
  }

  return newService;
}

// UPDATE service
export async function updateService(serviceId, serviceData) {
  await connectDB();

  let servicesDoc = await Services.findOne();

  if (!servicesDoc) {
    throw new Error("Services document not found");
  }

  const serviceIndex = servicesDoc.services.findIndex(
    (s) => s._id.toString() === serviceId
  );

  if (serviceIndex === -1) {
    throw new Error("Service not found");
  }

  servicesDoc.services[serviceIndex] = {
    ...servicesDoc.services[serviceIndex],
    ...serviceData,
    _id: servicesDoc.services[serviceIndex]._id,
  };

  servicesDoc.updatedAt = new Date();
  await servicesDoc.save();

  return servicesDoc.services[serviceIndex];
}

// DELETE service
export async function deleteService(serviceId) {
  await connectDB();

  let servicesDoc = await Services.findOne();

  if (!servicesDoc) {
    throw new Error("Services document not found");
  }

  servicesDoc.services = servicesDoc.services.filter(
    (s) => s._id.toString() !== serviceId
  );

  // Reorder remaining services
  servicesDoc.services.forEach((service, index) => {
    service.order = index;
  });

  servicesDoc.updatedAt = new Date();
  await servicesDoc.save();

  return { success: true, message: "Service deleted successfully" };
}

// REORDER services
export async function reorderServices(serviceIds) {
  await connectDB();

  let servicesDoc = await Services.findOne();

  if (!servicesDoc) {
    throw new Error("Services document not found");
  }

  const reorderedServices = serviceIds.map((id, index) => {
    const service = servicesDoc.services.find((s) => s._id.toString() === id);
    if (service) {
      service.order = index;
    }
    return service;
  }).filter(Boolean);

  servicesDoc.services = reorderedServices;
  servicesDoc.updatedAt = new Date();
  await servicesDoc.save();

  return servicesDoc.services;
}
