import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Create a new delivery order
export async function POST(req: NextRequest) {
  try {
    const {
      pickup_name,
      pickup_phone,
      pickup_address,
      dropoff_name,
      dropoff_phone,
      dropoff_address,
      instructions,
      distance,
      charge,
      pickup_cord, // Adjusted to match your Page.tsx naming
      dropoff_cord, // Adjusted to match your Page.tsx naming
      customer_id,
      isBusiness,
      business_id,
    } = await req.json();

    // Validate required fields
    if (
      !pickup_name ||
      !pickup_phone ||
      !pickup_address ||
      !dropoff_name ||
      !dropoff_phone ||
      !dropoff_address
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const deliveryOrder = await prisma.delivery_orders.create({
      data: {
        pickup_name,
        pickup_phone,
        pickup_address,
        dropoff_name,
        dropoff_phone,
        dropoff_address,
        instructions: instructions || {}, // JSON field, default to empty object if not provided
        distance: distance ? parseFloat(distance) : null,
        charge: charge ? parseFloat(charge) : null,
        pickup_cord: pickup_cord || null, // Match your DB field name
        dropoff_cord: dropoff_cord || null, // Match your DB field name
        status: "Pending", // Default value
        customer_id: customer_id || null,
        isBusiness: isBusiness ? parseInt(isBusiness.toString()) : null, // Ensure integer
        business_id: business_id || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(deliveryOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating delivery order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT: Update an existing delivery order by customer_id
export async function PUT(req: NextRequest) {
  try {
    const {
      customer_id,
      pickup_name,
      pickup_phone,
      pickup_address,
      dropoff_name,
      dropoff_phone,
      dropoff_address,
      instructions,
      distance,
      charge,
      pickup_cord,
      dropoff_cord,
      status,
      isBusiness,
      business_id,
    } = await req.json();

    if (!customer_id) {
      return NextResponse.json({ error: "customer_id is required" }, { status: 400 });
    }

    // Check if the order exists
    const existingOrder = await prisma.delivery_orders.findFirst({
      where: { customer_id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Delivery order not found for this customer_id" }, { status: 404 });
    }

    const updatedOrder = await prisma.delivery_orders.update({
      where: { id: existingOrder.id },
      data: {
        pickup_name: pickup_name || existingOrder.pickup_name,
        pickup_phone: pickup_phone || existingOrder.pickup_phone,
        pickup_address: pickup_address || existingOrder.pickup_address,
        dropoff_name: dropoff_name || existingOrder.dropoff_name,
        dropoff_phone: dropoff_phone || existingOrder.dropoff_phone,
        dropoff_address: dropoff_address || existingOrder.dropoff_address,
        instructions: instructions || existingOrder.instructions,
        distance: distance ? parseFloat(distance) : existingOrder.distance,
        charge: charge ? parseFloat(charge) : existingOrder.charge,
        pickup_cord: pickup_cord || existingOrder.pickup_cord,
        dropoff_cord: dropoff_cord || existingOrder.dropoff_cord,
        status: status || existingOrder.status,
        isBusiness: isBusiness !== undefined ? parseInt(isBusiness.toString()) : existingOrder.isBusiness,
        business_id: business_id || existingOrder.business_id,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("Error updating delivery order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET: Fetch delivery orders by customer_id
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customer_id = searchParams.get("customer_id");

    if (!customer_id) {
      return NextResponse.json({ error: "customer_id is required" }, { status: 400 });
    }

    const orders = await prisma.delivery_orders.findMany({
      where: { customer_id },
      // include: {
      //   users: true, // Include related user data if needed
      //   customers: true, // Include related customer data if needed
      // },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "No delivery orders found for this customer_id" }, { status: 404 });
    }

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Error fetching delivery orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}