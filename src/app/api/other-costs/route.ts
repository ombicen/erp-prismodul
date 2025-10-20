import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const otherCosts = await prisma.otherCost.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const enriched = otherCosts.map(cost => ({
      ...cost,
      cost_value: cost.cost_value.toNumber(),
      created_at: cost.created_at.toISOString(),
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching other costs:', error);
    return NextResponse.json({ error: 'Failed to fetch other costs' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updated = await prisma.otherCost.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ...updated,
      cost_value: updated.cost_value.toNumber(),
      created_at: updated.created_at.toISOString(),
    });
  } catch (error) {
    console.error('Error updating other cost:', error);
    return NextResponse.json({ error: 'Failed to update other cost' }, { status: 500 });
  }
}
