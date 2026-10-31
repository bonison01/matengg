"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── TIMELINE DATA ────────────────────────────────────────────────
const timelineEvents = [

  {
    id: "preneet",
    date: "20th April 2026",
    name: "Pre-NEET Competition",
    chips: ["UG NEET Aspirants", "₹250 Fee"],
    open: false,
    closed: true,
    body: "First structured Pre-NEET simulation platform in Manipur. A real-time NEET-pattern exam with 180 questions across Physics, Chemistry, and Biology. Registration is now closed.",
    info: [
      // { label: "Last Date", value: "4th April 2026" },
      // { label: "Admit Card", value: "5th April 2026" },
      { label: "Exam Date", value: "20th April 2026" },
      { label: "Prize Distribution", value: "26th July 2026" },
      { label: "Venue", value: "Manipur University, Imphal" },
      { label: "Duration", value: "3 hours 20 minutes" },
    ],
    prizes: [
      ["1st Prize", "₹10,000 + Book worth ₹1,000 + Certificate"],
      ["2nd Prize", "₹5,000 + Book worth ₹1,000 + Certificate"],
      ["3rd Prize", "₹3,000 + Book worth ₹1,000 + Certificate"],
      ["10 Consolation Prizes", "Cash + Book worth ₹1,000 + Certificate"],
      ["Best Institute Award", "Special Recognition"],
      ["MBBS Scholarship", "₹1,00,000 (abroad via Mateng Events)"],
    ],
    rulesHref: "/events/matengfest/preneetrules",
    canRegister: false,
  },
  {
    id: "maths",
    date: "12th July 2026",
    name: "Mathematics Championship",
    chips: ["Class 3–8", "₹200 Fee"],
    open: false,
    closed: true,
    body: "A rigorous mathematics olympiad to identify and celebrate young math talent across primary and middle school students in Manipur. Conducted in 6 separate categories (Class 3 to Class 8). The exam has been conducted and registration is now closed.",
    info: [
      { label: "Last Date", value: "07th July 2026" },
      { label: "Admit Card", value: "10th July 2026" },
      { label: "Exam Date", value: "12th July 2026" },
      { label: "Prize Distribution", value: "26th July 2026" },
      { label: "Venue", value: "Kakching, Thoubal, Bishnupur, Imphal West" },
      { label: "Duration", value: "2 hours" },
      { label: "Format", value: "MCQ" },
    ],
    prizes: [
      ["1st Prize (per category)", "₹3,000 + Certificate + Memento + Book ₹1,000 + T-Shirt"],
      ["2nd Prize (per category)", "₹2,000 + Certificate + Memento + Book ₹1,000 + T-Shirt"],
      ["3rd Prize (per category)", "₹1,000 + Certificate + Memento + Book ₹1,000 + T-Shirt"],
      ["25 Consolation Prizes", "Cash Prize + Certificate + T-Shirt"],
      ["Best Institute Award", "Memento + Certificate of Recognition"],
    ],
    registerHref: "/events/matengfest/edufest_registration",
    canRegister: false,
  },
  {
    id: "grand",
    date: "26th July 2026",
    name: "Grand Final — Multi-Event Day",
    chips: ["All Segments", "Prize Ceremony"],
    open: true,
    closed: false,
    body: "The culminating event of Mateng EduFest 2026. Quiz Championship, Painting Competition, and Young Innovators Challenge — all on the same day, followed by the grand prize distribution ceremony.",
    info: [
      { label: "Quiz Last Date", value: "18th July 2026" },
      { label: "Painting Last Date", value: "18th July 2026" },
      { label: "Innovators Last Date", value: "18th July 2026" },
      { label: "Admit Card", value: "20th July 2026" },
      { label: "Event Date", value: "26th July 2026" },
      { label: "Venue", value: "To be announced" },
    ],
    prizes: [
      ["Quiz Championship", "Class 6–10 · ₹300"],
      ["Painting Championship", "Class 3–8 · ₹150"],
      ["Young Innovators", "Class 9–12 · ₹300"],
      ["Prize Ceremony", "All segment winners felicitated"],
    ],
    registerHref: "/events/matengfest/edufest_registration",
    canRegister: true,
  },
];

// ─── SYLLABUS DATA ─────────────────────────────────────────────────
const mathsSyllabus = [
  {
    category: "Class 3",
    topics: ["4-Digit Numbers", "Roman Numerals", "Addition", "Subtraction", "Multiplication", "Division", "Fractions", "Money"],
  },
  {
    category: "Class 4",
    topics: ["Numbers", "Roman Numerals", "Addition and Subtraction", "Multiplication", "Division", "Estimation", "Multiples and Factors", "Fractions", "Decimals", "Measures of Length, Weight, and Capacity"],
  },
  {
    category: "Class 5 & 6",
    topics: ["Number System", "Fractions and Decimals", "Multiples and Factors", "Simplification", "Average", "Ratio and Proportion", "Percentage", "Profit and Loss", "Simple Interest"],
  },
  {
    category: "Class 7",
    topics: ["Number System (Integers)", "Fractions and Decimals", "Data Handling", "Simple Equations", "Lines and Angles", "Triangle and its Properties", "Congruence of Triangles", "Comparing Quantities", "Rational Numbers"],
  },
  {
    category: "Class 8",
    topics: ["Number System (Rational Numbers)", "Linear Equations in One Variable", "Understanding Quadrilaterals", "Data Handling", "Squares and Square Roots", "Cubes and Cube Roots", "Comparing Quantities", "Algebraic Expressions and Identities"],
  },
];

// ─── MATHS ANSWER KEY / QUESTION PAPER DATA ───────────────────────
// NOTE: File names below follow the convention
//   /maths-papers/class{N}-set{A|B|C}.pdf   (question papers — one per class per set)
//   /maths-keys/class{N}.pdf                (answer keys — ONE shared file per class,
//                                             common to all sets A/B/C)
// Place the matching PDFs in the /public folder using these exact
// names, or update the paths below to match your actual file names.
const mathsClasses = [3, 4, 5, 6, 7, 8];
const mathsSets = ["A", "B", "C"];

// ─── EXAM RESULTS DATA ─────────────────────────────────────────────
// NOTE: File names below follow the convention
//   /results/preneet-result.pdf            (Pre-NEET — single merit list)
//   /results/maths-class{N}-result.pdf      (Mathematics Championship — one per class)
// Place the matching PDFs in the /public folder using these exact
// names, or update the paths below to match your actual file names.
// Flip `declared` to false to show a "Coming Soon" state instead of links.
const examResults = [
  {
    id: "preneet",
    name: "Pre-NEET Competition",
    declared: true,
    resultHref: "/results/preneet-result.pdf",
  },
  {
    id: "maths",
    name: "Mathematics Championship",
    declared: true,
    classes: mathsClasses,
  },
];

