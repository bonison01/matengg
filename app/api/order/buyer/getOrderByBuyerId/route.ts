import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buyer_id = searchParams.get('buyer_id');

  // Validate buyer_id
  if (!buyer_id) {
    return NextResponse.json(
      { success: false, message: 'buyer_id is required' },
      { status: 400 }
    );
  }

  try {
    const orders = await prisma.order_rec.findMany({
      where: {
        buyer_id: buyer_id,
        is_ordered: 1,
      },
      include: {
        order_item: {
          include: {
            new_products: {
              select: {
                price_inr: true,
                discounted_price: true,
              },
            },
          },
        },
      },
    });

    if (!orders.length) {
      return NextResponse.json(
        { success: false, message: 'No orders found for this buyer_id' },
        { status: 404 }
      );
    }

    const formattedOrders = orders.map(order => ({
      id: order.id,
      order_id: order.order_id,
      buyer_name: order.buyer_name,
      buyer_address: order.buyer_address,
      buyer_phone: order.buyer_phone,
      email: order.email,
      created_at: order.created_at,
      status: order.status,
      item_list: order.order_item.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.new_products.price_inr.toNumber(),
        discounted_price: item.new_products.discounted_price?.toNumber() || 0,
      })),
      total_price: order.total_price?.toNumber() || 0,
      total_calculated_price: order.total_calculated_price?.toNumber() || 0,
      item_count: order.item_count,
      is_ordered: order.is_ordered,
      landmark: order.landmark,
      buyer_id: order.buyer_id,
      store_ids: order.store_ids,
      order_at: order.order_at,
    }));

    return NextResponse.json(
      { success: true, data: formattedOrders },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}