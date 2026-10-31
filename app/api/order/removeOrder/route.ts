import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const DELETE = async (req: NextRequest) => {
  // Step 1: Extract buyer_id from query parameters
  const buyer_id = req.nextUrl.searchParams.get('buyer_id');

  // Step 2: Validate that buyer_id is provided
  if (!buyer_id) {
    return NextResponse.json(
      { success: false, message: 'buyer_id is required' },
      { status: 400 }
    );
  }

  try {
    // Step 3: Perform deletions within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find orders with buyer_id and is_ordered = 0
      const orders = await tx.order_rec.findMany({
        where: {
          buyer_id: buyer_id,
          is_ordered: 0,
        },
        select: {
          order_id: true, // Only select order_id
        },
      });

      // Extract order_ids from the found orders
      const orderIds = orders.map((order) => order.order_id);

      // If no orders found, return early with count 0
      if (orderIds.length === 0) {
        return { count: 0 };
      }

      // Step 4: Delete associated order_items
      await tx.order_item.deleteMany({
        where: {
          order_id: {
            in: orderIds, // Delete items with these order_ids
          },
        },
      });

      // Step 5: Delete order_rec records
      const deletedOrders = await tx.order_rec.deleteMany({
        where: {
          buyer_id: buyer_id,
          is_ordered: 0,
        },
      });

      return deletedOrders; // Returns { count: number }
    });

    // Step 6: Return success response
    return NextResponse.json(
      {
        success: true,
        deletedCount: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle errors
    console.error('Error deleting orders:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};