// ─── SEGMENT DATA ─────────────────────────────────────────────────
const segments = [
  {
    id: "preneet",
    name: "Pre-NEET Competition",
    sub: "UG NEET Aspirants",
    fee: "₹250",
    date: "7th April 2026",
    open: false,
    closed: true,
    about: "A real-time NEET simulation exam — the first of its kind in Manipur. 180 questions across Physics, Chemistry, and Biology. All participants are eligible for a ₹1,00,000 scholarship toward MBBS abroad through Mateng Events.",
    info: [
      { label: "Eligibility", value: "NEET 2026 Aspirants" },
      { label: "Duration", value: "3 hours 20 min" },
      { label: "Format", value: "180 Questions (PCB)" },
      { label: "Last Date", value: "4th April 2026" },
      { label: "Admit Card", value: "5th April 2026" },
      { label: "Exam Date", value: "7th April 2026" },
      { label: "Prize Distribution", value: "26th July 2026" },
      { label: "Venue", value: "Manipur University, Imphal" },
    ],
    prizes: [
      ["1st Prize", "₹30,000 + Book worth ₹1,000 + Certificate"],
      ["2nd Prize", "₹15,000 + Book worth ₹1,000 + Certificate"],
      ["3rd Prize", "₹10,000 + Book worth ₹1,000 + Certificate"],
      ["10 Consolation Prizes", "Cash + Book + Certificate"],
      ["Best Institute Award", "Special Recognition"],
      ["MBBS Scholarship", "₹1,00,000 (abroad)"],
    ],
    syllabus: {
      type: "preneet",
      subjects: [
        { name: "Physics", topics: ["Physical World & Measurement", "Kinematics", "Laws of Motion", "Work, Energy & Power", "Motion of System of Particles", "Gravitation", "Properties of Bulk Matter", "Thermodynamics", "Behaviour of Perfect Gas & Kinetic Theory", "Oscillations & Waves", "Electrostatics", "Current Electricity", "Magnetic Effects & Magnetism", "Electromagnetic Induction & AC", "Electromagnetic Waves", "Optics", "Dual Nature of Matter & Radiation", "Atoms & Nuclei", "Electronic Devices"] },
        { name: "Chemistry", topics: ["Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements", "Chemical Bonding", "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen", "s-Block Elements", "p-Block Elements", "Organic Chemistry Basics", "Hydrocarbons", "Environmental Chemistry", "Solid State", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", "Coordination Compounds", "Alcohols, Phenols & Ethers", "Aldehydes & Ketones", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"] },
        { name: "Biology", topics: ["Diversity in Living World", "Structural Organisation in Plants & Animals", "Cell Structure & Function", "Plant Physiology", "Human Physiology", "Reproduction", "Genetics & Evolution", "Biology & Human Welfare", "Biotechnology", "Ecology & Environment"] },
      ],
    },
    canRegister: false,
  },
  {
    id: "maths",
    name: "Mathematics Championship",
    sub: "Class 3 – 8",
    fee: "₹200",
    date: "12th July 2026",
    open: false,
    closed: true,
    about: "A structured mathematics olympiad designed to challenge and celebrate young problem-solvers. Conducted in 6 separate categories (Class 3 to Class 8). Prizes are awarded separately for each class category. The exam has been conducted and registration is now closed.",
    info: [
      { label: "Eligibility", value: "Class 3 to 8" },
      { label: "Duration", value: "2 hours" },
      { label: "Format", value: "MCQ" },
      { label: "Last Date", value: "07th July 2026" },
      { label: "Admit Card", value: "10th July 2026" },
      { label: "Exam Date", value: "12th July 2026" },
      { label: "Prize Distribution", value: "26th July 2026" },
      { label: "Venue", value: "Kakching, Thoubal, Bishnupur, Imphal West" },
    ],
    prizes: [
      ["1st Prize (per category)", "₹3,000 + Certificate + Memento + Book ₹1,000 + T-Shirt"],
      ["2nd Prize (per category)", "₹2,000 + Certificate + Memento + Book ₹1,000 + T-Shirt"],
      ["3rd Prize (per category)", "₹1,000 + Certificate + Memento + Book ₹1,000 + T-Shirt"],
      ["25 Consolation Prizes", "Cash Prize + Certificate + T-Shirt"],
      ["Best Institute Award", "Memento + Certificate of Recognition"],
    ],
    syllabus: {
      type: "maths",
      categories: mathsSyllabus,
    },
    registerHref: "/events/matengfest/edufest_registration",
    canRegister: false,
  },
  {
    id: "painting",
    name: "Painting Championship",
    sub: "Class 3–8 (Open)",
    fee: "₹150",
    date: "26th July 2026",
    open: true,
    closed: false,
    about: "An on-the-spot painting competition exploring creativity and artistic expression. 3 themes will be announced on the day from the prepared list. Participants must choose one of the announced themes.",
    info: [
      { label: "Eligibility", value: "Class 3 to 8 (Open)" },
      { label: "Duration", value: "3 hours" },
      { label: "Format", value: "On-spot painting" },
      { label: "Last Date", value: "18th July 2026" },
      { label: "Admit Card", value: "20th July 2026" },
      { label: "Event Date", value: "26th July 2026" },
      { label: "Venue", value: "To be announced" },
    ],
    prizes: [
      ["1st Prize", "₹3,000 + Certificate + Memento + Book ₹1,000 + T-Shirt"],
      ["2nd Prize", "₹1,500 + Certificate + Memento + Book ₹1,000 + T-Shirt"],
      ["3rd Prize", "₹1,000 + Certificate + Memento + Book ₹1,000 + T-Shirt"],
      ["10 Consolation Prizes", "Cash Prize + Certificate + T-Shirt"],
    ],
    syllabus: {
      type: "painting",
      note: "On the day of the competition, only 3 themes will be announced from the list below. Participants must choose any one of the announced themes.",
      themes: [
        "Digital World vs Real World",
        "Dreams of Tomorrow",
        "My City, My Pride",
        "Future Technology",
        "Save Nature, Save Earth",
        "Role of Youth in Nation Building",
        "Clean Environment, Healthy Life",
        "Space Exploration",
        "Education for a Better Future",
        "Harmony in Diversity",
      ],
    },
    registerHref: "/events/matengfest/edufest_registration",
    canRegister: true,
  },
  {
    id: "quiz",
    name: "Quiz Championship",
    sub: "Class 6 – 10",
    fee: "₹300",
    date: "26th July 2026",
    open: true,
    closed: false,
    about: "A multi-round quiz championship. The preliminary round is a written test. Top 5 teams qualify for the Final Stage Round, conducted live on stage by the Quiz Master.",
    info: [
      { label: "Eligibility", value: "Class 6 to 10" },
      { label: "Format", value: "Preliminary (Written) + Live Final" },
      { label: "Last Date", value: "18th July 2026" },
      { label: "Admit Card", value: "20th July 2026" },
      { label: "Event Date", value: "26th July 2026" },
      { label: "Venue", value: "To be announced" },
    ],
    prizes: [
      ["1st Prize", "₹4,000 + Certificate + Memento + 2 Books ₹1,000 each + 2 T-Shirts"],
      ["2nd Prize", "₹2,000 + Certificate + Memento + 2 Books ₹1,000 each + 2 T-Shirts"],
      ["3rd Prize", "₹1,000 + Certificate + Memento + 2 Books ₹500 each + 2 T-Shirts"],
    ],
    syllabus: {
      type: "quiz",
      topics: [
        { name: "General Knowledge", desc: "World affairs, famous personalities, geography, history, and general awareness." },
        { name: "Current Affairs", desc: "National & International events, recent news, government schemes, and global developments." },
        { name: "Basic Science & Technology", desc: "Fundamental science concepts, recent scientific discoveries, and technology developments." },
        { name: "Sports & Achievements", desc: "Major sporting events, records, Indian and international sports achievements." },
        { name: "Art & Culture", desc: "Indian art forms, cultural heritage, literature, music, and festivals." },
      ],
      format: [
        "Preliminary round: Written test for all registered teams.",
        "Top 5 teams qualify for the Final Stage Round.",
        "Final round conducted live on stage by the Quiz Master.",
      ],
    },
    registerHref: "/events/matengfest/edufest_registration",
    canRegister: true,
  },
  {
    id: "innovators",
    name: "Young Innovators Challenge",
    sub: "Class 9–12 · Science & Tech",
    fee: "₹300",
    date: "26th July 2026",
    open: true,
    closed: false,
    about: "Students present innovative ideas or projects that solve real-world problems using science and technology. Top 5 presentations are selected to pitch live on stage before judges and audience.",
    info: [
      { label: "Eligibility", value: "Class 9 to 12 (Open)" },
      { label: "Format", value: "Project Presentation + Live Pitch" },
      { label: "Last Date", value: "18th July 2026" },
      { label: "Admit Card", value: "20th July 2026" },
      { label: "Event Date", value: "26th July 2026" },
      { label: "Venue", value: "To be announced" },
    ],
    prizes: [
      ["1st Prize", "₹5,000 + Certificate + Book worth ₹2,000 + T-Shirt"],
      ["2nd Prize", "₹3,000 + Certificate + Book worth ₹1,000 + T-Shirt"],
      ["3rd Prize", "₹2,000 + Certificate + Book worth ₹1,000 + T-Shirt"],
      ["Best Institute Award", "Memento + Certificate of Recognition"],
      ["Participation", "Certificate of Participation for every participant"],
    ],
    syllabus: {
      type: "innovators",
      criteria: [
        { name: "Innovation & Originality", desc: "How unique and creative is the idea or project?" },
        { name: "Problem Solving Ability", desc: "Does the project address a real-world problem effectively?" },
        { name: "Practical Feasibility", desc: "Can the idea realistically be implemented?" },
        { name: "Scientific / Technical Understanding", desc: "Does the participant demonstrate solid knowledge of the underlying science or technology?" },
        { name: "Presentation & Communication", desc: "How clearly and confidently is the project explained to the judges?" },
      ],
      format: [
        "Each participant/team presents and explains their project or idea to the judges.",
        "Based on evaluation, Top 5 presentations are selected.",
        "Finalists pitch their ideas live on stage before the judges and audience.",
      ],
    },
    registerHref: "/events/matengfest/edufest_registration",
    canRegister: true,
  },
];

