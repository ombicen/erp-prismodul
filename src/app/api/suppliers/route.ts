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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawName = typeof body?.name === 'string' ? body.name.trim() : '';
    const rawCode = typeof body?.code === 'string' ? body.code.trim() : '';

    if (!rawName) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    // Fallback code generation if not provided
    const fallbackCode = rawName || `SUPPLIER_${Date.now()}`;
    let normalizedCode =
      rawCode ||
      fallbackCode
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toUpperCase();

    if (!normalizedCode) {
      normalizedCode = `SUPPLIER_${Date.now()}`;
    }

    const created = await prisma.supplier.create({
      data: {
        name: rawName,
        code: normalizedCode,
      },
    });

    return NextResponse.json(
      {
        ...created,
        created_at: created.created_at.toISOString(),
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Error creating supplier:', error);

    // Handle unique constraint violation on supplier code
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A supplier with this code already exists' },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
