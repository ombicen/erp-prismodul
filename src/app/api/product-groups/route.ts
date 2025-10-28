import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const productGroups = await prisma.productGroup.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        department: true,
      },
    });

    return NextResponse.json(productGroups);
  } catch (error) {
    console.error('Error fetching product groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product groups' },
      { status: 500 }
    );
  }
}
