import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const surcharges = await prisma.surcharge.findMany({
      orderBy: {
        sort_order: 'asc',
      },
    });

    const serialized = surcharges.map(s => ({
      ...s,
      cost_value: s.cost_value.toNumber(),
      created_at: s.created_at.toISOString(),
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

    // Validate type field
    const type = data.type || data.scope_type || 'product';
    if (type !== 'product' && type !== 'supplier') {
      return NextResponse.json(
        { error: 'type must be either "product" or "supplier"' },
        { status: 400 }
      );
    }

    // Get the max sort_order and add 1 for new surcharge
    const maxSortOrder = await prisma.surcharge.findFirst({
      orderBy: { sort_order: 'desc' },
      select: { sort_order: true },
    });
    const nextSortOrder = (maxSortOrder?.sort_order ?? -1) + 1;

    const surcharge = await prisma.surcharge.create({
      data: {
        name: data.name,
        description: data.description || null,
        cost_type: data.cost_type || '%',
        cost_value: data.cost_value,
        type: type,
        source: data.source || 'final_price',
        sort_order: data.sort_order ?? nextSortOrder,
        is_active: data.is_active ?? true,
      },
    });

    const serialized = {
      ...surcharge,
      cost_value: surcharge.cost_value.toNumber(),
      created_at: surcharge.created_at.toISOString(),
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

    // Map scope_type to type if provided (for backwards compatibility)
    if (data.scope_type) {
      data.type = data.scope_type;
      delete data.scope_type;
    }

    // Validate type if provided
    if (data.type && data.type !== 'product' && data.type !== 'supplier') {
      return NextResponse.json(
        { error: 'type must be either "product" or "supplier"' },
        { status: 400 }
      );
    }

    const updated = await prisma.surcharge.update({
      where: { id },
      data,
    });

    const serialized = {
      ...updated,
      cost_value: updated.cost_value.toNumber(),
      created_at: updated.created_at.toISOString(),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error updating surcharge:', error);
    return NextResponse.json({ error: 'Failed to update surcharge' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.surcharge.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting surcharge:', error);
    return NextResponse.json({ error: 'Failed to delete surcharge' }, { status: 500 });
  }
}
