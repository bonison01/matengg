"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "./TrackPage.module.css";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookingData } from "../../types";

const TrackPage = () => {
  const [trackingId, setTrackingId] = useState("");
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);

  // === Fetch details from Supabase ===
  const handleTrack = async () => {
    if (!trackingId.trim()) {
      toast.error("Please enter a Tracking ID");
      return;
    }

    setLoading(true);
    setBooking(null);

    try {
      const { data, error } = await supabase
        .from("cargo_booking")
        .select("*")
        .eq("tracking_id", trackingId.trim())
        .single();

      if (error || !data) {
        toast.error("Tracking ID not found ❌");
      } else {
        setBooking(data);
        toast.success("Tracking details loaded ✅");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching tracking info ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <h2 className={styles.title}>Track Your Shipment</h2>
        <p className={styles.subtitle}>Enter your Tracking ID to view details(Only for cross state delivery)</p>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Enter Tracking ID (e.g. MTG0001)"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
          />
          <Button onClick={handleTrack} disabled={loading}>
            {loading ? "Loading..." : "Track"}
          </Button>
        </div>

        {/* === Result Section === */}
        {booking && (
          <div className={styles.resultBox}>
            <h3 className={styles.sectionTitle}>Shipment Details</h3>

            <div className={styles.infoRow}>
              <span>Tracking ID:</span>
              <strong>{booking.tracking_id}</strong>
            </div>

            {booking.third_party_tracking && (
              <div className={styles.infoRow}>
                <span>Third Party Tracking:</span>
                <strong>{booking.third_party_tracking}</strong>
              </div>
            )}

            <div className={styles.infoRow}>
              <span>Status:</span>
              <strong>{booking.status}</strong>
            </div>

            <div className={styles.infoRow}>
              <span>Delivery Mode:</span>
              <strong>{booking.delivery_mode || "N/A"}</strong>
            </div>

            <div className={styles.infoRow}>
              <span>Weight:</span>
              <strong>{booking.weight_estimate || "N/A"} kg</strong>
            </div>

            <hr />

            <h4 className={styles.sectionTitle}>Sender Information</h4>
            <p><strong>{booking.sender_name}</strong></p>
            <p>{booking.sender_phone}</p>
            <p>{booking.sender_address}</p>

            <h4 className={styles.sectionTitle}>Receiver Information</h4>
            <p><strong>{booking.receiver_name}</strong></p>
            <p>{booking.receiver_phone}</p>
            <p>{booking.receiver_address}</p>

            <hr />

<h4 className={styles.sectionTitle}>Product & Charges</h4>
<p><strong>Product:</strong> {booking.product_name}</p>

{/* ✅ Hide Estimate Charge if Final Charge exists */}
{!booking.final_charge && (
  <p><strong>Estimate Charge:</strong> ₹{booking.estimate_charge}</p>
)}

{/* === Final Charge Section with Smart Logic === */}
<div className={styles.finalChargeRow}>
  <p>
    <strong>Final Charge:</strong>{" "}
    {booking.final_charge ? `₹${booking.final_charge}` : "Pending"}
  </p>

  {booking.final_charge ? (
    <button
      className={styles.dropdownToggle}
      onClick={() => setShowPriceDetails(!showPriceDetails)}
    >
      {showPriceDetails ? "Hide Details ▲" : "Show Details ▼"}
    </button>
  ) : (
    <span className={styles.pendingText}>Pricing details pending...</span>
  )}
</div>

{/* === Price Breakdown (only if Final Charge exists) === */}
{booking.final_charge && showPriceDetails && (
  <div className={styles.priceDetailsBox}>
    <div className={styles.priceRow}>
      <span>Freight Charge:</span>
      <strong>₹{booking.estimate_charge || 0}</strong>
    </div>
    <div className={styles.priceRow}>
      <span>Handling Charge:</span>
      <strong>₹{booking.handling_charge || 0}</strong>
    </div>
    <div className={styles.priceRow}>
      <span>Docket Charge:</span>
      <strong>₹{booking.docket_charge || 0}</strong>
    </div>
    <div className={styles.priceRow}>
      <span>Pickup Charge:</span>
      <strong>₹{booking.pickup_charge || 0}</strong>
    </div>
    <div className={styles.priceRow}>
      <span>Packaging Charge:</span>
      <strong>₹{booking.packaging_charge || 0}</strong>
    </div>
    <div className={styles.priceRow}>
      <span>Extra Mile Delivery:</span>
      <strong>₹{booking.extra_mile_delivery || 0}</strong>
    </div>
  </div>
)}

<p><strong>Notes:</strong> {booking.notes || "No notes added"}</p>



            <div className={styles.footerNote}>
                <p> Third-Party Tracking ID refers to tracking numbers provided by external carriers, such as Post Office (ending with ‘IN’) or Bluedart. </p>
              <p>📦 Need help? Contact support at 9774795906</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPage;
