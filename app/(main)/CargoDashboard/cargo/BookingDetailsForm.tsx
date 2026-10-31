import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookingData } from "../../../types/index"; // Import your data type
import styles from "./BookingDetailsPage.module.css"; // Import your CSS styles
import { jsPDF } from "jspdf";

// === INVOICE GENERATOR FUNCTION ===
const generateInvoice = (data: BookingData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor = "#14710F";
  const lightGray = "#F6F6F6";

  // === Helpers ===
  const addText = (text: string, x: number, y: number, maxWidth = 80) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return lines.length * 4.8; // compact spacing
  };

  const formatCurrency = (val: number | null | undefined) => {
    const num = val != null && !isNaN(val) ? Number(val) : 0;
    const formatted = num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `INR ${formatted}`;
  };

  // === Frame ===
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, pageWidth - 20, 280, "S");

  // === Header ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(primaryColor);
  doc.text("mateng", pageWidth / 2, 25, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(
    "Sagolband Sayang Leirak, Sagolband, Imphal, Manipur - 795004",
    pageWidth / 2,
    31,
    { align: "center" }
  );
  doc.text("Phone: 8787649928 | Website: justmateng.com | GSTIN: 14AAGCJ5156M1ZA", pageWidth / 2, 36, {
    align: "center",
  });
  

  // === Tracking Box ===
  doc.setFillColor("#E9F8E6");
  doc.roundedRect(25, 44, pageWidth - 50, 9, 2, 2, "F");
  doc.setTextColor(primaryColor);
  doc.setFontSize(11);
  doc.text(`Tracking ID: ${data.tracking_id || "N/A"}`, pageWidth / 2, 50, {
    align: "center",
  });

  // === Invoice Info ===
  const dateStr = data.created_at
    ? new Date(data.created_at).toISOString().split("T")[0]
    : "N/A";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Invoice #: ${data.tracking_id?.replace("MTG", "INV–") || "N/A"}`,
    25,
    62
  );
  doc.text(`Date: ${dateStr}`, 25, 67);
  doc.text("Payment: CASH", pageWidth - 60, 62);
  // doc.text("SAC: 996812", pageWidth - 60, 62);
  doc.setTextColor(primaryColor);
  doc.text("SAC: 996812", pageWidth - 60, 67);

  // === Sender / Receiver Boxes ===
  doc.setFillColor(lightGray);
  doc.roundedRect(25, 75, 75, 32, 2, 2, "F");
  doc.roundedRect(110, 75, 75, 32, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primaryColor);
  doc.text("FROM (SENDER):", 28, 82);
  doc.text("TO (RECEIVER):", 113, 82);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9.8);

  doc.text(`${data.sender_name || "N/A"}`, 28, 89);
  doc.text(`${data.sender_phone || "N/A"}`, 28, 94);
  addText(`${data.sender_address || "N/A"}`, 28, 99, 68);

  doc.text(`${data.receiver_name || "N/A"}`, 113, 89);
  doc.text(`${data.receiver_phone || "N/A"}`, 113, 94);
  addText(`${data.receiver_address || "N/A"}`, 113, 99, 68);

  doc.line(25, 112, 190, 112);

  // === Product Details ===
  let currentY = 120;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.setFontSize(12);
  doc.text("Product Details", 25, currentY);

  currentY += 8;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  currentY += addText(`Product Name: ${data.product_name || "-"}`, 25, currentY, 160);
  currentY += 5;
  doc.text(`Weight: ${data.weight_estimate || "N/A"} kg`, 25, currentY);
  currentY += 5;
  doc.text(`Delivery Mode: ${data.delivery_mode || "-"}`, 25, currentY);
  currentY += 5;
  doc.text(`Pickup Required: ${data.pickup_required ? "Yes" : "No"}`, 25, currentY);
  currentY += 5;
  currentY += addText(`Notes: ${data.notes || "-"}`, 25, currentY, 160);
  currentY += 5;

  doc.line(25, currentY, 190, currentY);
  currentY += 10;

    // === Pricing Details ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(primaryColor);
  doc.text("Pricing Details", 25, currentY);
  currentY += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const labelX = 30;
  const valueX = 110;
  const lineH = 7;

  const freightCharge = data.estimate_charge || 0;
  const handling = data.handling_charge || 0;
  const docket = data.docket_charge || 0;
  const packaging = data.packaging_charge || 0;
  const pickup = data.pickup_charge || 0;
  const extraMile = data.extra_mile_delivery || 0;
  const estimate = data.estimate_charge || 0;

