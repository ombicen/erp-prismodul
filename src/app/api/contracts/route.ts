import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const contracts = await prisma.contract.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });

    const serialized = contracts.map(c => ({
      ...c,
      valid_from: c.valid_from ? c.valid_from.toISOString() : null,
      valid_to: c.valid_to ? c.valid_to.toISOString() : null,
      created_at: c.created_at.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();

    const updated = await prisma.contract.update({
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
    console.error('Error updating contract:', error);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}
