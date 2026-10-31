import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define the GET handler using query parameters
export async function GET(req: NextRequest) {
  try {
    // Extract buyer_id from query parameters
    const { searchParams } = new URL(req.url);
    const buyer_id = searchParams.get('buyer_id');

    // Validate buyer_id
    if (!buyer_id) {
      return NextResponse.json(
        { success: false, message: 'buyer_id is required' },
        { status: 400 }
      );
    }

    // Fetch the latest draft order (is_ordered = 0) for the buyer
    const latestOrder = await prisma.order_rec.findFirst({
      where: {
        buyer_id,
        is_ordered: 0,
      },
      orderBy: {
        created_at: 'desc', // Latest order based on creation time
      },
    });

    if (!latestOrder) {
      return NextResponse.json(
        { success: false, message: 'No active draft order found for this buyer' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: latestOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching latest order for buyer_id:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}