const finalCharge =
  data.final_charge ??
  estimate +
    handling +
    docket +
    pickup +
    packaging +
    extraMile;


  // 🔹 Show all charge components in the PDF
  const charges = [
    ["Handling Charge", formatCurrency(handling)],
    ["Docket Charge", formatCurrency(docket)],
    ["Pickup Charge", formatCurrency(pickup)],
    ["Packaging Charge", formatCurrency(packaging)],
    ["Extra Mile Delivery", formatCurrency(extraMile)],
    ["Freight", formatCurrency(estimate)], // ✅ ADD THIS
  ];

  charges.forEach(([label, value]) => {
    currentY += lineH;
    doc.text(`${label}:`, labelX, currentY);
    doc.text(value, valueX, currentY);
  });

  currentY += 8;
  doc.line(25, currentY, 190, currentY);
  currentY += 10;

  // === Final Charge (Total Amount) ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor);
  doc.text("Final Charge (Total):", labelX, currentY);
  doc.text(formatCurrency(finalCharge), valueX, currentY);
  currentY += 10;

  doc.line(25, currentY, 190, currentY);
  currentY += 10;


  // === Footer ===
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(
    "Note: We are not liable for any prohibited or restricted items. Please refer to our terms and conditions.",
    25,
    currentY
  );
  currentY += 5;
  doc.text(
    "For 100kg+, electronics or medicines — GST invoice is mandatory.",
    25,
    currentY
  );
  currentY += 5;
  doc.text("Support: 9774795906 | Website: justmateng.com", 25, currentY);
  currentY += 8;

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.setFont("helvetica", "italic");
  doc.text(
    "This is a computer-generated invoice. No signature required.",
    25,
    currentY
  );

  // === Save ===
  doc.save(`Invoice-${data.tracking_id}.pdf`);
};

