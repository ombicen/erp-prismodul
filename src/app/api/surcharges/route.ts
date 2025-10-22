import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const surcharges = await prisma.surcharge.findMany({
      include: {
        _count: {
          select: {
            product_surcharges: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const serialized = surcharges.map(s => ({
      ...s,
      created_at: s.created_at.toISOString(),
      product_count: s._count.product_surcharges,
      _count: undefined,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching surcharges:', error);
    return NextResponse.json({ error: 'Failed to fetch surcharges' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const surcharge = await prisma.surcharge.create({
      data: {
        name: data.name,
        description: data.description || null,
        cost_type: data.cost_type || '%',
        cost_value: data.cost_value,
        scope_type: data.scope_type || 'local',
        is_active: data.is_active ?? true,
      },
    });

    const serialized = {
      ...surcharge,
      created_at: surcharge.created_at.toISOString(),
      product_count: 0,
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error creating surcharge:', error);
    return NextResponse.json({ error: 'Failed to create surcharge' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();

    const updated = await prisma.surcharge.update({
      where: { id },
      data,
    });

    const serialized = {
      ...updated,
      created_at: updated.created_at.toISOString(),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error updating surcharge:', error);
    return NextResponse.json({ error: 'Failed to update surcharge' }, { status: 500 });
  }
}
