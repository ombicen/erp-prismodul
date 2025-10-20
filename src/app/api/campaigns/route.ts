import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });

    const serialized = campaigns.map(c => ({
      ...c,
      valid_from: c.valid_from ? c.valid_from.toISOString() : null,
      valid_to: c.valid_to ? c.valid_to.toISOString() : null,
      created_at: c.created_at.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();

    const updated = await prisma.campaign.update({
      where: { id },
      data,
    });

    const serialized = {
      ...updated,
      valid_from: updated.valid_from ? updated.valid_from.toISOString() : null,
      valid_to: updated.valid_to ? updated.valid_to.toISOString() : null,
      created_at: updated.created_at.toISOString(),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}
