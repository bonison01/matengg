import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Generate Unique Order ID
const generateOrderId = () => `ORD-${Date.now()}${Math.floor(Math.random() * 90 + 10)}`;

// ✅ POST - Create New Order
export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const {
      buyer_id,
      item_list,
      buyer_name = "",
      buyer_address = "",
      buyer_phone = ""
    } = body;

    const newOrder = await prisma.order_rec.create({
      data: {
        order_id: generateOrderId(),
        buyer_id: buyer_id || null,
        is_ordered: 0,
        buyer_name,
        buyer_address,
        buyer_phone,
        item_list: item_list || []
      },
    });

    return NextResponse.json({
      success: true,
      data: { order_id: newOrder.order_id }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};

// ✅ PUT - Update Existing Order
export const PUT = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const {
      order_id,
      buyer_id,
      item_list,
      buyer_name = "",
      buyer_address = "",
      buyer_phone = ""
    } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, message: 'order_id is required' }, { status: 400 });
    }

    const updatedOrder = await prisma.order_rec.update({
      where: { order_id },
      data: {
        buyer_id: buyer_id || null,
        buyer_name,
        buyer_address,
        buyer_phone,
        item_list: item_list || []
      },
    });

    return NextResponse.json({
      success: true,
      data: { order_id: updatedOrder.order_id }
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};

// ✅ GET - Get All Orders
export const GET = async () => {
  try {
    const orders = await prisma.order_rec.findMany({
      include: { order_item: true, customers: true },
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};