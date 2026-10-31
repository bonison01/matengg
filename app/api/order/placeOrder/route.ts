import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const {
      order_id,
      buyer_name,
      buyer_address,
      buyer_phone,
      landmark,
      email,
      order_at,
      status = 'ordered',
      items,
    } = body;

    // Validate required fields
    if (!order_id || !buyer_name || !buyer_address || !buyer_phone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: order_id, buyer_name, buyer_address, buyer_phone, or items' },
        { status: 400 }
      );
    }

    // Validate item data (no price required from client)
    if (items.some(item => !item.product_id || !item.product_name || !item.quantity)) {
      return NextResponse.json(
        { success: false, message: 'Each item must include product_id, product_name, and quantity' },
        { status: 400 }
      );
    }

    // Perform operations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const orderRec = await tx.order_rec.upsert({
        where: { order_id },
        update: {
          buyer_name,
          buyer_address,
          buyer_phone,
          landmark,
          email,
          order_at: order_at ? new Date(order_at) : undefined,
          status,
          item_list: items,
          item_count: items.length,
          is_ordered: 1,
        },
        create: {
          order_id,
          buyer_name,
          buyer_address,
          buyer_phone,
          landmark,
          email,
          order_at: order_at ? new Date(order_at) : new Date(),
          status,
          item_list: items,
          item_count: items.length,
          is_ordered: 1,
        },
      });

      // Sync order_item table
      const existingItems = await tx.order_item.findMany({
        where: { order_id },
        select: { product_id: true, quantity: true },
      });

      if (existingItems.length > 0) {
        // Update existing order items
        const itemsToUpsert = items.map((item: any) => ({
          order_id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          added_at: new Date(),
        }));

        // Upsert items
        for (const item of itemsToUpsert) {
          await tx.order_item.upsert({
            where: {
              unique_id: {
                order_id: item.order_id,
                product_id: item.product_id,
              },
            },
            update: {
              quantity: item.quantity,
              product_name: item.product_name,
            },
            create: item,
          });
        }

        // Delete removed items
        const newProductIds = new Set(items.map((item: any) => item.product_id));
        const itemsToDelete = existingItems
          .filter(item => !newProductIds.has(item.product_id))
          .map(item => item.product_id);

        if (itemsToDelete.length > 0) {
          await tx.order_item.deleteMany({
            where: {
              order_id,
              product_id: { in: itemsToDelete },
            },
          });
        }
      } else {
        // Create new order items
        await tx.order_item.createMany({
          data: items.map((item: any) => ({
            order_id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            added_at: new Date(),
          })),
          skipDuplicates: true,
        });
      }

      const updatedOrderRec = await tx.order_rec.findUnique({
        where: { order_id },
      });

      return updatedOrderRec;
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('Error placing order:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};