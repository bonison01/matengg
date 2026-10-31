import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define the GET handler using query parameters
export async function GET(request: Request) {
  try {
    // Extract user_id from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    // Validate user_id presence
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format (optional but recommended)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Fetch user details from database
    const user = await prisma.customers.findUnique({
      where: {
        customer_id: userId,
      },
      select: {
        customer_id: true,
        name: true,
        email: true,
        address: true,
        phone: true,
        profile_pic: true,
        whatsapp: true,
        remarks: true,
        order_record: true,
        created_at: true,
        updated_at: true,
        dob: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}