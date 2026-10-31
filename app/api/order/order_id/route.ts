import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define the PUT handler using query parameters
export async function PUT(req: NextRequest) {
  try {
    // Extract order_id from query parameters
    const { searchParams } = new URL(req.url);
    const order_id = searchParams.get('order_id');

    // Validate order_id
    if (!order_id) {
      return NextResponse.json(
        { success: false, message: 'order_id is required' },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await req.json();

    // Update the order in the database
    const updatedOrder = await prisma.order_rec.update({
      where: { order_id },
      data: body,
    });

    return NextResponse.json(
      { success: true, data: updatedOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error updating order:', error);
    return NextResponse.json(
      { success: false, message: 'Order not found or update failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}