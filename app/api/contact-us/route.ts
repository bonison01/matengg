import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const sendContactEmail = async (
  firstName: string,
  lastName: string,
  email: string,
  subject: string,
  message: string
) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'justmateng@gmail.com',
      pass: 'hccj sgim iiyr wlns',
    },
  });

  const mailOptions = {
    from: '"Justmateng" <justmateng@gmail.com>',
    to: 'justmatengservice@gmail.com',
    cc: email,
    subject: `Contact Form Submission: ${subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>First Name:</strong> ${firstName}</p>
      <p><strong>Last Name:</strong> ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong> ${message}</p>
      <p><small>Sent on: ${new Date().toLocaleString()}</small></p>
      <p>Best regards,<br/>The Mateng Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return false;
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const { firstName, lastName, email, subject, message } = await req.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { message: 'All fields are required.' },
        { status: 400 }
      );
    }

    // Send email
    const emailSent = await sendContactEmail(firstName, lastName, email, subject, message);
    if (!emailSent) {
      return NextResponse.json(
        { message: 'Failed to send email.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Contact form submitted successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact Form Submission Error:', error);
    return NextResponse.json(
      { message: 'Internal server error.' },
      { status: 500 }
    );
  }
};