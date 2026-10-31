// app/api/sendOffer/route.ts
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

async function loadLocalPdf(dir: string, filename: string) {
  try {
    const filePath = path.join(dir, filename);
    const buf = await fs.readFile(filePath);
    return { filename, content: buf, contentType: "application/pdf" };
  } catch (err) {
    console.warn(`Attachment missing: ${filename} — ${String(err)}`);
    return null;
  }
}

async function loadRemotePdf(url: string, filenameFallback: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Remote fetch ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return { filename: filenameFallback, content: buf, contentType: "application/pdf" };
  } catch (err) {
    console.warn(`Failed to fetch remote PDF ${url}: ${String(err)}`);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      email,
      name,
      formid,
      rejected = false,
      // optional: either one of these is used
      selectedDocs = null, // expected array of filenames, e.g. ["terms.pdf","salary.pdf","custom.pdf"]
      includeTerms = false,
      includeSalary = false,
      includeLeave = false,
      custompdfurl = null,
      // optional subject override
      subjectOverride = null,
    } = body;

    if (!email || !formid) {
      return NextResponse.json({ error: "Missing email or formid" }, { status: 400 });
    }

    // create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_PASS!,
      },
    });

    // ---------- REJECTION ----------
    if (rejected) {
      await transporter.sendMail({
        from: `"Justmateng HR" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: subjectOverride ?? "Application Update – Justmateng",
        html: `
          <p>Dear ${name},</p>
          <p>Thank you for applying to <strong>Justmateng Service</strong>.</p>
          <p>After careful review, we regret to inform you that your application has not been selected at this time.</p>
          <p>We sincerely appreciate your interest and encourage you to apply again in the future.</p>
          <p>Best regards,<br/>Justmateng HR Team</p>
        `,
      });

      return NextResponse.json({ success: true, message: "Rejection email sent." });
    }

    // ---------- APPROVAL ----------
    // generate token & save to contracts
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

    const agreeLink = `${baseUrl}/api/agree?token=${encodeURIComponent(token)}&formid=${encodeURIComponent(formid)}`;

    // prepare attachments
    const attachments: any[] = [];
    const dir = path.join(process.cwd(), "public", "employee-contract-pdfs");

    // Helper: which docs to include
    // If selectedDocs (array) is provided and non-empty, use it.
    // Otherwise, build from boolean flags.
    let docsToAttach: string[] = [];

    if (Array.isArray(selectedDocs) && selectedDocs.length > 0) {
      docsToAttach = selectedDocs;
    } else {
      if (includeTerms) docsToAttach.push("terms.pdf");
      if (includeSalary) docsToAttach.push("salary.pdf");
      if (includeLeave) docsToAttach.push("leave.pdf");
      // custom.pdf is handled separately below if custompdfurl present
    }

    // Load local files
    for (const filename of docsToAttach) {
      // protect against path traversal
      const clean = path.basename(filename);
      const pdf = await loadLocalPdf(dir, clean);
      if (pdf) attachments.push(pdf);
    }

    // custompdfurl (remote or supabase public url)
    if ((Array.isArray(selectedDocs) && selectedDocs.includes("custom.pdf")) || (!Array.isArray(selectedDocs) && custompdfurl)) {
      // if selectedDocs contains "custom.pdf" OR custompdfurl boolean present
      if (custompdfurl) {
        const custom = await loadRemotePdf(custompdfurl, "Offer-Letter.pdf");
        if (custom) attachments.push(custom);
      } else {
        // If custom.pdf selected but no custompdfurl: try to load a file named "custom.pdf" from public folder
        const fallback = await loadLocalPdf(dir, "custom.pdf");
        if (fallback) attachments.push(fallback);
      }
    }

    // If attachments empty, log it (still send email)
    if (attachments.length === 0) {
      console.info("No attachments found/selected — sending email without attachments");
    }

    // send email
    await transporter.sendMail({
      from: `"Justmateng HR" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: subjectOverride ?? "Official Offer Letter – Justmateng",
      html: `
        <p>Dear ${name},</p>
        <p>Your application has been <strong>approved</strong>.</p>
        <p>Please review the attached documents.</p>
        <p>
          <a href="${agreeLink}"
            style="background:black;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;">
            Accept Offer & Agree
          </a>
        </p>
        <p>If the button does not work, use the link below:</p>
        <p><a href="${agreeLink}">${agreeLink}</a></p>
        <p>Regards,<br/>Justmateng HR Team</p>
      `,
      attachments,
    });

    return NextResponse.json({ success: true, message: "Approval email sent." });
  } catch (err: any) {
    console.error("sendOffer error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
