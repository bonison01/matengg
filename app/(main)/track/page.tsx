"use client";

import React, { useState } from "react";
import styles from "./TrackPage.module.css";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type SheetBooking = {
  tracking_id: string;
  reference: string | null;
  date: string | null;
  customer_name: string | null;
  delivery_mode: string | null;
  weight_estimate: string | null;
};

const TrackPage = () => {
  const [trackingId, setTrackingId] = useState("");
  const [booking, setBooking] = useState<SheetBooking | null>(null);
  const [loading, setLoading] = useState(false);

  // === Fetch details from Google Sheets (via API route) ===
  const handleTrack = async () => {
    if (!trackingId.trim()) {
      toast.error("Please enter a Tracking ID");
      return;
    }

    setLoading(true);
    setBooking(null);

    try {
      const res = await fetch(
        `/api/track?id=${encodeURIComponent(trackingId.trim())}`
      );

      if (res.status === 409) {
        toast.error("Duplicate Tracking ID found. Please contact support ❌");
      } else if (res.status === 404) {
        toast.error("Tracking ID not found ❌");
      } else if (!res.ok) {
        toast.error("Error fetching tracking info ❌");
      } else {
        const data: SheetBooking = await res.json();
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
        <p className={styles.subtitle}>
          Enter your Tracking ID to view details (Only for cross state delivery)
        </p>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Enter Tracking ID (e.g. 20)"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
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

            <div className={styles.infoRow}>
              <span>Booking Date:</span>
              <strong>{booking.date || "N/A"}</strong>
            </div>

            <div className={styles.infoRow}>
              <span>Customer:</span>
              <strong>{booking.customer_name || "N/A"}</strong>
            </div>

            <div className={styles.infoRow}>
              <span>Delivery Mode:</span>
              <strong>{booking.delivery_mode || "N/A"}</strong>
            </div>

            <div className={styles.infoRow}>
              <span>Weight:</span>
              <strong>
                {booking.weight_estimate ? `${booking.weight_estimate} kg` : "N/A"}
              </strong>
            </div>

            <div className={styles.footerNote}>
              <p>📦 Need help? Contact support at 9774795906</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPage;