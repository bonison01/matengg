import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      name,
      formid,
      rejected = false,  // <-- FIXED
      selectedDocs = [],
      custompdfurl = null,
    } = body;

    // Create Gmail transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_PASS!,
      },
    });

    // -------------------------------------------------------------------
    // ❌ CASE 1: SEND REJECTION EMAIL
    // -------------------------------------------------------------------
    if (rejected) {
      await transporter.sendMail({
        from: `"Justmateng HR" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Application Update – Justmateng",
        html: `
          <p>Dear ${name},</p>
          <p>Thank you for applying to <strong>Justmateng Service</strong>.</p>
          <p>
            After careful review, we regret to inform you that your application
            has not been selected at this time.
          </p>
          <p>We sincerely appreciate your interest and encourage you to apply again in the future.</p>
          <p>Best regards,<br/>Justmateng HR Team</p>
        `,
      });

      return NextResponse.json({ success: true, message: "Rejection email sent." });
    }

    // -------------------------------------------------------------------
    // ✅ CASE 2: APPROVED — SEND OFFER LETTER + ATTACHMENTS
    // -------------------------------------------------------------------

    // Generate agreement token
    const token = crypto.randomUUID();
    const sentAt = new Date().toISOString();

    await supabaseAdmin
      .from("employee_contracts")
      .update({
        agreement_token: token,
        agreement_sent_at: sentAt,
      })
      .eq("formid", formid);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL ||
      "http://localhost:3000";

    const agreeLink = `${baseUrl}/api/agree?token=${token}&formid=${formid}`;

    // Build attachments
    const attachments: any[] = [];
    const dir = path.join(process.cwd(), "public", "employee-contract-pdfs");

    for (const file of selectedDocs) {
      if (file === "custom.pdf" && custompdfurl) {
        const res = await fetch(custompdfurl);
        const buf = Buffer.from(await res.arrayBuffer());

        attachments.push({
          filename: "Custom-Offer-Letter.pdf",
          content: buf,
          contentType: "application/pdf",
        });
      } else {
        const filePath = path.join(dir, file);
        const buf = await fs.readFile(filePath);

        attachments.push({
          filename: file,
          content: buf,
          contentType: "application/pdf",
        });
      }
    }

    // Send approval email
    await transporter.sendMail({
      from: `"Justmateng HR" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Official Offer Letter – Justmateng",
      html: `
        <p>Dear ${name},</p>
        <p>Your application has been <strong>approved</strong>.</p>
        <p>Please review the attached documents.</p>
        <p>
          <a href="${agreeLink}"
            style="
              background:black;
              color:white;
              padding:10px 16px;
              border-radius:6px;
              text-decoration:none;
              font-weight:bold;
            ">
            Accept Offer & Agree
          </a>
        </p>
        <p>If the button does not work, use the link below:</p>
        <p>${agreeLink}</p>
      `,
      attachments,
    });

    return NextResponse.json({ success: true, message: "Approval email sent." });

  } catch (err: any) {
    console.error("sendOffer error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
