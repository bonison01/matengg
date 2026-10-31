'use client';

import jsPDF from "jspdf";

interface TeamMember {
    name: string;
    class_institution: string;
    address_contact: string;
}

interface RegistrationFormData {
    id: number;
    candidate_name: string;
    dob: string;
    class_institution: string;
    contact_number: string;
    gender: string;
    alternative_contact: string;
    address: string;
    father_name: string;
    father_occupation: string;
    competitions: string[];
    participation_type: string;
    team_members?: TeamMember[];
    exam_roll_number?: string;
    venue?: string;
    exam_date_time?: string;
    documents?: any[];
}

// ─── Helper: load image URL → base64, returns null on any failure ─────────────
async function tryLoadImageAsBase64(url: string): Promise<string | null> {
    return new Promise((resolve) => {
        try {
            const img = new Image();
            img.crossOrigin = "anonymous";

            img.onerror = () => {
                console.warn(`Signature image failed to load: ${url}`);
                resolve(null);
            };

            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) {
                        console.warn("Could not get canvas context for signature.");
                        resolve(null);
                        return;
                    }
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL("image/png"));
                } catch (err) {
                    console.warn("Canvas drawing failed for signature:", err);
                    resolve(null);
                }
            };

            img.src = url;
        } catch (err) {
            console.warn("Unexpected error loading signature:", err);
            resolve(null);
        }
    });
}

