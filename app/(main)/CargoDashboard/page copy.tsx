///Users/apple/Documents/GitHub/testmateng1/app/(main)/CargoDashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { BookingData, StatusCount } from "../../types/index"; // Import interfaces for bookings
import BookingDetailsPage from "@/app/(main)/CargoDashboard/cargo/BookingDetailsPage"; // Import new component for details
import styles from './dashboard.module.css'; // Add appropriate styles

const DashboardPage = () => {
  const supabase = useSupabaseClient();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusCount, setStatusCount] = useState<StatusCount>({ pending: 0, outForDelivery: 0, delivered: 0 });
  const [filters, setFilters] = useState({ startDate: "", endDate: "", searchTerm: "" });
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);

  // Fetch data from the API
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/book-cargo/dashboard");
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setBookings(data.data);
      setFilteredBookings(data.data);
      countStatus(data.data);
    } catch (error) {
      toast.error((error as Error).message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const countStatus = (bookings: BookingData[]) => {
    const counts = { pending: 0, outForDelivery: 0, delivered: 0 };
    bookings.forEach((booking) => {
      if (booking.status === "Pending") counts.pending += 1;
      if (booking.status === "Out for Delivery") counts.outForDelivery += 1;
      if (booking.status === "Delivered") counts.delivered += 1;
    });
    setStatusCount(counts);
  };

  // Handle search filters
  const handleFiltersChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = bookings;

    if (filters.startDate) {
      filtered = filtered.filter(
        (booking) => new Date(booking.created_at) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(
        (booking) => new Date(booking.created_at) <= new Date(filters.endDate)
      );
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.sender_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          booking.receiver_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          booking.receiver_phone?.includes(filters.searchTerm)
      );
    }

    setFilteredBookings(filtered);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters]);

  // Handle the view details action
  const handleViewDetails = (booking: BookingData) => {
    setSelectedBooking(booking);
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader className={styles.cardHeader}>
          <CardTitle className="text-xl">Cargo Booking Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters Section */}
          <div className="flex gap-2 items-center bg-white p-3 rounded-md">
  <input
    type="date"
    name="startDate"
    value={filters.startDate}
    onChange={handleFiltersChange}
    placeholder="Start Date"
    className="p-2 rounded-md bg-white text-black border border-gray-300 placeholder-gray-500"
  />
  <input
    type="date"
    name="endDate"
    value={filters.endDate}
    onChange={handleFiltersChange}
    placeholder="End Date"
    className="p-2 rounded-md bg-white text-black border border-gray-300 placeholder-gray-500"
  />
  <input
    type="text"
    name="searchTerm"
    value={filters.searchTerm}
    onChange={handleFiltersChange}
    placeholder="Search by name or phone"
    className="p-2 rounded-md bg-white text-black border border-gray-300 placeholder-gray-500"
  />
  <Button
    onClick={applyFilters}
    className="bg-white text-black border border-gray-400 hover:bg-gray-100"
  >
    Apply Filters
  </Button>
</div>


          {/* Status Summary */}
          <div className={styles.statusSummary}>
            <div>
              <h3>Pending Orders</h3>
              <p>{statusCount.pending}</p>
            </div>
            <div>
              <h3>Out for Delivery</h3>
              <p>{statusCount.outForDelivery}</p>
            </div>
            <div>
              <h3>Delivered</h3>
              <p>{statusCount.delivered}</p>
            </div>
          </div>

          {/* Table of Bookings */}
          {loading ? (
            <div className={styles.loaderContainer}>
              <Loader2 className="animate-spin h-8 w-8" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="py-3 px-4">Tracking ID</th>
                    <th className="py-3 px-4">Sender</th>
                    <th className="py-3 px-4">Receiver</th>
                    <th className="py-3 px-4">Receiver Number</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Weight (kg)</th>
                    <th className="py-3 px-4">Delivery Mode</th>
                    <th className="py-3 px-4">Pickup</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Estimate Charge (₹)</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-4">
                        No bookings found.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.tracking_id}>
                        <td className="py-2 px-4 text-black">{booking.tracking_id}</td>
                        <td className="py-2 px-4 text-black">{booking.sender_name}</td>
                        <td className="py-2 px-4 text-black">{booking.receiver_name}</td>
                        <td className="py-2 px-4 text-black">{booking.receiver_phone}</td>
                        <td className="py-2 px-4 text-black">{booking.product_name}</td>
                        <td className="py-2 px-4 text-black">{booking.weight_estimate}</td>
                        <td className="py-2 px-4 text-black">{booking.delivery_mode}</td>
                        {/* <td className="py-2 px-4 text-black">{booking.pickup_required}</td> */}
                        <td className="py-2 px-4 text-black">{booking.pickup_required ? "Yes" : "No"}</td>
                        <td className="py-2 px-4 text-black">{booking.status}</td>
                        <td className="py-2 px-4 text-black">{booking.estimate_charge.toFixed(2)}</td>
                        <td className="py-2 px-4">
                          <Button variant="outline" onClick={() => handleViewDetails(booking)}>
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conditionally Render Booking Details Page */}
      {selectedBooking && (
  <div className={styles.modalOverlay} onClick={() => setSelectedBooking(null)}>
    <BookingDetailsPage booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
  </div>
)}

    </div>
  );
};

export default DashboardPage;
