import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

/* -------------------------------------------------------
   Types
------------------------------------------------------- */
interface TeamMemberPayload {
  name: string;
  student_class: string;
  dob: string;
  institution_name: string;
}

interface SendEduFestConfirmationBody {
  email: string;
  full_name: string;
  registrationId: number;
  competition_category: string[];
  competitionLabels: string[]; // human-readable labels, e.g. ["Painting", "Quiz"]
  participation_type: "individual" | "team";
  team_members?: TeamMemberPayload[];
  totalFee: number;
  institution_name?: string;
  student_class?: string;
}

/* -------------------------------------------------------
   POST Handler
------------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    const body: SendEduFestConfirmationBody = await req.json();

    const {
      email,
      full_name,
      registrationId,
      competitionLabels = [],
      participation_type,
      team_members = [],
      totalFee,
      institution_name,
      student_class,
    } = body;

    if (!email || !registrationId) {
      return NextResponse.json(
        { error: "Missing email or registrationId" },
        { status: 400 }
      );
    }

    const regNo = `MED${String(registrationId).padStart(6, "0")}`;

    /* -------------------------------------------------------
       Mail Transport (same Gmail setup as sendOffer)
    ------------------------------------------------------- */
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    /* -------------------------------------------------------
       Build optional team members table
    ------------------------------------------------------- */
    const teamRowsHtml =
      participation_type === "team" && team_members.length > 0
        ? `
          <tr>
            <td style="padding:8px 0;color:#555;font-size:13px;vertical-align:top;">Team Members</td>
            <td style="padding:8px 0;color:#111;font-size:13px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <th style="text-align:left;font-size:12px;color:#888;padding:4px 6px;border-bottom:1px solid #eee;">Name</th>
                  <th style="text-align:left;font-size:12px;color:#888;padding:4px 6px;border-bottom:1px solid #eee;">Class</th>
                  <th style="text-align:left;font-size:12px;color:#888;padding:4px 6px;border-bottom:1px solid #eee;">Institution</th>
                </tr>
                ${team_members
                  .map(
                    (m) => `
                  <tr>
                    <td style="padding:4px 6px;font-size:13px;border-bottom:1px solid #f3f3f3;">${m.name}</td>
                    <td style="padding:4px 6px;font-size:13px;border-bottom:1px solid #f3f3f3;">${m.student_class}</td>
                    <td style="padding:4px 6px;font-size:13px;border-bottom:1px solid #f3f3f3;">${m.institution_name}</td>
                  </tr>`
                  )
                  .join("")}
              </table>
            </td>
          </tr>`
        : "";

    /* -------------------------------------------------------
       SEND CONFIRMATION EMAIL
    ------------------------------------------------------- */
    await transporter.sendMail({
      from: `"Mateng EduFest 2026" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Registration Confirmed — ${regNo} | Mateng EduFest 2026`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111;">
          <div style="background:#0a0a0f;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <p style="color:#34d399;letter-spacing:2px;font-size:12px;text-transform:uppercase;margin:0 0 6px;">Mateng EduFest 2026</p>
            <h1 style="color:#fff;font-size:20px;margin:0;">Registration Confirmed ✓</h1>
          </div>

          <div style="border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
            <p style="font-size:14px;">Dear ${full_name},</p>
            <p style="font-size:14px;line-height:1.5;">
              Thank you for registering for <strong>Mateng EduFest 2026</strong>. Your registration and payment screenshot
              have been received and are now under verification. Please keep your Registration Number safe — you'll need it
              for all future correspondence.
            </p>

            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
              <tr>
                <td style="padding:8px 0;color:#555;font-size:13px;">Registration Number</td>
                <td style="padding:8px 0;color:#111;font-size:14px;font-weight:bold;">${regNo}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#555;font-size:13px;">Candidate Name</td>
                <td style="padding:8px 0;color:#111;font-size:13px;">${full_name}</td>
              </tr>
              ${
                student_class
                  ? `<tr>
                      <td style="padding:8px 0;color:#555;font-size:13px;">Class</td>
                      <td style="padding:8px 0;color:#111;font-size:13px;">${student_class}</td>
                    </tr>`
                  : ""
              }
              ${
                institution_name
                  ? `<tr>
                      <td style="padding:8px 0;color:#555;font-size:13px;">Institution</td>
                      <td style="padding:8px 0;color:#111;font-size:13px;">${institution_name}</td>
                    </tr>`
                  : ""
              }
              <tr>
                <td style="padding:8px 0;color:#555;font-size:13px;vertical-align:top;">Competitions</td>
                <td style="padding:8px 0;color:#111;font-size:13px;">${competitionLabels.join(", ")}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#555;font-size:13px;">Participation Type</td>
                <td style="padding:8px 0;color:#111;font-size:13px;text-transform:capitalize;">${participation_type}</td>
              </tr>
              ${teamRowsHtml}
              <tr>
                <td style="padding:8px 0;color:#555;font-size:13px;">Amount Paid</td>
                <td style="padding:8px 0;color:#059669;font-size:15px;font-weight:bold;">₹${totalFee}</td>
              </tr>
            </table>

            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 14px;margin:16px 0;">
              <p style="margin:0;font-size:13px;color:#92400e;">
                ⚠️ Your payment is currently under verification. You will receive a separate email once it has been
                confirmed by our team.
              </p>
            </div>

            <p style="font-size:13px;color:#555;line-height:1.5;">
              If you have any questions, please contact us at
              <a href="tel:6009729928" style="color:#059669;font-weight:bold;text-decoration:none;">6009729928</a>.
            </p>

            <p style="font-size:13px;color:#555;margin-top:24px;">
              Best regards,<br/>
              Mateng EduFest Team
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("sendEduFestConfirmation error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}