// ─── Helper: safely add signature image to doc ────────────────────────────────
function addSignatureImage(
    doc: jsPDF,
    signatureBase64: string | null,
    x: number,
    y: number,
    w: number,
    h: number
) {
    if (!signatureBase64) return;
    try {
        doc.addImage(signatureBase64, "PNG", x, y, w, h, undefined, "FAST");
    } catch (err) {
        console.warn("Failed to embed signature image in PDF:", err);
    }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export const generateRegistrationFormPDF = async (
    data: RegistrationFormData
): Promise<void> => {
    // 1. Attempt to load signature BEFORE building the PDF
    const signatureUrl = data.documents?.find(
        (d: any) => d.document_type === "candidate_signature"
    )?.s3_url;

    const signatureBase64 = signatureUrl
        ? await tryLoadImageAsBase64(signatureUrl)
        : null;

    // 2. Normalize potentially undefined array/string fields
    const selectedCompetitions: string[] = Array.isArray(data.competitions) ? data.competitions : [];
    const participationType: string = data.participation_type ?? "";

    // 3. Build PDF
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    const formNumber = `BF-${String(data.id).padStart(6, "0")}`;
    const examRollNumber =
        data.exam_roll_number || `ER-${String(data.id).padStart(6, "0")}`;

    // ── Safe text: coerces null/undefined → "" and never passes empty opts ───
    const st = (
        text: string | null | undefined,
        x: number,
        y: number,
        opts?: { maxWidth?: number; align?: string }
    ) => {
        const str = text ?? "";
        if (opts && Object.keys(opts).length > 0) {
            doc.text(str, x, y, opts as any);
        } else {
            doc.text(str, x, y);
        }
    };

    // ── Labelled field row ───────────────────────────────────────────────────
    const field = (
        label: string,
        value: string | null | undefined,
        y: number,
        maxWidth?: number
    ) => {
        doc.setFont("helvetica", "bold");
        st(label, 15, y);
        doc.setFont("helvetica", "normal");
        doc.line(70, y + 1, pageWidth - 15, y + 1);
        if (maxWidth) {
            st(value, 72, y, { maxWidth });
        } else {
            st(value, 72, y);
        }
    };

    // ── Admit-card field row (variable line start) ───────────────────────────
    const admitField = (
        label: string,
        value: string | null | undefined,
        y: number,
        lineStart: number
    ) => {
        doc.setFont("helvetica", "bold");
        st(label, 15, y);
        doc.setFont("helvetica", "normal");
        doc.line(lineStart, y + 1, pageWidth - 15, y + 1);
        st(value, lineStart + 2, y);
    };

    // ===== PAGE 1: REGISTRATION FORM =========================================

    let yPos = 18;

    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, 170);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    st("Registration Form", pageWidth / 2, yPos, { align: "center" });

    yPos = 28;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    st(`Form No: ${formNumber}`, pageWidth - 15, yPos, { align: "right" });

    yPos = 38;
    doc.setFontSize(9);

    field("Full Name of the Candidate", data.candidate_name, yPos);
    yPos += 8;
    field("Date of Birth", data.dob, yPos);
    yPos += 8;
    field("Class and Name of the Institution", data.class_institution, yPos);
    yPos += 8;
    field("Contact Number", data.contact_number, yPos);
    yPos += 8;
    field("Gender", data.gender, yPos);
    yPos += 8;
    field("Alternative Contact Number", data.alternative_contact, yPos);
    yPos += 8;

    // Address (multiline-safe)
    doc.setFont("helvetica", "bold");
    st("Address", 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.line(70, yPos + 1, pageWidth - 15, yPos + 1);
    st(data.address, 72, yPos, { maxWidth: pageWidth - 85 });
    yPos += 8;

    field(
        "Father's Name & Occupation",
        `${data.father_name ?? ""} - ${data.father_occupation ?? ""}`,
        yPos
    );

    // Competition Category
    yPos += 10;
    doc.setFont("helvetica", "bold");
    st("Competition Category", 15, yPos);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    st("(tick applicable or mention)", 15, yPos + 4);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    yPos += 8;
    const competitions = [
        { key: "painting", label: "Painting Competition" },
        { key: "quiz", label: "Quiz Competition" },
        { key: "mathematics", label: "Mathematics Competition" },
        { key: "innovator", label: "Young Innovator Challenge" },
    ];

    competitions.forEach((comp) => {
        st(`- ${comp.label}`, 20, yPos);
        if (selectedCompetitions.includes(comp.key)) st("[X]", 83, yPos);
        yPos += 5;
    });

    // Individual / Team
    yPos += 3;
    doc.setFont("helvetica", "bold");
    st("Individual / Team (only for Quiz)", 15, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 5;

    const participationOptions = [
        {
            label: "Individual",
            isChecked: participationType === "individual",
        },
        {
            label: "Team (2 member max for Quiz)",
            isChecked:
                participationType === "team" &&
                selectedCompetitions.includes("quiz"),
        },
        {
            label: "Team (3 member max for Young Innovator Challenge)",
            isChecked:
                participationType === "team" &&
                selectedCompetitions.includes("innovator"),
        },
    ];

    participationOptions.forEach((opt) => {
        st(`- ${opt.label}`, 20, yPos);
        if (opt.isChecked) st("[X]", 118, yPos);
        yPos += 5;
    });

    // Team Members
    if (data.team_members && data.team_members.length > 0) {
        data.team_members.forEach((member, index) => {
            yPos = Math.min(yPos, 160);
            yPos += 3;

            doc.setFont("helvetica", "bold");
            st(`Team Member's Name ${index + 1}`, 15, yPos);
            doc.setFont("helvetica", "normal");
            doc.line(70, yPos + 1, pageWidth - 15, yPos + 1);
            st(member.name, 72, yPos);

            yPos += 5;
            doc.setFont("helvetica", "bold");
            st("Team Member's Class and Institution", 15, yPos);
            doc.setFont("helvetica", "normal");
            doc.line(70, yPos + 1, pageWidth - 15, yPos + 1);
            st(member.class_institution, 72, yPos);

            yPos += 5;
            doc.setFont("helvetica", "bold");
            st("Team Member's Address and Contact", 15, yPos);
            doc.setFont("helvetica", "normal");
            doc.line(70, yPos + 1, pageWidth - 15, yPos + 1);
            st(member.address_contact, 72, yPos);
        });
    }

    // Dashed separator
    yPos = 185;
    (doc as any).setLineDash([3, 3]);
    doc.line(10, yPos, pageWidth - 10, yPos);
    (doc as any).setLineDash([]);

    // ===== ADMIT CARD =========================================================

    yPos = 198;
    doc.setLineWidth(0.5);
    doc.rect(10, 190, pageWidth - 20, 90);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    st("ADMIT CARD", pageWidth / 2, yPos, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    st("(For official use only)", pageWidth / 2, yPos + 4, { align: "center" });

    yPos = 208;
    doc.setFontSize(9);

    admitField("Exam Roll Number :", examRollNumber, yPos, 60);
    yPos += 7;
    admitField("Participate Name:", data.candidate_name, yPos, 60);
    yPos += 7;
    admitField("Name of Institute/Coaching Centre:", data.class_institution, yPos, 80);

    yPos += 7;
    doc.setFont("helvetica", "bold");
    st("Class:", 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.line(28, yPos + 1, 70, yPos + 1);
    st(data.class_institution?.split(",")[0] ?? "", 30, yPos);

    doc.setFont("helvetica", "bold");
    st("Venue:", 75, yPos);
    doc.setFont("helvetica", "normal");
    doc.line(91, yPos + 1, 125, yPos + 1);
    st(data.venue ?? "", 93, yPos);

    doc.setFont("helvetica", "bold");
    st("Date & Time:", 130, yPos);
    doc.setFont("helvetica", "normal");
    doc.line(155, yPos + 1, pageWidth - 15, yPos + 1);
    st(data.exam_date_time ?? "", 157, yPos);

    yPos += 10;
    doc.setFont("helvetica", "bold");
    st("Competition(s) :", 15, yPos);
    doc.setFont("helvetica", "normal");

    yPos += 5;
    const competitionLabels = [
        { key: "painting", label: "Painting", x: 20 },
        { key: "quiz", label: "Quiz", x: 60 },
        { key: "mathematics", label: "Mathematics", x: 100 },
        { key: "innovator", label: "Innovator Challenge", x: 150 },
    ];

    competitionLabels.forEach((comp) => {
        doc.rect(comp.x, yPos - 3, 3, 3);
        if (selectedCompetitions.includes(comp.key)) st("X", comp.x + 0.5, yPos - 0.5);
        st(comp.label, comp.x + 5, yPos);
    });

    yPos += 15;
    doc.setFont("helvetica", "bold");
    st("Candidate Signature:", 15, yPos);
    doc.line(15, yPos + 15, 90, yPos + 15);
    addSignatureImage(doc, signatureBase64, 30, yPos + 2, 40, 12);

    st("Authorized Signature:", 110, yPos);
    doc.line(110, yPos + 15, pageWidth - 15, yPos + 15);

    // ===== PAGE 2: SELF DECLARATION & RULES ==================================

    doc.addPage();
    yPos = 23;

    doc.setLineWidth(0.5);
    doc.rect(10, 15, pageWidth - 20, 110);


    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    st("SELF DECLARATION (UNDERTAKING)", pageWidth / 2, yPos, { align: "center" });

    yPos = 33;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    st(
        `I, ${data.candidate_name ?? ""}, resident of ${data.address ?? ""}, do hereby declare that:`,
        15,
        yPos,
        { maxWidth: pageWidth - 30 }
    );

    yPos += 10;
    const declarationPoints = [
        "I have read the Instructions, Information Bulletin, and all notices related to this examination available on the official website.",
        "I have read the detailed \"IMPORTANT INSTRUCTIONS FOR CANDIDATES\" and undertake to abide by the same.",
        "All the information provided by me in the Application Form is true and correct.",
        "I understand that if any information is found incorrect or misleading at any stage, my candidature may be cancelled.",
    ];

    const numberWidth = 10; // space for "1."
    const textStartX = 15 + numberWidth; // indent for wrapped text

    declarationPoints.forEach((point, index) => {
        const number = `${index + 1}.`;

        // Draw number
        st(number, 15, yPos);

        // Draw text separately with adjusted width
        const textHeight = st(point, textStartX, yPos, {
            maxWidth: pageWidth - textStartX - 15,
        });

        // Move Y position based on wrapped text height
        yPos += 10;
    });

    yPos += 5;
    doc.setFont("helvetica", "bold");
    st("Signature of Candidate:", 15, yPos);
    doc.line(15, yPos + 5, 90, yPos + 5);
    addSignatureImage(doc, signatureBase64, 30, yPos + 1, 40, 8);

    st("Date:", 110, yPos);
    doc.line(110, yPos + 5, pageWidth - 15, yPos + 5);

    yPos += 15;
    doc.setFont("helvetica", "normal");
    st("Place:", 15, yPos);
    doc.line(26, yPos + 1, 90, yPos + 1);

    yPos += 10;
    st("Signature of the Parents/ Guardian", pageWidth / 2, yPos, { align: "center" });
    doc.line(70, yPos + 10, 140, yPos + 10);

    // Dashed separator
    yPos = 130;
    (doc as any).setLineDash([3, 3]);
    doc.line(10, yPos, pageWidth - 10, yPos);
    (doc as any).setLineDash([]);

    // ===== RULES & REGULATIONS ===============================================

    yPos = 143;
    doc.setLineWidth(0.5);
    doc.rect(10, 135, pageWidth - 20, 130);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    st("Rules & Regulations", pageWidth / 2, yPos, { align: "center" });

    yPos = 152;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const rules = [
        "Carry this admit card and a School ID to the exam centre.",
        "Candidates must use only a black ballpoint pen to mark OMR Sheets.",
        "Mobile phones or any unfair means are strictly prohibited during competitions.",
        "Bring your own stationery - no sharing permitted.",
        "Painting Competition: Participants must bring their own art materials.",
        "Any misconduct or misbehavior may lead to immediate disqualification.",
        "Arrive at least 45 minutes before the exam starts.",
        "Additional rules and regulations will be available in the Mateng Edu Fest bulletin or on the official website: justmateng.com/matengfest.",
    ];

    // const numberWidth = 10; // space for "1."
    // const textStartX = 15 + numberWidth; // indent for wrapped text

    rules.forEach((rule, index) => {
        const number = `${index + 1}.`;

        // Draw number
        st(number, 15, yPos);

        // Draw text separately with adjusted width
        const textHeight = st(rule, textStartX, yPos, {
            maxWidth: pageWidth - textStartX - 15,
        });

        // Move Y position based on wrapped text height
        yPos += 10;
    });

    // 3. Save — always runs regardless of signature outcome
    doc.save(`Registration_Form_${data.candidate_name ?? "candidate"}_${formNumber}.pdf`);
};