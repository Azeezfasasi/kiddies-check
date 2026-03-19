import Team from '../models/Team.js';
import { connectDB } from '../db/connect.js';

const DEFAULT_TEAM = {
  members: [
    {
      name: 'Engr. Chukwudi U. Afonne',
      position: 'MD/CEO',
      photo: '/images/projectplaceholder.png',
      bio: 'Visionary leader with over 20 years of experience in engineering',
      order: 0,
      active: true,
    },
    {
      name: 'Engr. Mary Johnson',
      position: 'Head of Project Management',
      photo: '/images/projectplaceholder.png',
      bio: 'Expert in project delivery and team coordination',
      order: 1,
      active: true,
    },
    {
      name: 'Engr. David Okoro',
      position: 'Lead Civil Engineer',
      photo: '/images/projectplaceholder.png',
      bio: 'Specialized in structural design and civil works',
      order: 2,
      active: true,
    },
    {
      name: 'Engr. Sophia Ade',
      position: 'Electrical Engineering Manager',
      photo: '/images/projectplaceholder.png',
      bio: 'Expertise in electrical systems and installations',
      order: 3,
      active: true,
    },
  ],
};

export async function getTeamMembers() {
  try {
    await connectDB();

    let teamData = await Team.findOne();

    if (!teamData) {
      teamData = await Team.create(DEFAULT_TEAM);
    }

    return {
      success: true,
      members: teamData.members || [],
    };
  } catch (error) {
    console.error('Error fetching team members:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function createTeamMember(memberData) {
  try {
    await connectDB();

    let collection = await Team.findOne();
    if (!collection) {
      collection = await Team.create(DEFAULT_TEAM);
    }

    const newMember = {
      ...memberData,
      order: collection.members.length,
    };

    collection.members.push(newMember);
    collection.updatedAt = new Date();
    await collection.save();

    return {
      success: true,
      member: collection.members[collection.members.length - 1],
    };
  } catch (error) {
    console.error('Error creating team member:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function updateTeamMember(memberId, memberData) {
  try {
    await connectDB();

    const collection = await Team.findOne();
    if (!collection) {
      return {
        success: false,
        error: 'Team collection not found',
      };
    }

    const memberIndex = collection.members.findIndex(
      (m) => m._id.toString() === memberId
    );

    if (memberIndex === -1) {
      return {
        success: false,
        error: 'Team member not found',
      };
    }

    collection.members[memberIndex] = {
      ...collection.members[memberIndex],
      ...memberData,
      _id: collection.members[memberIndex]._id,
    };

    collection.updatedAt = new Date();
    await collection.save();

    return {
      success: true,
      member: collection.members[memberIndex],
    };
  } catch (error) {
    console.error('Error updating team member:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function deleteTeamMember(memberId) {
  try {
    await connectDB();

    const collection = await Team.findOne();
    if (!collection) {
      return {
        success: false,
        error: 'Team collection not found',
      };
    }

    const initialLength = collection.members.length;
    collection.members = collection.members.filter(
      (m) => m._id.toString() !== memberId
    );

    if (collection.members.length === initialLength) {
      return {
        success: false,
        error: 'Team member not found',
      };
    }

    // Reorder remaining members
    collection.members.forEach((member, index) => {
      member.order = index;
    });

    collection.updatedAt = new Date();
    await collection.save();

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting team member:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function reorderTeamMembers(memberIds) {
  try {
    await connectDB();

    const collection = await Team.findOne();
    if (!collection) {
      return {
        success: false,
        error: 'Team collection not found',
      };
    }

    const newOrder = [];
    for (const id of memberIds) {
      const member = collection.members.find((m) => m._id.toString() === id);
      if (member) {
        newOrder.push(member);
      }
    }

    if (newOrder.length !== collection.members.length) {
      return {
        success: false,
        error: 'Invalid reorder request',
      };
    }

    newOrder.forEach((member, index) => {
      member.order = index;
    });

    collection.members = newOrder;
    collection.updatedAt = new Date();
    await collection.save();

    return {
      success: true,
      members: collection.members,
    };
  } catch (error) {
    console.error('Error reordering team members:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
