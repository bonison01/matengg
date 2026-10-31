import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto'; // Import crypto module

export const POST = async (req: NextRequest) => {
  try {
    const { name, email, phone, password } = await req.json();

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

    const hashedPassword = await bcrypt.hash(password, 10);
    const newToken = randomBytes(32).toString('hex'); // Generate a random hex token

    const newUser = await prisma.customers.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        token: newToken, // Add the generated token here
      },
      select: {
        customer_id: true,
        name: true,
        email: true,
        phone: true,
        // is_active: true,
        // is_verified: true,
        created_at: true,
        updated_at: true,
        token: true, // Also include the token in the response if the client needs it
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