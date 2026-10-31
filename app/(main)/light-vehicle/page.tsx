"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import DistanceMatrixComponent from "@/components/map/DistanceMatrixComponent";
import Footer from "@/components/footer/Footer";
import { Pin, Truck, Package, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useSelector } from "react-redux";
import { Separator } from "@/components/ui/separator";
import { useRouter, usePathname } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CheckmarkCircle from "@/components/order/CheckmarkCircle";
import TruckAnimation from "@/components/order/TruckAnimation";
import Link from "next/link";
import { toast } from "sonner";

// Define the Location type from DistanceMatrixComponent
interface Location {
  coords: [number, number];
  name: string;
}

// Define the User type from your userSlice
interface User {
  customer_id: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  profile_pic?: string;
  whatsapp?: string;
  remarks?: string;
  order_record?: any;
  created_at?: string;
  updated_at?: string;
  dob?: string;
}

// Define the RootState based on your Redux store
interface RootState {
  user: {
    user: User | null;
    loading: boolean;
    error: string | null;
  };
}

export default function Page() {
  const { setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTruckAnimationDone, setIsTruckAnimationDone] = useState(false);
  const [isCheckmarkVisible, setIsCheckmarkVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickupPhoneError, setPickupPhoneError] = useState("");
  const [dropoffPhoneError, setDropoffPhoneError] = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null); // New state for order number

  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const [selectedVehicle, setSelectedVehicle] = useState<'two-wheeler' | 'light-vehicle'>('two-wheeler');

  const [mapData, setMapData] = useState<{
    pickup: Location | null;
    dropoff: Location | null;
    distance: number | null;
    time: string | null;
    price: string | null;
  }>({
    pickup: null,
    dropoff: null,
    distance: null,
    time: null,
    price: null,
  });

  const { user } = useSelector((state: RootState) => state.user);

  const [shippingDetails, setShippingDetails] = useState({
    pickupName: "",
    pickupPhone: "",
    pickupAddress: "",
    pickupInstructions: "",
    dropoffName: "",
    dropoffPhone: "",
    dropoffAddress: "",
    dropoffInstructions: "",
    isBusinessOrder: false,
  });

  const handleDataUpdate = useCallback(
    (data: {
      pickup: Location | null;
      dropoff: Location | null;
      distance: number | null;
      time: string | null;
      price: string | null;
    }) => {
      setMapData((prevData) => {
        if (
          prevData.pickup !== data.pickup ||
          prevData.dropoff !== data.dropoff ||
          prevData.distance !== data.distance ||
          prevData.time !== data.time ||
          prevData.price !== data.price
        ) {
          setShippingDetails((prev) => ({
            ...prev,
            pickupAddress: data.pickup?.name || prev.pickupAddress,
            dropoffAddress: data.dropoff?.name || prev.dropoffAddress,
          }));
          return { ...data };
        }
        return prevData;
      });
    },
    []
  );

  useEffect(() => {
    setTheme("dark");
    if (user) {
      setShippingDetails((prev) => ({
        ...prev,
        pickupName: user.name || prev.pickupName,
        pickupPhone: user.phone || prev.pickupPhone,
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Restrict phone inputs to digits only and validate
    if (name === "pickupPhone" || name === "dropoffPhone") {
      const digitsOnly = value.replace(/\D/g, ""); // Remove non-digits
      setShippingDetails((prev) => ({ ...prev, [name]: digitsOnly }));

      const phoneRegex = /^\d{10}$/;
      if (name === "pickupPhone") {
        setPickupPhoneError(digitsOnly && !phoneRegex.test(digitsOnly) ? "Phone number must be exactly 10 digits" : "");
      } else if (name === "dropoffPhone") {
        setDropoffPhoneError(digitsOnly && !phoneRegex.test(digitsOnly) ? "Phone number must be exactly 10 digits" : "");
      }
    } else {
      setShippingDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setShippingDetails((prev) => ({ ...prev, isBusinessOrder: checked }));
  };

  const resetFormAndMap = () => {
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(shippingDetails.pickupPhone)) {
      setPickupPhoneError("Phone number must be exactly 10 digits");
      return;
    }
    if (!phoneRegex.test(shippingDetails.dropoffPhone)) {
      setDropoffPhoneError("Phone number must be exactly 10 digits");
      return;
    }

    // const customerId = localStorage.getItem("customer_id");
    // const token = localStorage.getItem("token");

    // if (!customerId || !token) {
    //   setIsAlertOpen(true);
    //   return;
    // }

    const orderData = {
      pickup_name: shippingDetails.pickupName,
      pickup_phone: shippingDetails.pickupPhone,
      pickup_address: shippingDetails.pickupAddress,
      dropoff_name: shippingDetails.dropoffName,
      dropoff_phone: shippingDetails.dropoffPhone,
      dropoff_address: shippingDetails.dropoffAddress,
      instructions: {
        pickup: shippingDetails.pickupInstructions,
        dropoff: shippingDetails.dropoffInstructions,
      },
      distance: mapData.distance,
      charge: mapData.price ? parseFloat(mapData.price.replace("₹ ", "")) : null,
      pickup_cord: mapData.pickup?.coords.slice().reverse().join(","),
      dropoff_cord: mapData.dropoff?.coords.slice().reverse().join(","),
    //   customer_id: customerId,
      isBusiness: shippingDetails.isBusinessOrder ? 1 : 0,
      // Add the selected vehicle to the order data
      vehicle_type: selectedVehicle,
    };

    setIsSubmitting(true);
    setIsDialogOpen(true);

    try {
      const response = await fetch("/api/delivery-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const result = await response.json();
      console.log("Order created:", result);
      // Assuming the API returns an order number, update the state
      setOrderNumber(result.order_number || "N/A");

      setTimeout(() => {
        setIsTruckAnimationDone(true);
      }, 4000);
      setTimeout(() => {
        setIsCheckmarkVisible(true);
      }, 3500);
      setTimeout(() => {
        setIsSubmitting(false);
        // Do not reload, let the user see the confirmation dialog
        // You can add a button to close the dialog or navigate away.
      }, 5500);
    } catch (error: any) {
      console.error("Error submitting order:", error);
      setIsSubmitting(false);
      setIsDialogOpen(false);
      toast.error("Something went wrong while placing your order.", {
        position: "top-right",
      });
    }
  };

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [showForm]);

  return (
    <ScrollArea>
      <div className="w-[100vw] h-[100svh] relative flex flex-col justify-between sm:p-4 poppins">
        <div className="mb-[4rem]">
          <div className="w-full h-16"></div>

          <div className='relative flex flex-col items-start p-4 my-6 sm:hidden sm:h-0'>
            <CardDescription className="text-sm mb-3 text-gray-300 px-2">Visit our cargo service page to get started.</CardDescription>
            <a href="/CargoBookingPage">
              <button
                type="submit"
                className="flex px-5 py-2.5 font-semibold justify-center gap-10 items-center mx-auto shadow-md text-sm text-white bg-gradient-to-tr from-green-900/30 via-green-900/70 to-green-900/30 ring-4 ring-green-900/20 backdrop-blur-md lg:font-medium isolation-auto before:absolute before:w-full before:transition-all before:duration-500 hover:before:w-full before:right-full hover:before:right-0 before:rounded-full before:bg-green-700 hover:text-gray-50 before:-z-10 before:aspect-square hover:before:scale-150 hover:before:duration-500 relative z-10 px-3.5 py-1.5 overflow-hidden border-2 rounded-full group"
              >
                Cargo Serice
                <svg
                  className="w-5 h-5 justify-end group-hover:rotate-90 group-hover:bg-gray-50 text-white ease-linear duration-300 rounded-full border border-white group-hover:border-none p-1 rotate-45"
                  viewBox="0 0 16 19"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z"
                    className="fill-white group-hover:fill-gray-800"
                  ></path>
                </svg>
              </button>
            </a>
          </div>

          <div className="w-full max-w-[1400px] mx-auto mb-4 p-4 relative">
            <div className="w-full flex justify-between">
              <span className="text-3xl font-bold mb-6 flex justify-center items-center leading-none gap-1 w-fit bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-400">
                <Pin className="text-gray-300" />
                Set Your Locations
              </span><br /><br />

              

              <a href="/CargoBookingPage" className="hidden sm:flex">
                <button
                  type="submit"
                  className="flex px-5 h-10 mr-2 font-semibold justify-center gap-4 items-center mx-auto shadow-md text-sm text-white bg-gradient-to-tr from-green-900/30 via-green-900/70 to-green-900/30 ring-4 ring-green-900/20 backdrop-blur-md lg:font-medium isolation-auto before:absolute before:w-full before:transition-all before:duration-500 hover:before:w-full before:right-full hover:before:right-0 before:rounded-full before:bg-green-700 hover:text-gray-50 before:-z-10 before:aspect-square hover:before:scale-150 hover:before:duration-500 relative z-10 px-3.5 py-1.5 overflow-hidden border-2 rounded-full group"
                >
                  Cargo Serice
                  <svg
                    className="w-5 h-5 justify-end group-hover:rotate-90 group-hover:bg-gray-50 text-white ease-linear duration-300 rounded-full border border-white group-hover:border-none p-1 rotate-45"
                    viewBox="0 0 16 19"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z"
                      className="fill-white group-hover:fill-gray-800"
                    ></path>
                  </svg>
                </button>
              </a>
            </div>

            <DistanceMatrixComponent
              onDataUpdate={handleDataUpdate}
              onBookService={() => setShowForm(true)}
              selectedVehicle={selectedVehicle}
              onSelectVehicle={setSelectedVehicle}
            />
          </div>

          {showForm && mapData.pickup && mapData.dropoff && mapData.distance !== null ? (
            <div ref={formRef} className="p-4">
              <Card className="w-full max-w-[900px] mx-auto border-zinc-600 gap-5">
                <CardHeader>
                  <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-400">
                    SHIPPING DETAILS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Separator className="bg-zinc-600 mb-4 " />
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="text-lg font-semibold text-gray-300 flex flex-row gap-3">
                        <Truck /> Pickup Details
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="px-2">
                          <Label htmlFor="pickupName" className="mb-2 text-blue-400">
                            Name
                          </Label>
                          <Input
                            id="pickupName"
                            name="pickupName"
                            value={shippingDetails.pickupName}
                            onChange={handleInputChange}
                            placeholder="Enter pickup name"
                            required
                          />
                        </div>
                        <div className="px-2">
                          <Label htmlFor="pickupPhone" className="mb-2 text-blue-400">
                            Phone
                          </Label>
                          <Input
                            id="pickupPhone"
                            name="pickupPhone"
                            value={shippingDetails.pickupPhone}
                            onChange={handleInputChange}
                            placeholder="Enter pickup phone"
                            required
                            maxLength={10}
                            className={pickupPhoneError ? "border-red-500" : ""}
                          />
                          {pickupPhoneError && (
                            <p className="text-red-500 text-sm mt-1">{pickupPhoneError}</p>
                          )}
                        </div>
                      </div>
                      <div className="px-2">
                        <Label htmlFor="pickupAddress" className="mb-2 text-blue-400">
                          Address
                        </Label>
                        <Input
                          id="pickupAddress"
                          name="pickupAddress"
                          value={shippingDetails.pickupAddress}
                          onChange={handleInputChange}
                          placeholder="Enter pickup address"
                          required
                        />
                      </div>
                      <div className="px-2">
                        <Label htmlFor="pickupInstructions" className="mb-2 text-blue-400">
                          Instructions
                        </Label>
                        <Textarea
                          id="pickupInstructions"
                          name="pickupInstructions"
                          value={shippingDetails.pickupInstructions}
                          onChange={handleInputChange}
                          placeholder="Enter pickup instructions (optional)"
                        />
                      </div>
                    </div>

                    <Separator className="bg-zinc-600 " />

                    <div className="space-y-4">
                      <div className="text-lg font-semibold text-gray-300 flex flex-row gap-3">
                        <Package /> Dropoff Details
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="px-2">
                          <Label htmlFor="dropoffName" className="mb-2 text-green-500">
                            Name
                          </Label>
                          <Input
                            id="dropoffName"
                            name="dropoffName"
                            value={shippingDetails.dropoffName}
                            onChange={handleInputChange}
                            placeholder="Enter dropoff name"
                            required
                          />
                        </div>
                        <div className="px-2">
                          <Label htmlFor="dropoffPhone" className="mb-2 text-green-500">
                            Phone
                          </Label>
                          <Input
                            id="dropoffPhone"
                            name="dropoffPhone"
                            value={shippingDetails.dropoffPhone}
                            onChange={handleInputChange}
                            placeholder="Enter dropoff phone"
                            required
                            maxLength={10}
                            className={dropoffPhoneError ? "border-red-500" : ""}
                          />
                          {dropoffPhoneError && (
                            <p className="text-red-500 text-sm mt-1">{dropoffPhoneError}</p>
                          )}
                        </div>
                      </div>
                      <div className="px-2">
                        <Label htmlFor="dropoffAddress" className="mb-2 text-green-500">
                          Address
                        </Label>
                        <Input
                          id="dropoffAddress"
                          name="dropoffAddress"
                          value={shippingDetails.dropoffAddress}
                          onChange={handleInputChange}
                          placeholder="Enter dropoff address"
                          required
                        />
                      </div>
                      <div className="px-2">
                        <Label htmlFor="dropoffInstructions" className="mb-2 text-green-500">
                          Instructions
                        </Label>
                        <Textarea
                          id="dropoffInstructions"
                          name="dropoffInstructions"
                          value={shippingDetails.dropoffInstructions}
                          onChange={handleInputChange}
                          placeholder="Enter dropoff instructions (optional)"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 px-3">
                      <Checkbox
                        id="isBusinessOrder"
                        className="border-gray-400"
                        checked={shippingDetails.isBusinessOrder}
                        onCheckedChange={handleCheckboxChange}
                      />
                      <Label htmlFor="isBusinessOrder" className="text-gray-300">
                        Is a business order
                      </Label>
                    </div>

                    <Separator className="bg-zinc-600 " />

                    <div className="sm:px-4 rounded-lg">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-200 text-lg font-medium">Distance</span>
                          <span className="text-blue-400 text-lg font-semibold">{mapData.distance?.toFixed(1)} km</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-200 text-lg font-medium">Time</span>
                          <span className="text-green-600 text-lg font-semibold">{mapData.time}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-200 text-lg font-medium">Delivery Charges</span>
                          <span className="text-green-600 text-lg font-semibold">₹ {mapData.price}</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-zinc-600 " />

                    <CardFooter className="flex justify-end gap-5 px-0">
                      <Button
                        variant="destructive"
                        className="text-white bg-red-500"
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="text-white"
                        type="submit"
                        disabled={
                          !mapData.pickup ||
                          !mapData.dropoff ||
                          isSubmitting ||
                          pickupPhoneError !== "" ||
                          dropoffPhoneError !== ""
                        }
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Placing...
                          </>
                        ) : (
                          "Place Order"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-center text-gray-300">Select pick-up and drop-off locations to see details.</p>
          )}
        </div>

        <Footer />
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to submit an order. Please log in to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-white"
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(pathname)}`)}
            >
              Go to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDialogOpen} onOpenChange={() => { }}>
        <DialogContent
          className="flex flex-col items-center p-6 w-80 gap-4"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{isCheckmarkVisible ? "Order Confirmed!" : "Order Confirmation"}</DialogTitle>
            <DialogDescription>
              {isCheckmarkVisible
                ? "We'll notify you once it's ready for shipping."
                : "Your order is being processed."}
            </DialogDescription>
          </DialogHeader>

          {isTruckAnimationDone ? (
            <CheckmarkCircle checked={isCheckmarkVisible} />
          ) : (
            <TruckAnimation />
          )}

          {isCheckmarkVisible && orderNumber && (
            <div className="text-center mt-4">
              <p className="text-lg font-bold text-gray-800">Order Number: <span className="text-blue-600">{orderNumber}</span></p>
              <p className="text-sm text-gray-600 mt-2">
                Our team will get in touch shortly or you can call us directly for assistance.
              </p>
              <a href="tel:8787649928" className="text-sm font-semibold text-green-600 hover:underline mt-1 block">
                📞 8787649928
              </a>
            </div>
          )}

          <DialogFooter>
            <div className="flex flex-col justify-center items-center">
              <DialogDescription className="text-gray-400">Redirecting to Profile Page...</DialogDescription>
              <DialogDescription className="text-gray-400">
                <Link href="/profile" className="p-0 pr-2 m-0 text-blue-600 h-4">
                  click here...
                </Link>
                if it doesn't happen.
              </DialogDescription>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}