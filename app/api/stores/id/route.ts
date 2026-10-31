import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Define the GET handler using query parameters
export async function GET(req: NextRequest) {
  try {
    // Extract id from query parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Validate id
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required.' },
        { status: 400 }
      );
    }

    const store = await prisma.users.findUnique({
      where: { user_id: id },
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        is_business_owner: true,
        business_name: true,
        business_address: true,
        business_type: true,
        product_service: true,
        business_experience: true,
        business_description: true,
        is_registered: true,
        photo: true,
        categories: true,
        rating: true,
        whatsapp: true,
      },
    });

    // If no store found, return success with empty object
    if (!store) {
      return NextResponse.json({ success: true, data: {} }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: store }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching store:', error);

    // Handle known Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { success: false, message: `Prisma Error: ${error.message}` },
        { status: 500 }
      );
    }

    // General error fallback
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}