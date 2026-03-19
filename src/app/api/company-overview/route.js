import { NextResponse } from 'next/server';
import {
  getCompanyOverview,
  updateCompanyOverview,
  updateCompanyInfo,
  updateVision,
  updateMission,
  updateCoreValues,
} from '@/app/server/controllers/companyOverviewController';

export async function GET() {
  const result = await getCompanyOverview();
  return NextResponse.json(result);
}

export async function PUT(request) {
  try {
    const body = await request.json();

    let result;

    if (body.section === 'companyInfo') {
      result = await updateCompanyInfo(body.data);
    } else if (body.section === 'vision') {
      result = await updateVision(body.data);
    } else if (body.section === 'mission') {
      result = await updateMission(body.data);
    } else if (body.section === 'coreValues') {
      result = await updateCoreValues(body.data);
    } else {
      result = await updateCompanyOverview(body);
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update company overview' },
      { status: 400 }
    );
  }
}
