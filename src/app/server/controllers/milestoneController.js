import Milestone from '../models/Milestone.js';
import { connectDB } from '../db/connect.js';

const DEFAULT_MILESTONES = {
  milestones: [
    { year: '2010', title: 'Company Founded', description: 'Kiddies Check was established to provide innovative educational technology solutions.', order: 0, active: true },
    { year: '2013', title: 'First Major Educational Project', description: 'Completed our first large-scale educational technology project, setting a standard for quality and efficiency.', order: 1, active: true },
    { year: '2016', title: 'Service Expansion', description: 'Expanded our service portfolio to include a wider range of educational technology solutions.', order: 2, active: true },
    { year: '2019', title: 'Award Recognition', description: 'Received industry awards for excellence in educational technology and innovation.', order: 3, active: true },
    { year: '2023', title: 'Global Partnerships', description: 'Established partnerships with international firms, enhancing our global project reach.', order: 4, active: true },
  ],
};

export async function getMilestones() {
  try {
    await connectDB();

    let milestoneData = await Milestone.findOne();

    if (!milestoneData) {
      milestoneData = await Milestone.create(DEFAULT_MILESTONES);
    }

    return {
      success: true,
      milestones: milestoneData.milestones || [],
    };
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function createMilestone(milestoneData) {
  try {
    await connectDB();

    let collection = await Milestone.findOne();
    if (!collection) {
      collection = await Milestone.create(DEFAULT_MILESTONES);
    }

    const newMilestone = {
      ...milestoneData,
      order: collection.milestones.length,
    };

    collection.milestones.push(newMilestone);
    collection.updatedAt = new Date();
    await collection.save();

    return {
      success: true,
      milestone: collection.milestones[collection.milestones.length - 1],
    };
  } catch (error) {
    console.error('Error creating milestone:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function updateMilestone(milestoneId, milestoneData) {
  try {
    await connectDB();

    const collection = await Milestone.findOne();
    if (!collection) {
      return {
        success: false,
        error: 'Milestone collection not found',
      };
    }

    const milestoneIndex = collection.milestones.findIndex(
      (m) => m._id.toString() === milestoneId
    );

    if (milestoneIndex === -1) {
      return {
        success: false,
        error: 'Milestone not found',
      };
    }

    collection.milestones[milestoneIndex] = {
      ...collection.milestones[milestoneIndex],
      ...milestoneData,
      _id: collection.milestones[milestoneIndex]._id,
    };

    collection.updatedAt = new Date();
    await collection.save();

    return {
      success: true,
      milestone: collection.milestones[milestoneIndex],
    };
  } catch (error) {
    console.error('Error updating milestone:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function deleteMilestone(milestoneId) {
  try {
    await connectDB();

    const collection = await Milestone.findOne();
    if (!collection) {
      return {
        success: false,
        error: 'Milestone collection not found',
      };
    }

    const initialLength = collection.milestones.length;
    collection.milestones = collection.milestones.filter(
      (m) => m._id.toString() !== milestoneId
    );

    if (collection.milestones.length === initialLength) {
      return {
        success: false,
        error: 'Milestone not found',
      };
    }

    // Reorder remaining milestones
    collection.milestones.forEach((milestone, index) => {
      milestone.order = index;
    });

    collection.updatedAt = new Date();
    await collection.save();

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function reorderMilestones(milestoneIds) {
  try {
    await connectDB();

    const collection = await Milestone.findOne();
    if (!collection) {
      return {
        success: false,
        error: 'Milestone collection not found',
      };
    }

    const newOrder = [];
    for (const id of milestoneIds) {
      const milestone = collection.milestones.find((m) => m._id.toString() === id);
      if (milestone) {
        newOrder.push(milestone);
      }
    }

    if (newOrder.length !== collection.milestones.length) {
      return {
        success: false,
        error: 'Invalid reorder request',
      };
    }

    newOrder.forEach((milestone, index) => {
      milestone.order = index;
    });

    collection.milestones = newOrder;
    collection.updatedAt = new Date();
    await collection.save();

    return {
      success: true,
      milestones: collection.milestones,
    };
  } catch (error) {
    console.error('Error reordering milestones:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
