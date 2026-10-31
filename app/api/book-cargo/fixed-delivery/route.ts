import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateMap, Rate } from "@/utils/rateMap";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Constants for additional charges
const PICKUP_CHARGE = 30;
const DELIVERY_CHARGE = 40;

export async function POST(req: Request) {
  try {
    // Parse the incoming request body
    const body = await req.json();
    console.log("Received data:", body); // Debugging log

    const {
      userId,
      senderName,
      senderPhone,
      senderAddress,
      senderPincode,
      receiverName,
      receiverPhone,
      receiverAddress,
      receiverPincode,
      productName,
      weightEstimate,
      photoUrl,
      pickupRequired,
      deliveryRequired,
      deliveryMode,
      handlingCharge,
      docketCharge,
      notes,
    } = body;

    // Validate required fields
    if (
      !senderName ||
      !senderPhone ||
      !senderAddress ||
      !senderPincode ||
      !receiverName ||
      !receiverPhone ||
      !receiverAddress ||
      !receiverPincode ||
      !productName ||
      weightEstimate == null ||
      !deliveryMode
    ) {
      console.log("Missing required fields:", body); // Log missing fields
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate route key and fetch the corresponding rate from the rateMap
    const routeKey = `${senderPincode}-${receiverPincode}`;
    const rate: Rate | undefined = rateMap[routeKey];

    // If route is unsupported, set a default rate
    let base = 0;
    if (!rate) {
      // You can define a default rate or leave it as 0
      console.log("Unsupported route, using default rate.");
      base = 100; // You can choose a fixed charge for unsupported routes
    } else {
      // Calculate base charge according to weight
      if (weightEstimate <= 1) base = rate.upto_1kg;
      else if (weightEstimate <= 5) base = rate.upto_5kg;
      else base = rate.above_5kg;

      // Apply express delivery charge if selected
      if (deliveryMode === "express") {
        base *= 1.5;
      }
    }

    // Add additional charges for pickup, delivery, handling, and docket
    const pickupCharge = pickupRequired ? PICKUP_CHARGE : 0;
    const deliveryCharge = deliveryRequired ? DELIVERY_CHARGE : 0;
    const handling = handlingCharge || 0;
    const docket = docketCharge || 0;

    // Calculate total charge
    const totalCharge = base + pickupCharge + deliveryCharge + handling + docket;

    // Generate a unique tracking ID for the booking
    const trackingId = `SBX-${Math.floor(100000 + Math.random() * 900000)}`;

    // Insert the booking data into Supabase
    const { error } = await supabase.from("cargo_booking").insert({
      user_id: userId || null, // Allow userId to be optional or null
      sender_name: senderName,
      sender_phone: senderPhone,
      sender_address: senderAddress,
      sender_pincode: senderPincode,

      receiver_name: receiverName,
      receiver_phone: receiverPhone,
      receiver_address: receiverAddress,
      receiver_pincode: receiverPincode,

      product_name: productName,
      weight_estimate: weightEstimate,
      photo_url: photoUrl || null,

      pickup_required: pickupRequired,
      delivery_required: deliveryRequired,
      delivery_mode: deliveryMode,
      handling_charge: handling,
      docket_charge: docket,
      notes: notes || null,

      estimate_charge: totalCharge,
      tracking_id: trackingId,
      status: "Pending",
    });

    if (error) {
      console.error("Error inserting into Supabase:", error); // Log the error from Supabase
      throw error; // Rethrow the error
    }

    // Return a successful response with tracking ID and total charge
    return NextResponse.json({ success: true, trackingId, totalCharge });

  } catch (err: any) {
    console.error("Error in API handler:", err); // Log any error caught in the try block
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
