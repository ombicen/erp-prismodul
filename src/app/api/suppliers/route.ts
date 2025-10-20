import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    const enrichedSuppliers = suppliers.map(s => ({
      ...s,
      created_at: s.created_at.toISOString(),
    }));

    return NextResponse.json(enrichedSuppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}
