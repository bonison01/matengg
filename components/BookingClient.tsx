'use client';

import { Place } from "../app/types/place"; // Adjust path as needed
import BookingForm from "./BookingForm";

export default function BookingClient({ place }: { place: Place }) {
  return <BookingForm place={place} />;
}
