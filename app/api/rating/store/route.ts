import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { user_id, business_user_id, rating, comment } = body;

    if (!user_id || !business_user_id || typeof rating !== 'number') {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: user_id, business_user_id, rating' },
        { status: 400 }
      );
    }

    console.log('Incoming Rating Data:', body);

    const existingRating = await prisma.ratings.findFirst({
      where: {
        user_id: user_id,
        business_user_id: business_user_id,
      },
    });

    if (existingRating) {
      return NextResponse.json(
        { success: false, message: 'Feedback already given.' },
        { status: 409 }
      );
    }

    const newRating = await prisma.ratings.create({
      data: {
        user_id,
        business_user_id,
        rating,
        comment: comment ?? null,
      },
    });

    console.log('Rating saved:', newRating);

    return NextResponse.json({ success: true, data: newRating }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating rating:', error);

    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { success: false, message: `Validation Error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};
