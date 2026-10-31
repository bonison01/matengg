// app/api/(auth)/forgotPassword/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const POST = async (req: NextRequest) => {
  try {
    const { email, phone, dob, newPassword } = await req.json();

    if (!email || !phone || !dob || !newPassword) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    const customer = await prisma.customers.findFirst({
      where: {
        email: email,
        phone: phone,
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, message: 'User not found. Check your email and phone number.' }, { status: 404 });
    }

    // Check if dob is null before accessing it
    if (customer.dob === null) {
      return NextResponse.json({ success: false, message: 'Date of birth not found for this user' }, { status: 400 });
    }

    const dobMatch = customer.dob.toISOString().split('T')[0] === dob;

    if (!dobMatch) {
      return NextResponse.json({ success: false, message: 'Incorrect date of birth' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.customers.update({
      where: {
        customer_id: customer.customer_id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({ success: true, message: 'Password reset successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Password Reset Error:', error);
    return NextResponse.json({ success: false, message: 'An error occurred. Please try again.' }, { status: 500 });
  }
};