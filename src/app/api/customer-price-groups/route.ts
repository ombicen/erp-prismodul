import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const groups = await prisma.customerPriceGroup.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });

    const serialized = groups.map(g => ({
      ...g,
      valid_from: g.valid_from ? g.valid_from.toISOString() : null,
      valid_to: g.valid_to ? g.valid_to.toISOString() : null,
      created_at: g.created_at.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching customer price groups:', error);
    return NextResponse.json({ error: 'Failed to fetch customer price groups' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();

    const updated = await prisma.customerPriceGroup.update({
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
    console.error('Error updating customer price group:', error);
    return NextResponse.json({ error: 'Failed to update customer price group' }, { status: 500 });
  }
}
