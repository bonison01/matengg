///Users/apple/Documents/justmateng1/app/(main)/admin/(protected)/cargo/invoice/[id]/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import InvoiceTemplate, { InvoiceBooking, invoiceNumber } from "../../InvoiceTemplate";

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [booking, setBooking] = useState<InvoiceBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/cargo/bookings/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Could not load this booking");
        setBooking(json.data as InvoiceBooking);
      } catch (err: any) {
        setError(err.message || "Could not load this booking");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBooking();
  }, [id]);

  // Prints the invoice from a brand-new, empty window that contains ONLY
  // the invoice markup — nothing else. This is the reliable fix for the
  // "extra blank pages" problem: no matter how the CSS is written, if the
  // invoice prints from *this* page, anything else mounted on it (a
  // dashboard table, a sidebar, a modal host, however deeply nested) can
  // still add its own height to what the browser paginates. A separate
  // window sidesteps that entirely — its page count can only ever be
  // driven by the invoice's own content.
  const handleDownload = () => {
    const invoiceEl = document.getElementById("invoice-print-area");
    if (!invoiceEl || !booking) return;

    const printWindow = window.open("", "_blank", "width=850,height=1100");

    if (!printWindow) {
      // Popup blocked — fall back to printing this page directly. Less
      // reliable (surrounding content could still add pages), but better
      // than doing nothing.
      window.print();
      return;
    }

    // Browsers default the "Save as PDF" filename to the document's
    // <title>, so name it after the invoice number and billing name
    // (falling back to sender if no billing name was captured) instead
    // of whatever generic title this app normally uses.
    const billingLabel = booking.billing_name || booking.sender_name || "invoice";
    const fileTitle = `${invoiceNumber(booking)} - ${billingLabel}`.replace(
      /[\\/:*?"<>|]+/g,
      ""
    );

    // Carry over every stylesheet this page is using (Tailwind's compiled
    // CSS, plus this component's own styled-jsx <style> tag) so the
    // invoice's classes still resolve inside the new window.
    const styleTags = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    )
      .map((el) => el.outerHTML)
      .join("\n");

    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${fileTitle}</title>
    ${styleTags}
    <style>
      @page { size: A4; margin: 0.5in; }
      html, body { margin: 0; padding: 0; background: #fff; }
    </style>
  </head>
  <body>${invoiceEl.outerHTML}</body>
</html>`);
    printWindow.document.close();

    // document.write's load event isn't reliably fired, so give the
    // copied stylesheets a brief moment to apply before printing.
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  return (
    <div className="min-h-screen bg-neutral-50 print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleDownload}
          disabled={!booking}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Download className="mr-1.5 h-4 w-4" />
          Download invoice
        </Button>
      </div>

      <div className="py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : error ? (
          <p className="text-center text-sm text-red-600">
            Could not load this booking: {error}
          </p>
        ) : booking ? (
          // ↓ this id is what handleDownload (and the print CSS fallback
          // below) both target
          <div id="invoice-print-area">
            <InvoiceTemplate booking={booking} />
          </div>
        ) : (
          <p className="text-center text-sm text-neutral-500">Booking not found.</p>
        )}
      </div>

      {/* Fallback only — used if the popup above gets blocked and we fall
          back to window.print() on this page directly. */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }

          body * {
            visibility: hidden;
          }

          #invoice-print-area,
          #invoice-print-area * {
            visibility: visible;
          }

          #invoice-print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}