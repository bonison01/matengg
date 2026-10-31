import React, { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient"; // ✅ use your own Supabase client
import BookingDetailsForm from "./BookingDetailsForm";
import { BookingData } from "../../../types/index";
import styles from "./BookingDetailsPage.module.css";
import ReactDOMServer from "react-dom/server";

interface BookingDetailsPageProps {
  booking: BookingData;
  onClose: () => void;
}

const BookingDetailsPage = ({ booking, onClose }: BookingDetailsPageProps) => {
  const [selectedBooking, setSelectedBooking] = useState(booking);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Save Booking to Supabase
  const handleSave = async () => {
  try {
    setIsSaving(true);

    const { data, error, status } = await supabase
      .from("cargo_booking")
      .update({
        sender_name: selectedBooking.sender_name,
        receiver_name: selectedBooking.receiver_name,
        sender_phone: selectedBooking.sender_phone,
        receiver_phone: selectedBooking.receiver_phone,
        sender_address: selectedBooking.sender_address,
        receiver_address: selectedBooking.receiver_address,
        product_name: selectedBooking.product_name,
        weight_estimate: selectedBooking.weight_estimate,
        pickup_required: selectedBooking.pickup_required,
        delivery_required: selectedBooking.delivery_required,
        delivery_mode: selectedBooking.delivery_mode,
        notes: selectedBooking.notes,
        status: selectedBooking.status,
        handling_charge: selectedBooking.handling_charge,
        docket_charge: selectedBooking.docket_charge,
        third_party_tracking: selectedBooking.third_party_tracking,
        pickup_charge: selectedBooking.pickup_charge,
        packaging_charge: selectedBooking.packaging_charge,
        extra_mile_delivery: selectedBooking.extra_mile_delivery,
        estimate_charge: selectedBooking.estimate_charge,
        final_charge: selectedBooking.final_charge,
      })
      .eq("tracking_id", selectedBooking.tracking_id)
      .select(); // ✅ return updated rows

    console.log("Supabase update result:", { data, error, status });

    if (error) {
      toast.error(`Save failed: ${error.message}`);
    } else if (!data || data.length === 0) {
      toast.error("No matching record found for this tracking_id ❌");
    } else {
      toast.success("Booking updated successfully ✅");
    }
  } catch (err) {
    console.error("Unexpected save error:", err);
    toast.error("Unexpected error occurred ❌");
  } finally {
    setIsSaving(false);
  }
};

  // ✅ Handle input change (text + checkbox)
const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  const { name, value, type } = target;

  // ✅ Handle checkbox toggles correctly
  if (target instanceof HTMLInputElement && target.type === "checkbox") {
    setSelectedBooking((prev) => ({
      ...prev,
      [name]: target.checked,
    }));
  } else {
    setSelectedBooking((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
};




  // ✅ Label printing
  const handleDownloadLabel = () => {
    const labelContent = (
      <div>
        <h2>Shipping Label</h2>
        <p><strong>Sender:</strong> {selectedBooking.sender_name}</p>
        <p><strong>Receiver:</strong> {selectedBooking.receiver_name}</p>
        <p><strong>Address:</strong> {selectedBooking.sender_address} → {selectedBooking.receiver_address}</p>
      </div>
    );

    const labelString = ReactDOMServer.renderToStaticMarkup(labelContent);
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(labelString);
      iframeDoc.close();
      iframe.contentWindow?.print();
    }

    setTimeout(() => document.body.removeChild(iframe), 1000);
    toast.success("Printing label...");
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <BookingDetailsForm
        selectedBooking={selectedBooking}
        onInputChange={handleInputChange}
        handleSave={handleSave}
        handleDownloadLabel={handleDownloadLabel}
        onClose={onClose}
      />

      {/* Optional: show overlay when saving */}
      {isSaving && (
        <div className={styles.savingOverlay}>
          <div className={styles.savingText}>Saving...</div>
        </div>
      )}
    </div>
  );
};

export default BookingDetailsPage;
