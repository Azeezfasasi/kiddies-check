import mongoose from 'mongoose';

const ParagraphSchema = new mongoose.Schema({
  text: String,
  order: Number,
});

const CoreValueSchema = new mongoose.Schema({
  name: String,
  description: String,
  color: {
    type: String,
    default: 'indigo',
  },
  order: Number,
});

const CompanyOverviewSchema = new mongoose.Schema({
  companyInfo: {
    title: {
      type: String,
      default: 'Who We Are',
    },
    image: {
      type: String,
      default: '/images/fibre1.jpeg',
    },
    paragraphs: [ParagraphSchema],
  },
  vision: {
    title: {
      type: String,
      default: 'Our Vision',
    },
    description: {
      type: String,
      default: 'To be a Globally Recognized Engineering and Management Brand known for Excellence, Innovation, and Reliable Project Delivery.',
    },
  },
  mission: {
    title: {
      type: String,
      default: 'Our Mission',
    },
    description: {
      type: String,
      default: 'To Provide Superior Engineering and Management Services Using Modern Technology, Professional Expertise, and a Commitment to Quality, Safety, and Customer Satisfaction.',
    },
  },
  coreValues: [CoreValueSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const CompanyOverview = mongoose.models.CompanyOverview || mongoose.model('CompanyOverview', CompanyOverviewSchema);

export default CompanyOverview;
