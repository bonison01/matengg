import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export const POST = async (req: NextRequest) => {
  try {
    const { name, email, phone, password, dob, address } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email, and password are required' }, { status: 400 });
    }

    const existingUser = await prisma.customers.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone || '' },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User with this email or phone already exists' }, { status: 409 });
    }

    const newToken = randomBytes(32).toString('hex');
    
    // 💥 FIX: Convert the dob string back to a Date object
    const dobDate = dob ? new Date(dob) : null;

    const newUser = await prisma.customers.create({
      data: {
        name,
        email,
        phone,
        password: password,
        token: newToken,
        dob: dobDate, // Pass the new Date object to Prisma
        address,
      },
      select: {
        customer_id: true,
        name: true,
        email: true,
        phone: true,
        dob: true,
        address: true,
        created_at: true,
        updated_at: true,
        token: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Signup failed' }, { status: 500 });
  }
};