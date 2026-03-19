import CompanyOverview from '../models/CompanyOverview.js';
import { connectDB } from '../db/connect.js';

const DEFAULT_COMPANY_OVERVIEW = {
  companyInfo: {
    title: 'Who We Are',
    image: '/images/fibre1.jpeg',
    paragraphs: [
      {
        text: 'Kiddies Check is a leading educational technology company dedicated to providing innovative solutions for schools and educational institutions. With a strong focus on child safety, we offer a comprehensive platform that enables schools to manage student information, track attendance, communicate with parents, and ensure a secure learning environment.',
        order: 0,
      },
      {
        text: 'Founded in 2020, Kiddies Check has quickly established itself as a trusted partner for schools across the globe. Our team of experienced professionals is committed to delivering high-quality products and exceptional customer service, helping schools enhance their operations and create a safe and nurturing environment for students.',
        order: 1,
      },
      {
        text: 'At Kiddies Check, we believe that every child deserves a safe and supportive learning environment. Our mission is to empower schools with the tools they need to protect their students and foster a positive educational experience. We are proud to be at the forefront of educational technology, continuously innovating to meet the evolving needs of schools and ensure the safety and well-being of children worldwide.',
        order: 2,
      },
      {
        text: 'Our commitment to excellence, integrity, and innovation drives us to deliver solutions that make a real difference in the lives of students, parents, and educators. We are dedicated to building strong partnerships with schools and working collaboratively to create a safer and more effective educational environment for all.',
        order: 3,
      },
    ],
  },
  vision: {
    title: 'Our Vision',
    description: 'To Be The Leading Provider Of Innovative Educational Solutions That Empower Schools To Create Safe, Engaging, And Effective Learning Environments For Children Worldwide.',
  },
  mission: {
    title: 'Our Mission',
    description: 'To Develop And Deliver Cutting-Edge Educational Technology Solutions That Enable Schools To Manage Student Information, Enhance Communication With Parents, And Ensure The Safety And Well-Being Of Children In Educational Settings.',
  },
  coreValues: [
    { name: 'Excellence', description: 'We deliver superior outcomes in every project.', color: 'indigo', order: 0 },
    { name: 'Integrity', description: 'Ethical, transparent, and trustworthy operations.', color: 'blue', order: 1 },
    { name: 'Innovation', description: 'Smart, modern, technology-driven solutions.', color: 'green', order: 2 },
    { name: 'Professionalism', description: 'High standards, certified competence, quality delivery.', color: 'yellow', order: 3 },
    { name: 'Customer-centric', description: 'Solutions tailored to each client\'s needs.', color: 'pink', order: 4 },
  ],
};

export async function getCompanyOverview() {
  try {
    await connectDB();

    let overviewData = await CompanyOverview.findOne();

    if (!overviewData) {
      overviewData = await CompanyOverview.create(DEFAULT_COMPANY_OVERVIEW);
    }

    return {
      success: true,
      data: overviewData,
    };
  } catch (error) {
    console.error('Error fetching company overview:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function updateCompanyOverview(updateData) {
  try {
    await connectDB();

    let overviewData = await CompanyOverview.findOne();

    if (!overviewData) {
      overviewData = await CompanyOverview.create(DEFAULT_COMPANY_OVERVIEW);
    }

    // Update fields
    if (updateData.companyInfo) {
      overviewData.companyInfo = updateData.companyInfo;
    }
    if (updateData.vision) {
      overviewData.vision = updateData.vision;
    }
    if (updateData.mission) {
      overviewData.mission = updateData.mission;
    }
    if (updateData.coreValues) {
      overviewData.coreValues = updateData.coreValues;
    }

    overviewData.updatedAt = new Date();
    await overviewData.save();

    return {
      success: true,
      data: overviewData,
    };
  } catch (error) {
    console.error('Error updating company overview:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function updateCompanyInfo(companyInfoData) {
  try {
    await connectDB();

    let overviewData = await CompanyOverview.findOne();
    if (!overviewData) {
      overviewData = await CompanyOverview.create(DEFAULT_COMPANY_OVERVIEW);
    }

    overviewData.companyInfo = companyInfoData;
    overviewData.updatedAt = new Date();
    await overviewData.save();

    return {
      success: true,
      data: overviewData,
    };
  } catch (error) {
    console.error('Error updating company info:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function updateVision(visionData) {
  try {
    await connectDB();

    let overviewData = await CompanyOverview.findOne();
    if (!overviewData) {
      overviewData = await CompanyOverview.create(DEFAULT_COMPANY_OVERVIEW);
    }

    overviewData.vision = visionData;
    overviewData.updatedAt = new Date();
    await overviewData.save();

    return {
      success: true,
      data: overviewData,
    };
  } catch (error) {
    console.error('Error updating vision:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function updateMission(missionData) {
  try {
    await connectDB();

    let overviewData = await CompanyOverview.findOne();
    if (!overviewData) {
      overviewData = await CompanyOverview.create(DEFAULT_COMPANY_OVERVIEW);
    }

    overviewData.mission = missionData;
    overviewData.updatedAt = new Date();
    await overviewData.save();

    return {
      success: true,
      data: overviewData,
    };
  } catch (error) {
    console.error('Error updating mission:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function updateCoreValues(coreValuesData) {
  try {
    await connectDB();

    let overviewData = await CompanyOverview.findOne();
    if (!overviewData) {
      overviewData = await CompanyOverview.create(DEFAULT_COMPANY_OVERVIEW);
    }

    overviewData.coreValues = coreValuesData;
    overviewData.updatedAt = new Date();
    await overviewData.save();

    return {
      success: true,
      data: overviewData,
    };
  } catch (error) {
    console.error('Error updating core values:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
