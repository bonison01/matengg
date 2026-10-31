// generateAdmitCard.ts
'use client';

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from 'qrcode';

interface Document {
    document_type: string;
    s3_url: string;
}

interface CandidateData {
    id: number;
    candidate_name: string;
    father_name: string;
    mother_name?: string;
    dob: string;
    age?: number;
    gender: string;
    nationality?: string;
    category: string;
    address: string;
    city?: string;
    state: string;
    pin_code?: string;
    mobile?: string;
    email?: string;
    documents?: Document[];
}

// Detect image format from a base64 data URL string
function getImageFormat(dataUrl: string): string {
    if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
    if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
    return 'PNG';
}

export const generateAdmitCardPDF = async (data: CandidateData) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 10;

    // Prepare candidate data
    const candidateData = {
        rollNumber: data.id,
        applicationNumber: data.id,
        candidateName: data.candidate_name,
        fatherName: data.father_name,
        gender: data.gender,
        dob: data.dob,
        category: data.category,
        stateOfEligibility: data.state,
        pwd: "NO",
        scribeRequired: "N/A",
        disabilityType: "N/A",
        questionPaperMedium: "ENGLISH",
        examDate: "07th April 2026 (Tuesday)",
        reportingTime: "12:00 AM",
        gateClosingTime: "01:30 PM",
        testTiming: "02:00 PM to 05:20 PM (IST)",
        testCentreNo: "MU001",
        testCentreName: "Kangshang Hall, Manipuri Dept., Manipur University",
        testCentreAddress: "Kangshang Hall, Manipuri Dept., Manipur University, Canchipur, Imphal, Manipur-795003",
    };

    const registrationNo = `BF-${String(candidateData.rollNumber).padStart(6, "0")}`;

    // Find photo and signature from documents
    const photoUrl = data.documents?.find(d => d.document_type === "passport_photo")?.s3_url;
    const signatureUrl = data.documents?.find(d => d.document_type === "candidate_signature")?.s3_url;

    // Load images as base64
    let photoBase64: string | null = null;
    let signatureBase64: string | null = null;
    let logoBase64: string | null = null;

    // Load logo from public folder
    try {
        logoBase64 = await loadImageAsBase64('/mateng-edufest-logo.png');
    } catch (error) {
        console.error('Error loading logo:', error);
    }

    if (photoUrl) {
        try {
            photoBase64 = await loadImageAsBase64(photoUrl);
        } catch (error) {
            console.error('Error loading photo:', error);
        }
    }

    if (signatureUrl) {
        try {
            signatureBase64 = await loadImageAsBase64(signatureUrl);
        } catch (error) {
            console.error('Error loading signature:', error);
        }
    }

    // ==========================================
    // ============== PAGE 1 ====================
    // ==========================================

    // Add border around entire document
    doc.setLineWidth(0.5);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    // ===== HEADER SECTION =====

    // Draw vertical line for header columns (2 columns: 2/3 for title, 1/3 for logo)
    const headerDivider = pageWidth - 60;
    doc.line(headerDivider, 5, headerDivider, 30);

    // Left/Center Column - Main Title (2/3 width)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("PRE - NEET COMPETITION", (headerDivider + 5) / 2, 17, { align: "center" });
    doc.setFontSize(11);
    doc.text("NEET (UG) - 2026", (headerDivider + 5) / 2, 23, { align: "center" });

    // Right Column - Powered By with Logo (1/3 width)
    doc.setFontSize(7);
    doc.setTextColor(30, 144, 255); // Blue color
    doc.text("POWERED BY", (headerDivider + pageWidth - 5) / 2, 11, { align: "center" });

    // Add logo image
    if (logoBase64) {
        try {
            const logoWidth = 40;
            const logoHeight = 16;
            const logoX = (headerDivider + pageWidth - 5) / 2 - (logoWidth / 2);
            const logoY = 13;

            doc.addImage(
                logoBase64,
                getImageFormat(logoBase64),
                logoX,
                logoY,
                logoWidth,
                logoHeight,
                undefined,
                'FAST'
            );
        } catch (error) {
            console.error('Error adding logo to PDF:', error);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text("MATENG EDUFEST", (headerDivider + pageWidth - 5) / 2, 20, { align: "center" });
        }
    } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("MATENG EDUFEST", (headerDivider + pageWidth - 5) / 2, 20, { align: "center" });
    }

    // Horizontal line after header
    doc.setLineWidth(0.5);
    doc.line(5, 30, pageWidth - 5, 30);

    yPosition = 30;

    // ===== CANDIDATE INFORMATION SECTION =====

    const candidateInfo = [
        // Left side
        [
            ['Roll Number:', candidateData.rollNumber.toString()],
            ['Candidate\'s Name:', candidateData.candidateName],
            ['Gender:', candidateData.gender],
            ['Category:', candidateData.category],
            ['Person with Disability (PwD)*:', candidateData.pwd],
            ['Type of Disability:', candidateData.disabilityType]
        ],
        // Right side
        [
            ['Application Number:', registrationNo],
            ['Father\'s Name:', candidateData.fatherName],
            ['Date of Birth:', candidateData.dob],
            ['State of Eligibility:', candidateData.stateOfEligibility],
            ['Scribe required*:', candidateData.scribeRequired],
            ['', '']
        ]
    ];

    const halfWidth = pageWidth / 2;

    // Left Column
    autoTable(doc, {
        startY: yPosition,
        body: candidateInfo[0],
        theme: 'grid',
        tableWidth: halfWidth,
        margin: { left: 5 },
        styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
        },
        columnStyles: {
            0: { cellWidth: 45, fontStyle: 'bold', fillColor: [245, 245, 245] },
            1: { cellWidth: 55 },
        }
    });

    // Right Column
    autoTable(doc, {
        startY: yPosition,
        body: candidateInfo[1],
        theme: 'grid',
        tableWidth: halfWidth,
        margin: { left: halfWidth },
        styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
        },
        columnStyles: {
            0: { cellWidth: 45, fontStyle: 'bold', fillColor: [245, 245, 245] },
            1: { cellWidth: 55 },
        }
    });

    yPosition = (doc as any).lastAutoTable.finalY;

    // ===== QR CODE, SIGNATURE AND PHOTO SECTION (3 columns) =====

    // Generate QR Code
    const qrData = `Roll No: ${candidateData.rollNumber}, Name: ${candidateData.candidateName}, Application: ${registrationNo}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 1,
        errorCorrectionLevel: 'H'
    });

    const sectionWidth = pageWidth - 10;
    const col1Width = sectionWidth / 3;
    const col2Width = (sectionWidth / 3) * 2;

    const sectionHeight = 50;

    doc.setLineWidth(0.5);
    doc.line(5, yPosition, pageWidth - 5, yPosition);

    doc.line(5 + col1Width, yPosition, 5 + col1Width, yPosition + sectionHeight);
    doc.line(5 + col2Width, yPosition, 5 + col2Width, yPosition + sectionHeight);

    // Column 1: QR Code
    const qrSize = 35;
    const qrX = 5 + (col1Width / 2) - (qrSize / 2);
    doc.addImage(qrCodeDataUrl, 'PNG', qrX, yPosition + 3, qrSize, qrSize);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(registrationNo, 5 + (col1Width / 2), yPosition + 43, { align: "center" });

    // Column 2: Signature
    const signatureX = 5 + col1Width + (col1Width / 2);

    if (signatureBase64) {
        try {
            const signatureMaxWidth = col1Width - 10;
            const signatureMaxHeight = 35;

            doc.addImage(
                signatureBase64,
                getImageFormat(signatureBase64),
                5 + col1Width + 5,
                yPosition + 3,
                signatureMaxWidth,
                signatureMaxHeight,
                undefined,
                'FAST'
            );
        } catch (error) {
            console.error('Error adding signature to PDF:', error);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("Signature", signatureX, yPosition + 20, { align: "center" });
        }
    } else {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("[Signature]", signatureX, yPosition + 20, { align: "center" });
    }

    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("Signature", signatureX, yPosition + 45, { align: "center" });

    // Column 3: Photo
    const photoX = 5 + col2Width + (col1Width / 2);

    if (photoBase64) {
        try {
            const photoMaxWidth = 30;
            const photoMaxHeight = 40;

            const photoXPos = 5 + col2Width + (col1Width / 2) - (photoMaxWidth / 2);

            doc.addImage(
                photoBase64,
                getImageFormat(photoBase64),
                photoXPos,
                yPosition + 3,
                photoMaxWidth,
                photoMaxHeight,
                undefined,
                'FAST'
            );
        } catch (error) {
            console.error('Error adding photo to PDF:', error);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("Photo", photoX, yPosition + 20, { align: "center" });
        }
    } else {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("[Photo]", photoX, yPosition + 20, { align: "center" });
    }

    yPosition += sectionHeight;
    doc.line(5, yPosition, pageWidth - 5, yPosition);

    // ===== TEST DETAILS SECTION =====

    doc.setFillColor(245, 245, 245);
    doc.rect(5, yPosition, pageWidth - 10, 7, 'F');
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Test Details", pageWidth / 2, yPosition + 5, { align: "center" });

    const testDetails = [
        ['Question Paper Medium', candidateData.questionPaperMedium],
        ['Date of Examination', candidateData.examDate],
        ['Reporting/Entry Time at Centre', candidateData.reportingTime],
        ['Gate Closing Time of Centre', candidateData.gateClosingTime],
        ['Timing of Test', candidateData.testTiming],
        ['Test Centre No', candidateData.testCentreNo],
        ['Test Centre Name', candidateData.testCentreName],
        ['Test Centre Address (Venue of Test)', candidateData.testCentreAddress]
    ];

    autoTable(doc, {
        startY: yPosition,
        head: [],
        body: testDetails,
        theme: 'grid',
        margin: { left: 5, right: 5 },
        styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            textColor: [0, 0, 0],
        },
        columnStyles: {
            0: { cellWidth: 80, fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [0, 0, 0] },
            1: { cellWidth: 'auto', fillColor: [255, 255, 255], textColor: [50, 50, 50] }
        }
    });

    yPosition = (doc as any).lastAutoTable.finalY;

    // ===== SIGNATURE FOOTER =====
    // Invigilator signature section — grows to fill space between test details and declaration

    doc.setLineWidth(0.5);
    doc.line(5, yPosition, pageWidth - 5, yPosition);

    // Reserve bottom area: declaration needs ~55mm, so invigilator box gets the rest
    const declarationHeight = 55;
    const invigTop = yPosition;
    const invigBottom = pageHeight - 5 - declarationHeight;
    const invigMidY = invigTop + (invigBottom - invigTop) / 2;

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Invigilator Signature", pageWidth / 2, invigMidY, { align: "center" });

    yPosition = invigBottom;

    // ===== SELF DECLARATION =====

    doc.setLineWidth(0.5);
    doc.line(5, yPosition, pageWidth - 5, yPosition);

    // Self declaration fills from here to bottom of page (pageHeight - 5)
    const declTop = yPosition;
    const declBottom = pageHeight - 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 0, 0);
    doc.text("SELF DECLARATION (UNDERTAKING)", pageWidth / 2, declTop + 6, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);

    const declarationText1 = "I, _________________________________, resident of_________________________________, do hereby, declare the following:";
    doc.text(declarationText1, 10, declTop + 13, { maxWidth: pageWidth - 20 });

    const declarationText2 = "1. I have read the Instructions, Guidelines, Information Bulletin, Instructions, and Notices related to this examination available on the website";
    doc.text(declarationText2, 10, declTop + 20, { maxWidth: pageWidth - 20 });

    doc.setTextColor(0, 0, 255);
    doc.textWithLink("https://justmateng.com/matengfest", 10, declTop + 27, { url: "https://justmateng.com/matengfest" });
    doc.text("and", 68, declTop + 27);
    doc.textWithLink("https://justmateng.com/preneetrules.pdf", 75, declTop + 27, { url: "https://justmateng.com/preneetrules.pdf" });

    doc.setTextColor(0, 0, 0);
    const declarationText3 = '2. I have read the detailed "IMPORTANT INSTRUCTIONS FOR CANDIDATES" as given on Page-3 and I undertake to abide by the same.';
    doc.text(declarationText3, 10, declTop + 34, { maxWidth: pageWidth - 20 });

    // Candidate signature line at the bottom-right of page 1
    const sigLineY = declBottom - 10;
    doc.setLineWidth(0.3);
    doc.line(pageWidth - 65, sigLineY, pageWidth - 10, sigLineY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    doc.text("Candidate's Signature", pageWidth - 37, sigLineY + 4, { align: "center" });

    // Close page 1 border at exact page bottom
    doc.setLineWidth(0.5);
    doc.line(5, declBottom, pageWidth - 5, declBottom);

    // ==========================================
    // ============== PAGE 2 ====================
    // (Undertaking / Postcard photo page)
    // ==========================================

    doc.addPage();
    yPosition = 5;

    // Border for page 2
    doc.setLineWidth(0.5);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    // ---- THREE BOXES ROW ----
    // Each box: roughly equal thirds of the content width
    const p2ContentX = 5;
    const p2ContentW = pageWidth - 10;
    const boxW = p2ContentW / 3;
    const boxH = 35;
    const boxY = yPosition + 2;

    // Draw the three outer boxes (share borders via lines)
    doc.setLineWidth(0.4);
    doc.rect(p2ContentX, boxY, p2ContentW, boxH); // outer rect
    // Dividers
    doc.line(p2ContentX + boxW, boxY, p2ContentX + boxW, boxY + boxH);
    doc.line(p2ContentX + boxW * 2, boxY, p2ContentX + boxW * 2, boxY + boxH);

    // Box labels (bottom-centered inside each box)
    const boxLabelY = boxY + boxH - 3;
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    // All three boxes are intentionally left EMPTY — candidates physically
    // paste/affix/sign at the exam centre. No digital images are inserted here.

    // Box 1 — candidate physically pastes their passport photo
    doc.text(
        "Candidate's Photo (Same as uploaded on the Application Form to\nbe affixed before reaching the Centre)",
        p2ContentX + boxW / 2,
        boxLabelY - 1,
        { align: "center", maxWidth: boxW - 4 }
    );

    // Box 2 — candidate physically affixes left-hand thumb impression
    doc.text(
        "Candidate's left-hand thumb Impression (To be affixed before\nreaching the Centre)",
        p2ContentX + boxW + boxW / 2,
        boxLabelY - 1,
        { align: "center", maxWidth: boxW - 4 }
    );

    // Box 3 — candidate signs on the day of examination in front of invigilator
    doc.text(
        "Candidate's Signature (To be signed on the Day of Examination in\nthe presence of the Invigilator only)",
        p2ContentX + boxW * 2 + boxW / 2,
        boxLabelY - 1,
        { align: "center", maxWidth: boxW - 4 }
    );

    yPosition = boxY + boxH + 2;

    // ---- UNDERTAKING NOTE ----
    doc.setLineWidth(0.3);
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 3;

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const undertakingNote = "The above undertaking has to be filled up in advance before reaching the Centre, except for the candidate's signature which has to be affixed in the presence of the Invigilator.";
    doc.text(undertakingNote, 7, yPosition, { maxWidth: pageWidth - 14 });

    yPosition += 7;

    // ---- DISCLAIMER (red) ----
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(200, 0, 0);
    doc.text("*Disclaimer: ", 7, yPosition);
    doc.setFont("helvetica", "normal");
    const disclaimerText = "The eligibility in the examination under the category \"Persons with Disability\" is purely provisional to appear in the examination and does not guarantee a seat to the candidate under the respective category. The candidature for admission to MBBS program under PwD category under various colleges will be governed as per relevant NMC guidelines.";
    doc.text(disclaimerText, 7, yPosition + 4, { maxWidth: pageWidth - 14 });

    yPosition += 16;

    // ---- FOOTER META LINE ----
    doc.setLineWidth(0.3);
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`Application Number : ${registrationNo}`, 7, yPosition);
    doc.text(`Date and Time:   ${dateStr} ${timeStr}`, pageWidth / 2, yPosition, { align: "center" });
    doc.text(`[Page 2 of 3]`, pageWidth - 7, yPosition, { align: "right" });

    yPosition += 5;
    doc.setLineWidth(0.3);
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 5;

    // ---- POSTCARD PHOTO AREA ----
    // Large bordered rectangle for pasting postcard photo
    const postcardW = 90;  // ~4 inches at 72dpi approx in mm
    const postcardH = 115; // ~6 inches
    const postcardX = pageWidth / 2 - postcardW / 2;
    const postcardY = yPosition;

    doc.setLineWidth(0.6);
    doc.rect(postcardX, postcardY, postcardW, postcardH);

    // Centered instruction text inside postcard box
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const postcardText = 'Please paste a Postcard Size (4\'\' x 6\'\') colour Photograph here before reaching the Centre. (The Candidate and the Invigilator are to sign across the photograph as indicated in the instructions below.)';
    const postcardLines = doc.splitTextToSize(postcardText, postcardW - 8);
    const postcardTextH = postcardLines.length * 5;
    const postcardTextY = postcardY + (postcardH / 2) - (postcardTextH / 2) + 5;
    doc.text(postcardLines, pageWidth / 2, postcardTextY, { align: "center" });

    yPosition = postcardY + postcardH + 4;

    // ==========================================
    // ============== PAGE 3 ====================
    // (Important Instructions)
    // ==========================================

    doc.addPage();

    yPosition = 10;

    // Border for page 3
    doc.setLineWidth(0.5);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    // Page 3 Header
    doc.setFillColor(245, 245, 245);
    doc.rect(5, 5, pageWidth - 10, 12, 'F');
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("IMPORTANT INSTRUCTIONS FOR CANDIDATES", pageWidth / 2, 13, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(5, 17, pageWidth - 5, 17);

    yPosition = 22;

    const instructions = [
        "The candidate must reach the Centre at the time indicated against Reporting/Entry time at the Centre in the Admit Card.",
        "No candidate shall be permitted to enter the Centre after the Gate Closing Time.",
        "No candidate shall be permitted to leave the Examination Room/Hall before the end of the examination.",
        "On completion of the examination, please wait for instructions from Invigilator and do not get up from your seat until advised. The candidates will be permitted to move out one at a time only.",
        "All candidates are required to download and carefully read the Instructions given with the Admit Card and strictly adhere to them.",
        "This Admit Card consists of three pages - Page 1 contains the Centre details and Self Declaration (Undertaking), Page 3 has the Undertaking with photograph space, and Page 3 has \"Important Instructions For Candidates\". The candidate must download all three pages.",
        "The Admit Card is provisional, subject to satisfying the eligibility conditions as given in the Information Bulletin.",
        "Candidates are advised to verify the location of the examination venue, a day in advance so that they do not face any problem on the day of examination. If religion/customs require you to wear specific attire, please visit the Centre early for thorough checking.",
        "No Candidate would be allowed to enter the Examination Centre, without Admit Card, Valid ID Proof, and proper frisking. Frisking will be carried out through Handheld Metal Detector (HHMD).",
        "Candidates will be permitted to carry only the following items with them into the examination venue:\n   a. Personal transparent water bottle.\n   b. Additional photograph same as uploaded on Application Form, to be pasted on Attendance Sheet.\n   c. Admit Card along with Self Declaration (Undertaking) having Postcard size photograph affixed on the designated space downloaded from the Mateng website (a clear printout on A4 size paper) only filled in.\n   d. Before reaching the Centre, the candidates must enter the required details in the Undertaking in legible handwriting.\n   e. PwD Certificate and Scribe-related documents, if applicable.",
        "Candidates should put their signature and paste the Photograph at the appropriate place. They should ensure that their Left-Hand Thumb Impression is clear and not smudged.",
        "Candidate must carry valid identity proof, preferably, Aadhaar Card (with photograph)/ E-Aadhaar/Ration Card/ Aadhaar Enrolment No. with Photo to the center. However, other valid identity proof issued by the government – PAN card/ Driving License/ Voter ID/ 12th Class Board Admit or Registration card/ Passport/ Original School Identity card with Photo will also be considered ONLY in case of non-availability. All other ID/Photocopies of IDs even if attested/scanned photo of IDs in mobile phone will NOT be considered valid ID Proof.",
        "The PwD candidates must bring a PwD Certificate issued by the Competent Authority if claiming relaxation under the PwD category. The Scribe will be provided by Mateng Education only if requested in the online Application Form of PRE NEET (UG) – 2026. Compensatory time of one hour and five minutes will be provided for the examination of three hours & 20 minutes (03:20 hrs) duration.",
        "Candidates are NOT allowed to carry any personal belongings including electronic devices, mobile phones, and other banned/prohibited items listed in the Information Bulletin to the Examination Centre. Examination Officials will not be responsible for the safe keep of personal belongings and there will be no facility at the center.",
        "Blank paper sheets for rough work will NOT be provided in the examination Hall/Room. Rough work is to be done in the space provided for this purpose in the Test Booklet only. Failure to do so may result in the non-evaluation of your answer.",
        "No Candidate should adopt any unfair means or indulge in any unfair examination practices as the examination Centres are under surveillance of CCTV and equipped with Jammers.",
        "On completion of the test, candidates must hand over the OMR Sheet (both Original and Office Copy) and take away only the Test Booklet with them. It will be the responsibility of the candidate to ensure that the OMR sheet submitted carries his/her signature as well as the Signature of the Invigilator.",
        "No Bio-breaks will be allowed during first one hour after beginning of the exam and last half an hour of the exam.",
        "Apart from the biometric attendance and frisking at entry, candidates will be frisked and biometric attendance will be taken again on entry from bio-break/toilets break.",
        "Candidates are advised NOT to indulge in use of Un-Fair Means, impersonation etc. Candidates found using Un-Fair Means are liable for strict action including debarment from appearing in all the examinations conducted by Mateng.",
        "Important Advisories to candidate:\n   a. Mateng uses AI based real time analytical tools & technologies to map likely/potential use of unfair means/cheating behavior by candidates at all centres, both during and post exams.\n   b. CCTV recordings are analyzed using AI technologies to confirm malpractice with evidence.\n   c. Mateng catches the likely cheaters through Artificial Intelligence-based tool.\n   d. Suspicious candidates are identified through AI-based tools, even after the examination.\n   e. Examination centers are continuously monitored through AI-enabled systems to ensure the integrity of the examination process.",
        "Candidates are advised to check updates on the Mateng websites regularly i.e. www.justmateng.com. They should also check their mailbox on the registered E-mail address and SMS in the registered Mobile No. for the latest updates and information.",
        "For any clarification/assistance, you can write to Mateng at justmatengservice@gmail.com or call at Helpline number 600 944 9928."
    ];

    // Compact settings to fit all instructions on page 3 only — no overflow pages
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);

    const leftMargin = 8;
    const rightMargin = pageWidth - 8;
    const maxWidth = rightMargin - leftMargin - 6;
    const lineHeight = 3.8;
    const pageBottom = pageHeight - 10; // hard stop — never exceed this

    instructions.forEach((instruction, index) => {
        const number = `${index + 1}.`;
        const textX = leftMargin + 6;
        const numberX = leftMargin;

        const subLines = instruction.split('\n');
        let totalLines = 0;
        const wrappedSubLines: string[][] = [];

        subLines.forEach(sub => {
            const wrapped = doc.splitTextToSize(sub, maxWidth);
            wrappedSubLines.push(wrapped);
            totalLines += wrapped.length;
        });

        const blockHeight = totalLines * lineHeight + 1.2;

        // If block won't fit, stop rendering (stays within page 3)
        if (yPosition + blockHeight > pageBottom) return;

        // Print number
        doc.setFont("helvetica", "bold");
        doc.text(number, numberX, yPosition);
        doc.setFont("helvetica", "normal");

        let currentY = yPosition;
        wrappedSubLines.forEach((wrapped) => {
            wrapped.forEach((line: string) => {
                if (currentY + lineHeight > pageBottom) return;
                doc.text(line, textX, currentY);
                currentY += lineHeight;
            });
        });

        yPosition = currentY + 1.2;
    });

    // Footer note — placed at bottom of page 3
    const footerY = pageHeight - 8;
    doc.setLineWidth(0.3);
    doc.line(5, footerY - 4, pageWidth - 5, footerY - 4);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(
        "* This admit card is computer generated and does not require a physical signature.",
        pageWidth / 2,
        footerY,
        { align: "center" }
    );

    // Download
    doc.save(`NEET_Admit_Card_${candidateData.candidateName}_${registrationNo}.pdf`);
};

// Helper function to load image from URL and convert to base64
// Uses fetch() for remote URLs (S3, CDN) to avoid CORS/tainted-canvas issues,
// and falls back to the img+canvas approach only for local public assets.
async function loadImageAsBase64(url: string): Promise<string> {
    const fullUrl = url.startsWith('/') ? window.location.origin + url : url;

    // --- Fetch path (works for S3 pre-signed URLs and any CORS-enabled remote URL) ---
    try {
        const response = await fetch(fullUrl, { mode: 'cors', cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();

        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (result) resolve(result);
                else reject(new Error('FileReader returned empty result'));
            };
            reader.onerror = () => reject(new Error('FileReader error'));
            reader.readAsDataURL(blob);
        });
    } catch (fetchError) {
        console.warn('fetch() failed for image, trying img+canvas fallback:', fetchError);
    }

    // --- Fallback: img + canvas (works for same-origin or permissive CORS) ---
    return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
            } catch (canvasError) {
                reject(canvasError);
            }
        };

        img.onerror = () => reject(new Error(`Failed to load image: ${fullUrl}`));
        img.src = fullUrl;
    });
}