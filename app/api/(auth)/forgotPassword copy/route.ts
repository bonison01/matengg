import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const otpStore = new Map<string, { otp: string; expires: number }>();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (toEmail: string) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'justmateng@gmail.com',
      pass: 'hccj sgim iiyr wlns',
    },
  });

  const otp = generateOTP();
  const expires = Date.now() + 5 * 60 * 1000;

  const mailOptions = {
    from: '"Justmateng" <justmateng@gmail.com>',
    to: toEmail,
    subject: 'Password Reset OTP - Mateng',
    html: `
      <p>Dear Customer,</p>
      <p>We received a request to reset your password. Use the following OTP to proceed:</p>
      <h2>${otp}</h2>
      <p>This OTP is valid for 5 minutes. If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br/>The Mateng Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    otpStore.set(toEmail, { otp, expires });
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }

    const customer = await prisma.customers.findFirst({
      where: { email }
    });

    if (!customer) {
      return NextResponse.json({ message: 'Email not found.' }, { status: 404 });
    }

    const emailSent = await sendOTPEmail(email);
    if (!emailSent) {
      return NextResponse.json({ message: 'Failed to send OTP.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP sent to your email.' }, { status: 200 });
  } catch (error) {
    console.error('Forgot Password OTP Error:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};

export const PUT = async (req: NextRequest) => {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: 'Email, OTP, and new password are required.' },
        { status: 400 }
      );
    }

    const storedOTP = otpStore.get(email);
    if (!storedOTP) {
      return NextResponse.json({ message: 'OTP not requested or expired.' }, { status: 400 });
    }

    if (Date.now() > storedOTP.expires) {
      otpStore.delete(email);
      return NextResponse.json({ message: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (storedOTP.otp !== otp) {
      return NextResponse.json({ message: 'Invalid OTP.' }, { status: 400 });
    }

    const customer = await prisma.customers.findFirst({
      where: { email }
    });

    if (!customer) {
      return NextResponse.json({ message: 'Customer not found.' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.customers.update({
      where: { customer_id: customer.customer_id },
      data: { password: hashedPassword }
    });

    otpStore.delete(email);

    return NextResponse.json({ message: 'Password updated successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }

};