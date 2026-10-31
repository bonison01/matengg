'use client';

import React from 'react';

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
  competitions?: string[];
  participation_type?: string;
  team_members?: TeamMember[];
  exam_roll_number?: string;
  venue?: string;
  exam_date_time?: string;
  documents?: any[];
}

export default function RegistrationForm({ data }: { data: RegistrationFormData }) {
  const formNumber = `BF-${String(data.id).padStart(6, "0")}`;
  const examRollNumber = data.exam_roll_number || `ER-${String(data.id).padStart(6, "0")}`;

  const competitions = data.competitions || [];
  const participationType = data.participation_type || 'individual';
  const teamMembers = data.team_members || [];

  const photo = data.documents?.find((d: any) => d.document_type === "passport_photo")?.s3_url;
  const signature = data.documents?.find((d: any) => d.document_type === "candidate_signature")?.s3_url;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div 
        className="max-w-4xl mx-auto bg-white shadow-lg p-8" 
        style={{ 
          fontFamily: 'Arial, sans-serif',
          color: '#000000'  // Explicit black text
        }}
      >
        
        {/* Registration Form Section */}
        <div className="border-2 border-black p-6 text-black">
          <h1 className="text-2xl font-bold text-center mb-4 text-black">Registration Form</h1>
          
          <div className="text-right mb-4 text-black">
            <span className="font-semibold">Form No: </span>
            <span className="border-b border-black px-2">{formNumber}</span>
          </div>

          <div className="space-y-3 text-sm text-black">
            {/* Full Name */}
            <div className="grid grid-cols-[200px_1fr] gap-2">
              <span className="font-semibold text-black">Full Name of the Candidate</span>
              <span className="border-b border-black px-2 text-black">{data.candidate_name || ''}</span>
            </div>

            {/* Date of Birth */}
            <div className="grid grid-cols-[200px_1fr] gap-2">
              <span className="font-semibold text-black">Date of Birth</span>
              <span className="border-b border-black px-2 text-black">{data.dob || ''}</span>
            </div>

            {/* Class and Institution */}
            <div className="grid grid-cols-[200px_1fr] gap-2">
              <span className="font-semibold text-black">Class and Name of the Institution</span>
              <span className="border-b border-black px-2 text-black">{data.class_institution || ''}</span>
            </div>

            {/* Contact Number */}
            <div className="grid grid-cols-[200px_1fr] gap-2">
              <span className="font-semibold text-black">Contact Number</span>
              <span className="border-b border-black px-2 text-black">{data.contact_number || ''}</span>
            </div>

            {/* Gender */}
            <div className="grid grid-cols-[200px_1fr] gap-2">
              <span className="font-semibold text-black">Gender</span>
              <span className="border-b border-black px-2 text-black">{data.gender || ''}</span>
            </div>

            {/* Alternative Contact */}
            <div className="grid grid-cols-[200px_1fr] gap-2">
              <span className="font-semibold text-black">Alternative Contact Number</span>
              <span className="border-b border-black px-2 text-black">{data.alternative_contact || ''}</span>
            </div>

            {/* Address */}
            <div className="grid grid-cols-[200px_1fr] gap-2">
              <span className="font-semibold text-black">Address</span>
              <span className="border-b border-black px-2 text-black">{data.address || ''}</span>
            </div>

            {/* Father's Name & Occupation */}
            <div className="grid grid-cols-[200px_1fr] gap-2">
              <span className="font-semibold text-black">Father's Name & Occupation</span>
              <span className="border-b border-black px-2 text-black">
                {data.father_name || ''} {data.father_occupation ? `- ${data.father_occupation}` : ''}
              </span>
            </div>

            {/* Competition Category */}
            <div className="mt-4 text-black">
              <div className="font-semibold mb-2 text-black">Competition Category</div>
              <div className="text-xs italic mb-2 text-black">(✔ tick applicable or mention)</div>
              <div className="space-y-1 ml-4 text-black">
                <div>● Painting Competition {competitions.includes('painting') && <span className="ml-2">✓</span>}</div>
                <div>● Quiz Competition {competitions.includes('quiz') && <span className="ml-2">✓</span>}</div>
                <div>● Mathematics Competition {competitions.includes('mathematics') && <span className="ml-2">✓</span>}</div>
                <div>● Young Innovator Challenge {competitions.includes('innovator') && <span className="ml-2">✓</span>}</div>
              </div>
            </div>

            {/* Individual/Team */}
            <div className="mt-4 text-black">
              <div className="font-semibold mb-2 text-black">Individual / Team (only for Quiz)</div>
              <div className="space-y-1 ml-4 text-black">
                <div>● Individual {participationType === 'individual' && <span className="ml-2">✓</span>}</div>
                <div>● Team (2 member max for Quiz) {participationType === 'team' && competitions.includes('quiz') && <span className="ml-2">✓</span>}</div>
                <div>● Team (3 member max for Young Innovator Challenge) {participationType === 'team' && competitions.includes('innovator') && <span className="ml-2">✓</span>}</div>
              </div>
            </div>

            {/* Team Members */}
            {teamMembers.length > 0 && (
              <>
                {teamMembers.map((member, index) => (
                  <div key={index} className="space-y-2 mt-4 text-black">
                    <div className="grid grid-cols-[200px_1fr] gap-2">
                      <span className="font-semibold text-black">Team Member's Name {index + 1}</span>
                      <span className="border-b border-black px-2 text-black">{member.name || ''}</span>
                    </div>
                    <div className="grid grid-cols-[200px_1fr] gap-2">
                      <span className="font-semibold text-black">Team Member's Class and Institution</span>
                      <span className="border-b border-black px-2 text-black">{member.class_institution || ''}</span>
                    </div>
                    <div className="grid grid-cols-[200px_1fr] gap-2">
                      <span className="font-semibold text-black">Team Member's Address and Contact</span>
                      <span className="border-b border-black px-2 text-black">{member.address_contact || ''}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Separator Line */}
        <div className="my-6 border-t-2 border-dashed border-black"></div>

        {/* Admit Card Section */}
        <div className="border-2 border-black p-6 text-black">
          <h2 className="text-xl font-bold text-center mb-2 text-black">ADMIT CARD</h2>
          <p className="text-xs text-center italic mb-4 text-black">(For official use only)</p>

          <div className="space-y-3 text-sm text-black">
            {/* ... rest of admit card fields with text-black ... */}
            <div className="grid grid-cols-[200px_1fr] gap-2">
              <span className="font-semibold text-black">Exam Roll Number :</span>
              <span className="border-b border-black px-2 text-black">{examRollNumber}</span>
            </div>

            <div className="grid grid-cols-[200px_1fr] gap-2">
              <span className="font-semibold text-black">Participate Name:</span>
              <span className="border-b border-black px-2 text-black">{data.candidate_name || ''}</span>
            </div>

            <div className="grid grid-cols-[200px_1fr] gap-2">
              <span className="font-semibold text-black">Name of Institute/Coaching Centre:</span>
              <span className="border-b border-black px-2 text-black">{data.class_institution || ''}</span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-black">
              <div className="flex gap-2">
                <span className="font-semibold text-black">Class:</span>
                <span className="border-b border-black flex-1 px-2 text-black">
                  {data.class_institution?.split(',')[0] || ''}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-black">Venue:</span>
                <span className="border-b border-black flex-1 px-2 text-black">{data.venue || '___________'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-black">Date & Time:</span>
                <span className="border-b border-black flex-1 px-2 text-black">{data.exam_date_time || '___________'}</span>
              </div>
            </div>

            {/* Competition checkboxes */}
            <div className="mt-4 text-black">
              <span className="font-semibold text-black">Competition(s) :</span>
              <div className="flex gap-6 mt-2 ml-4 text-black">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={competitions.includes('painting')} readOnly />
                  <span className="text-black">Painting</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={competitions.includes('quiz')} readOnly />
                  <span className="text-black">Quiz</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={competitions.includes('mathematics')} readOnly />
                  <span className="text-black">Mathematics</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={competitions.includes('innovator')} readOnly />
                  <span className="text-black">Innovator Challenge</span>
                </label>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-6 text-black">
              <div>
                <span className="font-semibold text-black">Candidate Signature:</span>
                <div className="border-b border-black h-20 mt-2 flex items-end justify-center">
                  {signature && <img src={signature} alt="signature" className="h-16 mb-2" />}
                </div>
              </div>
              <div>
                <span className="font-semibold text-black">Authorized Signature:</span>
                <div className="border-b border-black h-20 mt-2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2 - Self Declaration */}
        <div className="mt-8 border-2 border-black p-6 text-black">
          <h2 className="text-xl font-bold text-center mb-4 text-black">SELF DECLARATION (UNDERTAKING)</h2>

          <div className="space-y-4 text-sm text-black">
            <p className="text-black">
              I, <span className="border-b border-black px-16 inline-block text-black">{data.candidate_name || ''}</span>, resident of{' '}
              <span className="border-b border-black px-16 inline-block text-black">{data.address || ''}</span>, do hereby declare that:
            </p>

            <ol className="list-decimal ml-6 space-y-2 text-black">
              <li>I have read the Instructions, Information Bulletin, and all notices related to this examination available on the official website.</li>
              <li>I have read the detailed "IMPORTANT INSTRUCTIONS FOR CANDIDATES" and undertake to abide by the same.</li>
              <li>All the information provided by me in the Application Form is true and correct.</li>
              <li>I understand that if any information is found incorrect or misleading at any stage, my candidature may be cancelled.</li>
            </ol>

            <div className="grid grid-cols-2 gap-8 mt-8 text-black">
              <div>
                <span className="font-semibold text-black">Signature of Candidate:</span>
                <div className="border-b border-black h-16 mt-2 flex items-end">
                  {signature && <img src={signature} alt="signature" className="h-12 mb-2" />}
                </div>
              </div>
              <div>
                <span className="font-semibold text-black">Date:</span>
                <div className="border-b border-black h-16 mt-2"></div>
              </div>
            </div>

            <div className="mt-4 text-black">
              <span className="font-semibold text-black">Place:</span>
              <div className="border-b border-black w-64 inline-block ml-2"></div>
            </div>

            <div className="mt-6 text-center text-black">
              <span className="font-semibold text-black">Signature of the Parents/ Guardian</span>
              <div className="border-b border-black h-16 mt-2 mx-auto w-64"></div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="my-6 border-t-2 border-dashed border-black"></div>

        {/* Rules & Regulations */}
        <div className="border-2 border-black p-6 text-black">
          <h2 className="text-xl font-bold text-center mb-4 text-black">Rules & Regulations</h2>

          <ul className="space-y-2 text-sm text-black">
            <li>● Carry this admit card and a School ID to the exam centre.</li>
            <li>● Candidates must use only a black ballpoint pen to mark OMR Sheets.</li>
            <li>● Mobile phones or any unfair means are strictly prohibited during competitions.</li>
            <li>● Bring your own stationery—no sharing permitted.</li>
            <li>● Painting Competition: Participants must bring their own art materials.</li>
            <li>● Any misconduct or misbehavior may lead to immediate disqualification.</li>
            <li>● Arrive at least 45 minutes before the exam starts.</li>
            <li>
              ● Additional rules and regulations will be available in the Mateng Edu Fest bulletin or on the official website:{' '}
              <a href="https://justmateng.com/matengfest" className="text-blue-600 underline">
                justmateng.com/matengfest
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}