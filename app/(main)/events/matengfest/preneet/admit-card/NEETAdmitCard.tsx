'use client';

import QRCode from 'react-qr-code';

export default function NEETAdmitCard({ data }: any) {
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

  const photo = data.documents?.find((d: { document_type: string; }) => d.document_type === "passport_photo")?.s3_url;
  const signature = data.documents?.find((d: { document_type: string; }) => d.document_type === "candidate_signature")?.s3_url;

  const registrationNo = `BF-${String(candidateData.rollNumber).padStart(6, "0")}`;

  return (
    <div className="min-h-screen p-8">
      <div className='bg-gray-100 p-8 max-w-4xl mx-auto'>
        <div className="w-full bg-white shadow-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div className="border-2 border-black">
            <div className="grid grid-cols-[1fr_2fr_1fr] border-b-2 border-black">

              <div className="col-span-2 border-r-2  border-black p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-black">PRE - NEET COMPETITION</div>
                  <div className="text-base font-bold mt-1 text-black">NEET (UG) - 2026</div>
                </div>
              </div>

              <div className="border-black p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs font-semibold text-blue-700">POWERED BY</div>
                  <img src="/mateng-edufest-logo.png" alt="" className='w-[180px]' />
                </div>
              </div>
            </div>

            {/* Candidate Information Section */}
            <div className="grid grid-cols-2 border-b-2 border-black">
              <div className="border-r-2 border-black">
                <div className="grid grid-cols-2 border-b border-black">
                  <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Roll Number:</div>
                  <div className="p-2 text-sm text-gray-900">{candidateData.rollNumber}</div>
                </div>
                <div className="grid grid-cols-2 border-b border-black">
                  <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Candidate's Name:</div>
                  <div className="p-2 text-sm text-gray-900">{candidateData.candidateName}</div>
                </div>
                <div className="grid grid-cols-2 border-b border-black">
                  <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Gender:</div>
                  <div className="p-2 text-sm text-gray-900">{candidateData.gender}</div>
                </div>
                <div className="grid grid-cols-2 border-b border-black">
                  <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Category:</div>
                  <div className="p-2 text-sm text-gray-900">{candidateData.category}</div>
                </div>
                <div className="grid grid-cols-2 border-b border-black">
                  <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Person with Disability (PwD)*:</div>
                  <div className="p-2 text-sm text-gray-900">{candidateData.pwd}</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Type of Disability:</div>
                  <div className="p-2 text-sm text-gray-900">{candidateData.disabilityType}</div>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-2 border-b border-black">
                  <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Application Number:</div>
                  <div className="p-2 text-sm text-gray-900">{registrationNo}</div>
                </div>
                <div className="grid grid-cols-2 border-b border-black">
                  <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Father's Name :</div>
                  <div className="p-2 text-sm text-gray-900">{candidateData.fatherName}</div>
                </div>
                <div className="grid grid-cols-2 border-b border-black">
                  <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Date of Birth:</div>
                  <div className="p-2 text-sm text-gray-900">{candidateData.dob}</div>
                </div>
                <div className="grid grid-cols-2 border-b border-black">
                  <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">State of Eligibility:</div>
                  <div className="p-2 text-sm text-gray-900">{candidateData.stateOfEligibility}</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Scribe required*:</div>
                  <div className="p-2 text-sm text-gray-900">{candidateData.scribeRequired}</div>
                </div>
              </div>
            </div>

            {/* QR Code and Signature Section */}
            <div className="grid grid-cols-3 border-b-2 border-black">
              <div className="border-r-2 border-black p-4 flex flex-col items-center justify-center">
                <div className="bg-white p-2">
                  <QRCode
                    value={`Roll No: ${candidateData.rollNumber}, Name: ${candidateData.candidateName}, Application: ${candidateData.applicationNumber}`}
                    size={120}
                    level="H"
                  />
                </div>
                <div className="text-sm font-bold mt-2 text-black">{registrationNo}</div>
              </div>
              <div className="border-r-2 border-black p-4 flex items-center justify-center">
                <div id='signature' className="text-center">
                  <img src={signature} alt="signature" className='h-40 rounded-lg' />
                  <p className='text-gray-600 italic'>Signature</p>
                </div>
              </div>
              <div className="border-black p-4 flex items-center justify-center">
                <div id='passport' className="text-center">
                  <img src={photo} alt="photo" className='h-40 rounded-lg' />
                </div>
              </div>
            </div>

            {/* Test Details Header */}
            <div className="bg-gray-50 p-2 text-center font-bold border-b-2 border-black text-black">
              Test Details
            </div>

            {/* Test Details Table */}
            <div>
              <div className="grid grid-cols-2 border-b border-black">
                <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Question Paper Medium</div>
                <div className="p-2 text-sm text-gray-900">{candidateData.questionPaperMedium}</div>
              </div>
              <div className="grid grid-cols-2 border-b border-black">
                <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Date of Examination</div>
                <div className="p-2 text-sm text-gray-900">{candidateData.examDate}</div>
              </div>
              <div className="grid grid-cols-2 border-b border-black">
                <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Reporting/Entry Time at Centre</div>
                <div className="p-2 text-sm text-gray-900">{candidateData.reportingTime}</div>
              </div>
              <div className="grid grid-cols-2 border-b border-black">
                <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Gate Closing Time of Centre</div>
                <div className="p-2 text-sm text-gray-900">{candidateData.gateClosingTime}</div>
              </div>
              <div className="grid grid-cols-2 border-b border-black">
                <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Timing of Test</div>
                <div className="p-2 text-sm text-gray-900">{candidateData.testTiming}</div>
              </div>
              <div className="grid grid-cols-2 border-b border-black">
                <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Test Centre No</div>
                <div className="p-2 text-sm text-gray-900">{candidateData.testCentreNo}</div>
              </div>
              <div className="grid grid-cols-2 border-b border-black">
                <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Test Centre Name</div>
                <div className="p-2 text-sm text-gray-900">{candidateData.testCentreName}</div>
              </div>
              <div className="grid grid-cols-2 border-b-2 border-black">
                <div className="border-r border-black p-2 font-bold text-sm bg-gray-50 text-black">Test Centre Address (Venue of Test)</div>
                <div className="p-2 text-sm text-gray-900">{candidateData.testCentreAddress}</div>
              </div>
            </div>

            {/* Invigilator Signature */}
            <div className="p-4 text-center border-b-2 border-black">
              <div className='h-16' />
              <div className="font-bold text-sm mt-1 text-black">Invigilator Signature</div>
            </div>

            {/* Self Declaration */}
            <div className="p-4 text-xs text-gray-800">
              <div className="text-center font-bold text-red-600 mb-2">SELF DECLARATION (UNDERTAKING)</div>
              <div>
                I, _________________________________, resident of_________________________________, do hereby, declare the following:
              </div>
              <div className="mt-2">
                1. I have read the Instructions, Guidelines, Information Bulletin, Instructions, and Notices related to this examination available on the website
                <a href="https://justmateng.com/matengfest" className="text-blue-600 underline"> https://justmateng.com/matengfest</a> and
                <a href="https://justmateng.com/preneetrules.pdf" className="text-blue-600 underline ml-1">https://justmateng.com/preneetrules.pdf</a>
              </div>
              <div className="mt-1">
                2. I have read the detailed "IMPORTANT INSTRUCTIONS FOR CANDIDATES" as given on Page-3 and I undertake to abide by the same.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}