// === MAIN FORM COMPONENT ===
const BookingDetailsForm = ({
  selectedBooking,
  onInputChange,
  handleSave,
  handleDownloadLabel,
  onClose,
}: {
  selectedBooking: BookingData;
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleSave: () => void;
  handleDownloadLabel: () => void;
  onClose: () => void;
}) => {
  // ✅ Auto-calculate Final Charge
  useEffect(() => {
  const handling = Number(selectedBooking.handling_charge) || 0;
  const docket = Number(selectedBooking.docket_charge) || 0;
  const pickup = Number(selectedBooking.pickup_charge) || 0;
  const packaging = Number(selectedBooking.packaging_charge) || 0;
  const extra = Number(selectedBooking.extra_mile_delivery) || 0;
  const estimate = Number(selectedBooking.estimate_charge) || 0;

  const total =
    estimate +
    handling +
    docket +
    pickup +
    packaging +
    extra;

  if (selectedBooking.final_charge !== total) {
    onInputChange({
      target: { name: "final_charge", value: String(total) },
    } as unknown as React.ChangeEvent<HTMLInputElement>);
  }
}, [
  selectedBooking.estimate_charge,
  selectedBooking.handling_charge,
  selectedBooking.docket_charge,
  selectedBooking.pickup_charge,
  selectedBooking.packaging_charge,
  selectedBooking.extra_mile_delivery,
]);



  const handleDownloadInvoice = () => {
    generateInvoice(selectedBooking);
  };

  return (
    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
      <h3>Edit Booking Details</h3>

      {/* === Sender/Receiver Info === */}
      <div className={styles.formGroupRow}>
        <div className={styles.formGroup}>
          <label>Sender Name</label>
          <input
            type="text"
            name="sender_name"
            value={selectedBooking.sender_name}
            onChange={onInputChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Receiver Name</label>
          <input
            type="text"
            name="receiver_name"
            value={selectedBooking.receiver_name}
            onChange={onInputChange}
          />
        </div>
      </div>

      <div className={styles.formGroupRow}>
        <div className={styles.formGroup}>
          <label>Sender Phone</label>
          <input
            type="text"
            name="sender_phone"
            value={selectedBooking.sender_phone}
            onChange={onInputChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Receiver Phone</label>
          <input
            type="text"
            name="receiver_phone"
            value={selectedBooking.receiver_phone}
            onChange={onInputChange}
          />
        </div>
      </div>

      <div className={styles.formGroupRow}>
        <div className={styles.formGroup}>
          <label>Sender Address</label>
          <input
            type="text"
            name="sender_address"
            value={selectedBooking.sender_address}
            onChange={onInputChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Receiver Address</label>
          <input
            type="text"
            name="receiver_address"
            value={selectedBooking.receiver_address}
            onChange={onInputChange}
          />
        </div>
      </div>

      {/* === Product Info === */}
      <div className={styles.formGroup}>
        <label>Product Name</label>
        <input
          type="text"
          name="product_name"
          value={selectedBooking.product_name}
          onChange={onInputChange}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Weight Estimate</label>
        <input
          type="number"
          name="weight_estimate"
          value={selectedBooking.weight_estimate}
          onChange={onInputChange}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Product Photo URL</label>
        <input
          type="text"
          name="photo_url"
          value={selectedBooking.photo_url}
          onChange={onInputChange}
        />
      </div>

      <div className={styles.formGroupRow}>
        <div className={styles.formGroup}>
          <label>Pickup Required</label>
          <input
            type="checkbox"
            name="pickup_required"
            checked={selectedBooking.pickup_required}
            onChange={onInputChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Delivery Required</label>
          <input
            type="checkbox"
            name="delivery_required"
            checked={selectedBooking.delivery_required}
            onChange={onInputChange}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Delivery Mode</label>
        <select
          name="delivery_mode"
          value={selectedBooking.delivery_mode || ""}
          onChange={onInputChange}
        >
          {selectedBooking.delivery_mode &&
            !["Standard", "Express"].includes(selectedBooking.delivery_mode) && (
              <option value={selectedBooking.delivery_mode}>
                {selectedBooking.delivery_mode} (current)
              </option>
            )}
          <option value="">Select Delivery Mode</option>
          <option value="Standard">Standard</option>
          <option value="Express">Express</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Notes</label>
        <textarea
          name="notes"
          value={selectedBooking.notes}
          onChange={onInputChange}
        />
      </div>

      {/* === Tracking Section === */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Tracking Information</h4>
        <div className={styles.formGroup}>
          <label>Tracking ID</label>
          <input type="text" name="tracking_id" value={selectedBooking.tracking_id} readOnly />
        </div>
        <div className={styles.formGroup}>
          <label>Created At</label>
          <input
            type="date"
            name="created_at"
            value={selectedBooking.created_at ? selectedBooking.created_at.split("T")[0] : ""}
            onChange={onInputChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Third Party Tracking</label>
          <input
            type="text"
            name="third_party_tracking"
            value={selectedBooking.third_party_tracking || ""}
            onChange={onInputChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Status</label>
          <select
            name="status"
            value={selectedBooking.status}
            onChange={onInputChange}
          >
            {selectedBooking.status &&
              !["Pending", "Out for Delivery", "Delivered"].includes(selectedBooking.status) && (
                <option value={selectedBooking.status}>
                  {selectedBooking.status} (current)
                </option>
              )}
            <option value="Pending">Pending</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* === Pricing Section === */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Pricing Details</h4>

        <div className={styles.formGroup}>
          <label>Handling Charge</label>
          <input
            type="number"
            name="handling_charge"
            value={selectedBooking.handling_charge}
            onChange={onInputChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Docket Charge</label>
          <input
            type="number"
            name="docket_charge"
            value={selectedBooking.docket_charge}
            onChange={onInputChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Pickup Charge</label>
          <input
            type="number"
            name="pickup_charge"
            value={selectedBooking.pickup_charge}
            onChange={onInputChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Packaging Charge</label>
          <input
            type="number"
            name="packaging_charge"
            value={selectedBooking.packaging_charge}
            onChange={onInputChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Extra Mile Delivery</label>
          <input
            type="number"
            name="extra_mile_delivery"
            value={selectedBooking.extra_mile_delivery}
            onChange={onInputChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Frieght Charge</label>
          <input
            type="number"
            name="estimate_charge"
            value={selectedBooking.estimate_charge}
            onChange={onInputChange}
          />
        </div>

        {/* 🔹 Final Charge Auto Calculated */}
        <div className={styles.formGroup}>
          <label>Final Charge (Auto Calculated)</label>
          <input
            type="number"
            name="final_charge"
            value={selectedBooking.final_charge || 0}
            readOnly
            style={{ backgroundColor: "#f3f3f3", color: "black" }}
          />
        </div>
      </div>

      {/* === Download Buttons === */}
      <div className={styles.downloadButtons}>
        <button className={styles.downloadButton} onClick={handleDownloadInvoice}>
          Download Invoice
        </button>
        <button className={styles.downloadButton} onClick={handleDownloadLabel}>
          Download Label
        </button>
      </div>

      {/* === Save/Cancel === */}
      <div className={styles.modalActions}>
        <Button className={styles.buttonSave} onClick={handleSave}>
          Save
        </Button>
        <Button className={styles.buttonCancel} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default BookingDetailsForm;
