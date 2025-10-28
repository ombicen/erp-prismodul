import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      );
    }

    // Validate update structure
    for (const update of updates) {
      if (!update.id || typeof update.sort_order !== 'number') {
        return NextResponse.json(
          { error: 'Each update must have id and sort_order' },
          { status: 400 }
        );
      }
    }

    // Perform batch update in a transaction
    await prisma.$transaction(
      updates.map((update: { id: string; sort_order: number }) =>
        prisma.surcharge.update({
          where: { id: update.id },
          data: { sort_order: update.sort_order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating surcharge sort order:', error);
    return NextResponse.json(
      { error: 'Failed to update sort order' },
      { status: 500 }
    );
  }
}
