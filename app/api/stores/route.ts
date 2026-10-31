import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const GET = async (req: NextRequest) => {
  try {
    // Fetch all users who are business owners
    const stores = await prisma.users.findMany({
      where: { is_business_owner: true },
      select: {
        user_id: true,
        business_name: true,
        business_type: true,
        product_service: true,
        business_experience: true,
        photo: true,
        categories: true,
        rating: true,
        whatsapp: true,
      },
      orderBy: {
        business_name: 'asc',
      },
    });

    return NextResponse.json({ success: true, data: stores }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching stores:', error);

    // Prisma known error handling
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { success: false, message: `Prisma Error: ${error.message}` },
        { status: 500 }
      );
    }

    // Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { success: false, message: `Validation Error: ${error.message}` },
        { status: 400 }
      );
    }

    // General fallback error response
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};
