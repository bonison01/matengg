import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: Request) {
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const {
      name,
      email,
      address,
      phone,
      whatsapp,
      dob,
    } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists for a different user
    const existingEmail = await prisma.customers.findFirst({
      where: {
        email,
        customer_id: { not: userId }, // Exclude the current user
      },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists for another user' },
        { status: 409 }
      );
    }

    // Check if phone already exists for a different user (if provided)
    if (phone) {
      const existingPhone = await prisma.customers.findFirst({
        where: {
          phone,
          customer_id: { not: userId }, // Exclude the current user
        },
      });
      if (existingPhone) {
        return NextResponse.json(
          { error: 'Phone number already exists for another user' },
          { status: 409 }
        );
      }
    }

    // Update only the specified fields in the database
    const updatedUser = await prisma.customers.update({
      where: {
        customer_id: userId,
      },
      data: {
        name,
        email,
        address: address || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        dob: dob ? new Date(dob) : null,
        updated_at: new Date(), // Still update this automatically
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

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}