type Segment = (typeof segments)[number];

// ─── GRAND FINAL DAY SCHEDULE (26th July 2026) ─────────────────────
const grandFinalSchedule = [
  {
    time: "8:00 AM",
    title: "Reporting Time & Spot Registrations",
    desc: "Gates open. On-the-spot competition registrations begin. Young Innovators Challenge project/stall setup begins.",
  },
  {
    time: "9:00 AM",
    title: "Quiz Championship — Preliminary Round",
    desc: "Written evaluation round for all registered Quiz Championship teams.",
  },
  {
    time: "10:00 AM – 12:30 PM",
    title: "Painting Championship",
    desc: "On-the-spot painting competition. Themes announced at the venue.",
  },
  {
    time: "1:00 PM",
    title: "Quiz Final & Young Innovators Final Pitch",
    desc: "Top 5 Quiz teams compete live on stage. Top 5 Young Innovators finalists pitch their projects before judges.",
  },
  {
    time: "3:00 PM",
    title: "Formal Function & Prize Distribution Ceremony",
    desc: "Felicitation of winners across all Mateng EduFest 2026 segments — Pre-NEET, Mathematics, Painting, Quiz, and Young Innovators.",
  },
];

// ─── EXAM RESULT PICKER MODAL ──────────────────────────────────────
function ExamResultModal({ onClose }: { onClose: () => void }) {
  const [choice, setChoice] = useState<"preneet" | "maths" | null>(null);

  return (
    <motion.div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1100, padding: "1.5rem",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420,
          border: "0.5px solid #ddd", overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.22 }}
      >
        <div style={{ background: "#0c3d14", padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#fff", fontWeight: 700, margin: 0 }}>
            Check Exam Result
          </h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>

        <div style={{ padding: "1.5rem" }}>
          {!choice && (
            <>
              <p style={{ fontSize: 13, color: "#666", marginBottom: 16, lineHeight: 1.6 }}>
                Select the exam you appeared for to view or download your result.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => setChoice("preneet")}
                  style={{
                    textAlign: "left", background: "#f8f8f8", border: "0.5px solid #eee", borderRadius: 10,
                    padding: "14px 16px", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#0c3d14",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  Pre-NEET Competition
                  <span style={{ fontSize: 13, color: "#14710F" }}>→</span>
                </button>
                <button
                  onClick={() => setChoice("maths")}
                  style={{
                    textAlign: "left", background: "#f8f8f8", border: "0.5px solid #eee", borderRadius: 10,
                    padding: "14px 16px", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#0c3d14",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  Mathematics Championship
                  <span style={{ fontSize: 13, color: "#14710F" }}>→</span>
                </button>
              </div>
            </>
          )}

          {choice === "preneet" && (
            <>
              <button onClick={() => setChoice(null)} style={{ background: "none", border: "none", color: "#14710F", fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}>
                ← Back
              </button>
              <p style={{ fontSize: 13, color: "#555", marginBottom: 16, lineHeight: 1.6 }}>
                The Pre-NEET Competition merit list &amp; scorecard is ready to view or download.
              </p>
              <a
                href="/results/preneet-result.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%",
                  background: "#14710F", color: "#fff", borderRadius: 8, padding: "12px 18px",
                  fontSize: 14, fontWeight: 700, textDecoration: "none", boxSizing: "border-box",
                }}
              >
                View / Download Result →
              </a>
            </>
          )}

          {choice === "maths" && (
            <>
              <button onClick={() => setChoice(null)} style={{ background: "none", border: "none", color: "#14710F", fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}>
                ← Back
              </button>
              <p style={{ fontSize: 13, color: "#555", marginBottom: 16, lineHeight: 1.6 }}>
                Select your class to view or download the Mathematics Championship result.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {mathsClasses.map((cls) => (
                  <a
                    key={cls}
                    href={`/results/maths-class${cls}-result.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "#e8f5e9", color: "#0c3d14", borderRadius: 8, padding: "12px 8px",
                      fontSize: 13, fontWeight: 700, textDecoration: "none", textAlign: "center",
                    }}
                  >
                    Class {cls}
                  </a>
                ))}
              </div>
            </>
          )}

          <p style={{ fontSize: 11, color: "#999", marginTop: 18, lineHeight: 1.6 }}>
            Results are provisional. Rechecking requests must be submitted within 10 days of declaration, along with a
            rechecking fee of ₹1,000.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── EXAM RESULTS BANNER ────────────────────────────────────────────
function ExamResultsBanner({ onCheck }: { onCheck: () => void }) {
  return (
    <section
      style={{
        maxWidth: 900,
        margin: "1.75rem auto 0",
        padding: "0 1rem",
        display: "grid",
        gap: 16,
      }}
    >

      {/* Exam Result */}
      <motion.button
        onClick={onCheck}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          background: "linear-gradient(135deg, #0c3d14, #14710F)",
          border: "none",
          borderRadius: 14,
          padding: "1.1rem 1.5rem",
          cursor: "pointer",
          boxShadow: "0 12px 30px rgba(12,61,20,0.25)",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>📢</span>
          <div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                margin: 0,
              }}
            >
              Exam Results are Out!
            </p>
            <p
              style={{
                fontSize: 12.5,
                color: "rgba(255,255,255,0.75)",
                margin: "2px 0 0",
              }}
            >
              Pre-NEET &amp; Mathematics Championship results are now available.
            </p>
          </div>
        </div>

        <span
          style={{
            background: "#fff",
            color: "#0c3d14",
            borderRadius: 8,
            padding: "9px 18px",
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          Check Result →
        </span>
      </motion.button>

      {/* Question Papers & Answer Keys */}
      <motion.button
        onClick={() => window.open("/details.pdf", "_blank")}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          background: "#fff",
          border: "2px solid #14710F",
          borderRadius: 14,
          padding: "1.1rem 1.5rem",
          cursor: "pointer",
          boxShadow: "0 10px 24px rgba(20,113,15,.12)",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>📄</span>
          <div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#14710F",
                margin: 0,
              }}
            >
              Question Papers &amp; Answer Keys
            </p>
            <p
              style={{
                fontSize: 12.5,
                color: "#666",
                margin: "2px 0 0",
              }}
            >
              Download all sets (A, B &amp; C) for the Jr. Mathematics Championship.
            </p>
          </div>
        </div>

        <span
          style={{
            background: "#14710F",
            color: "#fff",
            borderRadius: 8,
            padding: "9px 18px",
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          View PDF →
        </span>
      </motion.button>
    </section>

  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────
function DetailModal({ seg, onClose, onRegister }: { seg: Segment; onClose: () => void; onRegister: (href: string) => void }) {
  const [tab, setTab] = useState<"overview" | "syllabus">("overview");
  const s = seg.syllabus as any;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    borderBottom: active ? "2px solid #14710F" : "2px solid transparent",
    background: "transparent",
    color: active ? "#14710F" : "#888",
    transition: "all 0.18s",
  });

  return (
    <motion.div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 1000, padding: "2rem 1rem", overflowY: "auto",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 640,
          border: "0.5px solid #ddd", overflow: "hidden", marginTop: 16,
        }}
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25 }}
      >
        {/* Header */}
        <div style={{ background: "#0c3d14", padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: 20, color: "#fff", fontWeight: 700, marginBottom: 4 }}>{seg.name}</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{seg.sub} · {seg.fee} Registration · {seg.date}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 15, flexShrink: 0 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #eee", background: "#fafafa", paddingLeft: "1rem" }}>
          <button style={tabStyle(tab === "overview")} onClick={() => setTab("overview")}>Overview</button>
          {s && <button style={tabStyle(tab === "syllabus")} onClick={() => setTab("syllabus")}>
            {s.type === "maths" ? "Syllabus" : s.type === "painting" ? "Themes" : s.type === "quiz" ? "Topics & Format" : s.type === "innovators" ? "Judging Criteria" : "Syllabus"}
          </button>}
        </div>

        {/* Body */}
        <div style={{ padding: "1.25rem 1.5rem", maxHeight: "60vh", overflowY: "auto" }}>
          {tab === "overview" && (
            <>
              {/* About */}
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, marginBottom: "1.25rem" }}>{seg.about}</p>

              {/* Info grid */}
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", marginBottom: 10 }}>Event Info</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1.25rem" }}>
                {seg.info.map((r) => (
                  <div key={r.label} style={{ background: "#f8f8f8", borderRadius: 8, padding: "8px 12px" }}>
                    <span style={{ fontSize: 11, color: "#999", display: "block", marginBottom: 2 }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Prizes */}
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", marginBottom: 10 }}>Prizes &amp; Rewards</p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <tbody>
                  {seg.prizes.map(([rank, reward]) => (
                    <tr key={rank} style={{ borderBottom: "0.5px solid #eee" }}>
                      <td style={{ padding: "7px 0", fontWeight: 600, color: "#0c3d14", width: "38%", verticalAlign: "top" }}>{rank}</td>
                      <td style={{ padding: "7px 0 7px 12px", color: "#555", verticalAlign: "top" }}>{reward}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Maths answer keys & question papers */}
              {seg.id === "maths" && (
                <>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", margin: "1.25rem 0 10px" }}>
                    Question Papers &amp; Answer Keys
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {mathsClasses.map((cls) => (
                      <div key={cls} style={{ background: "#f8f8f8", borderRadius: 8, padding: "10px 12px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0c3d14", display: "block", marginBottom: 6 }}>Class {cls}</span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                          {mathsSets.map((set) => (
                            <span key={set} style={{ fontSize: 12, color: "#555" }}>
                              Set {set}:{" "}
                              <a href={`/maths-papers/class${cls}-set${set}.pdf`} target="_blank" rel="noopener noreferrer" style={{ color: "#14710F", fontWeight: 600 }}>
                                Question Paper
                              </a>
                            </span>
                          ))}
                        </div>
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "0.5px solid #eee" }}>
                          <span style={{ fontSize: 12, color: "#555" }}>
                            Answer Key (all sets):{" "}
                            <a href={`/maths-keys/class${cls}.pdf`} target="_blank" rel="noopener noreferrer" style={{ color: "#14710F", fontWeight: 600 }}>
                              Download
                            </a>
                          </span>
                        </div>
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "0.5px solid #eee" }}>
                          <span style={{ fontSize: 12, color: "#555" }}>
                            Result:{" "}
                            <a href={`/results/maths-class${cls}-result.pdf`} target="_blank" rel="noopener noreferrer" style={{ color: "#14710F", fontWeight: 600 }}>
                              View Result
                            </a>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Pre-NEET result link */}
              {seg.id === "preneet" && (
                <>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", margin: "1.25rem 0 10px" }}>
                    Exam Result
                  </p>
                  <div style={{ background: "#f8f8f8", borderRadius: 8, padding: "10px 12px" }}>
                    <span style={{ fontSize: 12, color: "#555" }}>
                      Merit List / Scorecard:{" "}
                      <a href="/results/preneet-result.pdf" target="_blank" rel="noopener noreferrer" style={{ color: "#14710F", fontWeight: 600 }}>
                        View Result
                      </a>
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {tab === "syllabus" && s && (
            <>
              {/* MATHS SYLLABUS */}
              {s.type === "maths" && (
                <div>
                  <p style={{ fontSize: 13, color: "#555", marginBottom: "1rem", lineHeight: 1.6 }}>
                    The championship is conducted in <strong>6 separate categories</strong> (Class 3 to Class 8). Prizes are awarded independently for each category.
                  </p>
                  {s.categories.map((cat: any) => (
                    <div key={cat.category} style={{ marginBottom: "1.1rem", background: "#f8f8f8", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ background: "#0c3d14", padding: "8px 14px" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{cat.category}</p>
                      </div>
                      <div style={{ padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {cat.topics.map((t: string) => (
                          <span key={t} style={{ fontSize: 12, background: "#e8f5e9", color: "#2e7d32", padding: "3px 10px", borderRadius: 999, fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PAINTING THEMES */}
              {s.type === "painting" && (
                <div>
                  <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: "10px 14px", marginBottom: "1rem", fontSize: 13, color: "#5d4037", lineHeight: 1.6 }}>
                    ⚠️ <strong>Important:</strong> {s.note}
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", marginBottom: 10 }}>Possible Themes (prepare all)</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {s.themes.map((theme: string, i: number) => (
                      <div key={theme} style={{ background: "#f8f8f8", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0c3d14", background: "#e8f5e9", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontSize: 13, color: "#333" }}>{theme}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QUIZ TOPICS */}
              {s.type === "quiz" && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", marginBottom: 10 }}>Topics Covered</p>
                  <div style={{ marginBottom: "1.25rem" }}>
                    {s.topics.map((t: any) => (
                      <div key={t.name} style={{ background: "#f8f8f8", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0c3d14", marginBottom: 3 }}>{t.name}</p>
                        <p style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{t.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", marginBottom: 10 }}>Competition Format</p>
                  {s.format.map((step: string, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#0c3d14", background: "#e8f5e9", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                      <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>{step}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* INNOVATORS CRITERIA */}
              {s.type === "innovators" && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", marginBottom: 10 }}>Judging Criteria</p>
                  <div style={{ marginBottom: "1.25rem" }}>
                    {s.criteria.map((c: any, i: number) => (
                      <div key={c.name} style={{ background: "#f8f8f8", borderRadius: 8, padding: "10px 14px", marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0c3d14", background: "#e8f5e9", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0c3d14", marginBottom: 3 }}>{c.name}</p>
                          <p style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{c.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", marginBottom: 10 }}>Competition Format</p>
                  {s.format.map((step: string, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#0c3d14", background: "#e8f5e9", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                      <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>{step}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* PRE-NEET SYLLABUS */}
              {s.type === "preneet" && (
                <div>
                  <p style={{ fontSize: 13, color: "#555", marginBottom: "1rem", lineHeight: 1.6 }}>
                    The exam follows the standard <strong>NTA NEET syllabus</strong> covering Physics, Chemistry, and Biology (Botany + Zoology) from Class 11 and 12.
                  </p>
                  {s.subjects.map((subj: any) => (
                    <div key={subj.name} style={{ marginBottom: "1rem", background: "#f8f8f8", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ background: "#0c3d14", padding: "8px 14px" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{subj.name}</p>
                      </div>
                      <div style={{ padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {subj.topics.map((t: string) => (
                          <span key={t} style={{ fontSize: 12, background: "#e8f5e9", color: "#2e7d32", padding: "3px 10px", borderRadius: 999, fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "0.5px solid #eee", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", background: "#f9f9f9" }}>
          {seg.canRegister ? (
            <button
              style={{ background: "#14710F", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              onClick={() => { onClose(); onRegister((seg as any).registerHref ?? "/events/matengfest/edufest_registration"); }}
            >
              Register Now →
            </button>
          ) : (
            <button style={{ background: "#f0f0f0", color: "#aaa", border: "0.5px solid #ddd", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "not-allowed" }} disabled>
              Registration Closed
            </button>
          )}
          {/* Syllabus Download */}
          {/* <a
  href={`/bulletin.pdf`}
  download
  style={{
    background: "#ffffff",
    color: "#14710F",
    border: "1px solid #14710F",
    borderRadius: 8,
    padding: "9px 18px",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  Download Prospectus & Syllabus
</a> */}

          <span style={{ fontSize: 12, color: "#aaa", marginLeft: "auto" }}>Contact: +91 60094 49928</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── ANNOUNCEMENT POPUP ────────────────────────────────────────────
// Now covers BOTH: (1) exam results being declared, and
// (2) Mathematics Championship question papers & answer keys release.
function AnnouncementModal({
  onClose,
  onView,
  onCheckResult,
}: {
  onClose: () => void;
  onView: () => void;
  onCheckResult: () => void;
}) {
  return (
    <motion.div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1100, padding: "1.5rem",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        style={{
          background: "#fff", borderRadius: 18, width: "100%", maxWidth: 420,
          border: "0.5px solid #ddd", overflow: "hidden", textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25 }}
      >
        <div style={{ background: "#0c3d14", padding: "1.5rem 1.5rem 1.25rem", position: "relative" }}>
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 14 }}
          >
            ✕
          </button>
          <div style={{ fontSize: 34, marginBottom: 8 }}>📢</div>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: 19, color: "#fff", fontWeight: 700, lineHeight: 1.35 }}>
            Announcement
          </h3>
        </div>

        <div style={{ padding: "1.5rem" }}>

          
          {/* Grand Final */}
          <p
            style={{
              fontSize: 15,
              color: "#222",
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            🏆 Grand Final Event Timeline
          </p>

          <button
            onClick={() => window.open("/details.pdf", "_blank")}
            style={{
              background: "#f6ff00",
              color: "#333",
              border: "1px solid #c7d600",
              borderRadius: 8,
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: 14,
            }}
          >
            View Grand Final Details
          </button>

          <p
            style={{
              fontSize: 13,
              color: "#666",
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            The <strong>Mateng EduFest 2026 Grand Finale</strong> consists of the full
            day event schedule including registrations, competitions, innovation
            challenge presentations, prize distribution, and the closing ceremony.
          </p>

          {/* Results */}
          <p
            style={{
              fontSize: 15,
              color: "#222",
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            📢 Exam Results are Out!
          </p>

          <button
            onClick={onCheckResult}
            style={{
              background: "#14710F",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 14,
            }}
          >
            Check Exam Result
          </button>

          <p
            style={{
              fontSize: 13,
              color: "#666",
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            <strong>Pre-NEET Competition</strong> and{" "}
            <strong>Mathematics Championship</strong> results have been declared and
            are now available to view or download.
          </p>

          {/* Question Papers */}
          <p
            style={{
              fontSize: 15,
              color: "#222",
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            📄 Question Papers &amp; Answer Keys Released
          </p>

          <button
            onClick={onView}
            style={{
              background: "#fff",
              color: "#14710F",
              border: "1.5px solid #14710F",
              borderRadius: 8,
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 14,
            }}
          >
            View Question Papers &amp; Keys
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function MatengFestPage() {
  const [openTl, setOpenTl] = useState<string | null>("maths");
  const [modalSeg, setModalSeg] = useState<Segment | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const router = useRouter();

  const toggleTl = (id: string) =>
    setOpenTl((prev) => (prev === id ? null : id));

  // Show the "results declared / papers & keys released" popup once per browser session
  useEffect(() => {
    const alreadySeen = sessionStorage.getItem("edufestAnnouncementSeen");
    if (!alreadySeen) {
      setShowAnnouncement(true);
      sessionStorage.setItem("edufestAnnouncementSeen", "true");
    }
  }, []);

  return (
    <div className={styles.container}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={styles.heroInner}
        >
          <Image
            src="/mateng-edufest-logo.png"
            alt="Mateng EduFest 2026"
            width={600}
            height={100}
            priority
          />
          <h1 className={styles.heroTitle}>Academic Excellence Platform 2026</h1>
          {/* <p className={styles.heroSub}>Competitive • Structured • Scholarship Driven</p> */}
          {/* EduFest Registration */}
<p
  style={{
    fontSize: 15,
    color: "#222",
    fontWeight: 600,
    marginBottom: 10,
  }}
>
  🎓 EduFest Registration is Open!
</p>

<button
  onClick={() => window.location.href = "/events/matengfest/edufest_registration"}
  style={{
    background: "#14710F",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 22px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 14,
  }}
>
  Register Now →
</button>

<p
  style={{
    fontSize: 13,
    color: "#666",
    lineHeight: 1.6,
    marginBottom: 20,
  }}
>
  Register now for <strong>Mateng EduFest 2026</strong> — spots are limited and
  registration closes soon.
</p>
          <div className={styles.heroButtons} style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <motion.button
              onClick={() => window.open("/details.pdf", "_blank")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                background: "linear-gradient(135deg, #FFD600, #FFF176)",
                border: "none",
                borderRadius: 14,
                padding: "1.1rem 1.5rem",
                cursor: "pointer",
                boxShadow: "0 12px 30px rgba(255,214,0,.25)",
                textAlign: "left",
              }}
            >
              
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>🏆</span>
                <div>
                  
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#222",
                      margin: 0,
                    }}
                  >
                    Grand Final Event Timeline
                  </p>
                  <p
                    style={{
                      fontSize: 12.5,
                      color: "#555",
                      margin: "2px 0 0",
                    }}
                  >
                    View the complete schedule for the Mateng EduFest 2026 Grand Finale.
                  </p>
                </div>
              </div>

              <span
                style={{
                  background: "#222",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                View Timeline →
              </span>
            </motion.button>
            {/* <button
    onClick={() => router.push("/events/matengfest/edufest_registration")}
    className={styles.primaryBtn}
  >
    Register for EduFest →
  </button> */}

            {/* Prospectus Download */}
            {/* <a
    href="/bulletin.pdf"
    download
    style={{
      padding: "12px 20px",
      borderRadius: "10px",
      background: "#ffffff",
      color: "#14710F",
      border: "2px solid #14710F",
      fontWeight: 600,
      fontSize: "14px",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "0.2s",
    }}
  >
    Download Prospectus & Syllabus
  </a> */}
          </div>
        </motion.div>
      </section>

      {/* ── EXAM RESULTS ── */}
      <ExamResultsBanner onCheck={() => setShowResultModal(true)} />

      {/* ── CO-POWERED ── */}
      <div className="w-full flex justify-center px-4 mt-10">
        <Link href="https://kangleicareersolution.co.in/index" target="_blank" className="w-full sm:w-[95vw] md:w-[85vw] lg:w-[75vw]">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
            <div className="px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="text-center md:text-left max-w-xl">
                <h1 className="text-2xl md:text-4xl font-extrabold text-[#14710f] tracking-tight">Co-Powered By</h1>
                <p className="text-base md:text-lg text-gray-600 mt-3">In Strategic Partnership With</p>
                <p className="text-sm md:text-base mt-4 font-semibold text-gray-800">Empowering Students Through Structured Competitive Platforms</p>
              </div>
              <div className="bg-gray-50 rounded-2xl px-10 py-8 shadow-md">
                <Image src="/kanglei.png" alt="Kanglei Career Solutions" width={260} height={120} />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ── INTERACTIVE TIMELINE ── */}
      <section className={styles.timelineSection}>
        <h2 className={styles.sectionTitle}>EduFest Timeline</h2>

        <div className={styles.timelineWrapper}>
          <div className={styles.timelineLine} />
          {timelineEvents.map((ev) => {
            const isOpen = openTl === ev.id;
            return (
              <motion.div
                key={ev.id}
                className={styles.timelineItem}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <button
                  onClick={() => toggleTl(ev.id)}
                  className={`${styles.timelineCircleBtn} ${isOpen ? styles.timelineCircleActive : ""}`}
                  aria-label={`Toggle ${ev.name}`}
                />
                <h4>{ev.date}</h4>
                {ev.id === "grand" ? (
                  <>
                    <p className={styles.grandLabel}>Grand Final</p>
                    <div className={styles.eventGroup}>
                      <p>Painting Competition</p>
                      <p>Quiz Championship</p>
                      <p>Young Innovators Challenge</p>
                      <p>Prize Distribution Ceremony</p>
                    </div>
                  </>
                ) : (
                  <p>{ev.name}</p>
                )}
                {ev.open && !ev.closed && <span className={styles.tlPinOpenBadge}>Open</span>}
                {ev.closed && (
                  <span style={{ display: "inline-block", marginTop: 6, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "#fce4ec", color: "#c62828" }}>Closed</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Expand panel */}
        <AnimatePresence initial={false}>
          {openTl && (() => {
            const ev = timelineEvents.find((e) => e.id === openTl);
            if (!ev) return null;
            return (
              <motion.div
                key={openTl}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className={styles.tlDetailPanel}>
                  <div className={styles.tlDetailLeft}>
                    <div className={styles.tlChips}>
                      {ev.chips.map((c) => (
                        <span key={c} className={styles.tlChip}>{c}</span>
                      ))}
                      {ev.open && !ev.closed && (
                        <span className={`${styles.tlChip} ${styles.tlChipGreen}`}>Registration Open</span>
                      )}
                      {ev.closed && (
                        <span className={styles.tlChip} style={{ background: "#fce4ec", color: "#c62828", border: "1px solid #f5a0b0" }}>Registration Closed</span>
                      )}
                    </div>

                    <p className={styles.tlBody}>{ev.body}</p>

                    <div className={styles.tlInfoGrid}>
                      {ev.info.map((row) => (
                        <div key={row.label} className={styles.tlInfoRow}>
                          <span className={styles.tlInfoLabel}>{row.label}</span>
                          <span className={styles.tlInfoValue}>{row.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.tlCta}>
                      {ev.canRegister ? (
                        <button onClick={() => router.push(ev.registerHref!)} className={styles.primaryBtn}>
                          Register Now →
                        </button>
                      ) : ev.closed ? (
                        <>
                          <button className={styles.primaryBtn} style={{ opacity: 0.45, cursor: "not-allowed" }} disabled>Registration Closed</button>
                          {ev.rulesHref && (
                            <button onClick={() => router.push(ev.rulesHref!)} className={styles.secondaryBtn}>Rules &amp; Regulations</button>
                          )}
                        </>
                      ) : (
                        <button className={styles.secondaryBtn}>Coming Soon</button>
                      )}
                      {ev.id !== "grand" && (
                        <button
                          className={styles.secondaryBtn}
                          onClick={() => setModalSeg(segments.find((s) => s.id === ev.id) ?? null)}
                        >
                          More Details
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.tlDetailRight}>
                    <p className={styles.tlPrizesTitle}>Prizes &amp; Rewards</p>
                    <ul className={styles.tlPrizeList}>
                      {ev.prizes.map(([rank, reward]) => (
                        <li key={rank}><strong>{rank}:</strong> {reward}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </section>

      {/* ── MATHEMATICS SECTION ── */}
      <section className={styles.mathsSection}>
        <h2 className={styles.sectionTitle}>Mathematics Championship</h2>
        <div className={styles.mathsCard}>
          <div className={styles.mathsHeader}>
            <div className={styles.mathsIconWrap}>∑</div>
            <div>
              <h3 className={styles.mathsTitle}>Mathematics Championship</h3>
              <p className={styles.mathsSub}>First structured math olympiad for young minds in Manipur — Class 3 to 8</p>
            </div>
          </div>
          <div className={styles.mathsBody}>
            <div className={styles.mathsCol}>
              <p className={styles.mathsColLabel}>Event Details</p>
              {[
                ["Eligibility", "Class 3 – 8"],
                ["Registration Fee", "₹200"],
                ["Exam Date", "12th July 2026"],
                ["Last Date", "07th July 2026"],
                ["Admit Card", "10th July 2026"],
                ["Prize Distribution", "26th July 2026"],
                ["Venue", "Kakching, Thoubal, Bishnupur, Imphal West"],
                ["Duration", "2 hours"],
                ["Format", "MCQ"],
              ].map(([k, v]) => (
                <div key={k} className={styles.mathsRow}>
                  <span className={styles.mathsRowLabel}>{k}</span>
                  <span className={styles.mathsRowVal}>{v}</span>
                </div>
              ))}
            </div>
            <div className={styles.mathsCol}>
              <p className={styles.mathsColLabel}>Prizes &amp; Rewards</p>
              {[
                ["1st Prize (per category)", "₹3,000 + Certificate + Memento + Book ₹1,000 + T-Shirt"],
                ["2nd Prize (per category)", "₹2,000 + Certificate + Memento + Book ₹1,000 + T-Shirt"],
                ["3rd Prize (per category)", "₹1,000 + Certificate + Memento + Book ₹1,000 + T-Shirt"],
                ["25 Consolation Prizes", "Cash Prize + Certificate + T-Shirt"],
                ["Best Institute Award", "Memento + Certificate of Recognition"],
              ].map(([rank, reward]) => (
                <div key={rank} className={styles.mathsPrizeRow}>
                  <strong>{rank}</strong>
                  <span>{reward}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Question Papers & Answer Keys */}
          <div style={{ padding: "0 1.5rem 1.5rem" }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", margin: "0.5rem 0 12px" }}>
              Question Papers &amp; Answer Keys
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
              {mathsClasses.map((cls) => (
                <div key={cls} style={{ background: "#f8f8f8", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #eee" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0c3d14", marginBottom: 8 }}>Class {cls}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {mathsSets.map((set) => (
                      <div key={set} style={{ fontSize: 12, color: "#555", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <span style={{ fontWeight: 600, color: "#333" }}>Set {set}</span>
                        <a href={`/maths-papers/class${cls}-set${set}.pdf`} target="_blank" rel="noopener noreferrer" style={{ color: "#14710F", fontWeight: 600, textDecoration: "none" }}>
                          Question Paper
                        </a>
                      </div>
                    ))}
                    <div style={{ fontSize: 12, color: "#555", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "0.5px solid #e5e5e5", marginTop: 4, paddingTop: 6 }}>
                      <span style={{ fontWeight: 600, color: "#333" }}>Answer Key</span>
                      <a href={`/maths-keys/class${cls}.pdf`} target="_blank" rel="noopener noreferrer" style={{ color: "#14710F", fontWeight: 600, textDecoration: "none" }}>
                        Download (all sets)
                      </a>
                    </div>
                    <div style={{ fontSize: 12, color: "#555", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "0.5px solid #e5e5e5", marginTop: 4, paddingTop: 6 }}>
                      <span style={{ fontWeight: 600, color: "#333" }}>Result</span>
                      <a href={`/results/maths-class${cls}-result.pdf`} target="_blank" rel="noopener noreferrer" style={{ color: "#14710F", fontWeight: 600, textDecoration: "none" }}>
                        View Result
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.mathsFooter}>
            <button className={styles.secondaryBtn} onClick={() => setModalSeg(segments.find((s) => s.id === "maths")!)}>
              More Details &amp; Syllabus
            </button>
            <button className={styles.primaryBtn} style={{ opacity: 0.45, cursor: "not-allowed" }} disabled>
              Registration Closed
            </button>
          </div>
        </div>
      </section>

      {/* ── PRE-NEET FEATURE ── */}
      <section className={styles.feature}>
        <div className={styles.featureGrid}>
          <div>
            <h2>Pre-NEET Competition</h2>
            <p className={styles.highlight}>First Structured Pre-NEET Platform in Manipur. A Real-Time NEET Performance Experience.</p>
            <p>All participants will be eligible for a ₹1,00,000 scholarship if they choose to pursue MBBS abroad through Mateng Events.</p>
            <p className={styles.meta}>Registration Fee: ₹250</p>
            <button
              type="button"
              onClick={() => router.push("/events/matengfest/preneet/preneetrules")}
              style={{ marginTop: "16px", padding: "12px 22px", backgroundColor: "#ffffff", color: "#14710F", border: "2px solid #14710F", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}
            >
              Rules &amp; Regulations
            </button>
            <div className={styles.dateBox}>
              <h2>Important Dates &amp; Venue</h2>
              <ul>
                <li><strong>Exam Date:</strong> 20th April 2026</li>
                <li><strong>Prize Distribution:</strong> 26th July 2026</li>
                <h4><strong>Venue: </strong>Manipur University, Imphal</h4>
              </ul>
            </div>
          </div>
          <div className={styles.prizeCard}>
            <h2><strong>Top Rewards</strong></h2>
            <ul>
              <li><strong>1st Prize:</strong> ₹10,000 </li>
              <li><strong>2nd Prize:</strong> ₹5,000 </li>
              <li><strong>3rd Prize:</strong> ₹3,000 </li>
              <li><strong>10 Consolation Prizes:</strong> Cash Prize </li>
              {/* <li><strong>Best Institute Award</strong></li> */}
            </ul>
            <div className={styles.answerLinks}>
              <p>Download Pre-NEET Answer Key:</p>
              <a href="/SetA.pdf" target="_blank" rel="noopener noreferrer">Set A</a>{" | "}
              <a href="/SetB.pdf" target="_blank" rel="noopener noreferrer">Set B</a>{" | "}
              <a href="/SetC.pdf" target="_blank" rel="noopener noreferrer">Set C</a>{" | "}
              <a href="/Key.pdf" target="_blank" rel="noopener noreferrer">Solutions Key (Based on Set A)</a>
            </div>
          </div>
        </div>
      </section>



      {/* ── CHAMPIONSHIP SEGMENTS ── */}
      <section className={styles.segments}>
        <h2 className={styles.sectionTitle}>Championship Segments</h2>
        <p className={styles.segmentsNote}>Click any segment to view full details, syllabus, and registration.</p>
        <div className={styles.segmentGrid}>
          {segments.map((seg) => (
            <button key={seg.id} className={styles.segmentCard} onClick={() => setModalSeg(seg)}>
              {seg.closed ? (
                <span className={styles.segSoonBadge} style={{ background: "#fce4ec", color: "#c62828" }}>Closed</span>
              ) : seg.open ? (
                <span className={styles.segOpenBadge}>Open</span>
              ) : (
                <span className={styles.segSoonBadge}>Soon</span>
              )}
              <h3>{seg.name}</h3>
              <p>{seg.sub}</p>
              <p className={styles.segFee}>{seg.fee} Registration</p>
              <p className={styles.segDate}>{seg.date}</p>
              <span className={styles.segViewBtn}>View Details &amp; Syllabus →</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── GRAND FINAL ── */}
      <section className={styles.grandFinal}>
        <h2 className={styles.sectionTitle}>Grand Final Event – 26th July 2026</h2>
        <div className={styles.grandCard}>
          <h4>On-Spot Competitions:</h4>
          <ul>
            <li>Grand Final Quiz Competition</li>
            <li>Painting Competition</li>
            <li>Young Innovators Challenge</li>
          </ul>
          <p>The Grand Final will also include the Prize Distribution Ceremony for all Mateng EduFest 2026 championship segments.</p>
          <button
            type="button"
            onClick={() => router.push("/events/matengfest/edufest_registration")}
            style={{ marginTop: "20px", padding: "12px 24px", backgroundColor: "#14710F", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}
          >
            Register for EduFest →
          </button>
        </div>
      </section>

      {/* ── GENERAL RULES ── */}
      <section style={{ maxWidth: 860, margin: "0 auto 3rem", padding: "0 1rem" }}>
        <h2 className={styles.sectionTitle}>General Rules &amp; Regulations</h2>
        <div style={{ background: "#f8f8f8", borderRadius: 14, padding: "1.5rem", border: "0.5px solid #e0e0e0" }}>
          {[
            "Registration fees once paid are non-refundable.",
            "Participants must report at least 45 minutes before their scheduled event.",
            "Participants must carry their Admit Card along with a valid ID proof (Aadhaar Card, PAN Card, or School ID) for verification.",
            "Admit cards without the seal and signature of the competent authority will not be valid for entry.",
            "Mobile phones or unfair means are strictly prohibited during competitions.",
            "Negative marking will be applied if two candidates obtain the same score.",
            "Any form of misconduct may lead to disqualification.",
            "The decision of judges and the organizing committee will be final and binding.",
            "Requests for rechecking must be submitted within 10 days of result declaration, along with a rechecking fee of ₹1,000.",
            "The organizing committee reserves the right to modify rules if necessary.",
            
          ].map((rule, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#14710F", background: "#e8f5e9", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
              <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6, margin: 0 }}>{rule}</p>
            </div>
          ))}
        </div>

        {/* Application Centres */}
        <div style={{ marginTop: "1.5rem", background: "#f0f7f0", borderRadius: 14, padding: "1.5rem", border: "0.5px solid #c8e6c9" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0c3d14", marginBottom: 10 }}>📍 Offline Application Centres</p>
          {[
            "Mateng Office — Sagolband Sayang Leirak, Imphal (near Indian Oil Pump Sayang)",
            "Kanglei Career Solutions — Checkon, near Traffic Island Checkon",
            "Nefsa Education Consultant — Hapta, Imphal",
            "Kanglei Career Solutions — Thoubal Bazar, near Post Office Thoubal",
          ].map((centre, i) => (
            <p key={i} style={{ fontSize: 13, color: "#444", marginBottom: 5, lineHeight: 1.5 }}>• {centre}</p>
          ))}
          <p style={{ fontSize: 13, color: "#0c3d14", fontWeight: 600, marginTop: 10 }}>
            🌐 Apply online at: <a href="http://www.justmateng.com" target="_blank" rel="noopener noreferrer" style={{ color: "#14710F" }}>www.justmateng.com</a> (No form fee for online applications)
          </p>
        </div>
      </section>

      {/* ── DETAIL MODAL ── */}
      <AnimatePresence>
        {modalSeg && (
          <DetailModal
            seg={modalSeg}
            onClose={() => setModalSeg(null)}
            onRegister={(href) => router.push(href)}
          />
        )}
      </AnimatePresence>

      {/* ── ANNOUNCEMENT POPUP (results + papers/keys) ── */}
      <AnimatePresence>
        {showAnnouncement && (
          <AnnouncementModal
            onClose={() => setShowAnnouncement(false)}
            onView={() => {
              setShowAnnouncement(false);
              setModalSeg(segments.find((s) => s.id === "maths") ?? null);
            }}
            onCheckResult={() => {
              setShowAnnouncement(false);
              setShowResultModal(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── EXAM RESULT PICKER MODAL ── */}
      <AnimatePresence>
        {showResultModal && (
          <ExamResultModal onClose={() => setShowResultModal(false)} />
        )}
      </AnimatePresence>

      <footer className={styles.footer}>© 2026 Justmateng Service Pvt. Ltd.</footer>
    </div>
  );
}