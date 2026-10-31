"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import { Label } from "../ui/label";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { Truck, Package, UserRoundCheck, MapPin, Phone } from "lucide-react";
import { Button } from "../ui/button";

// Define the type for Delivery Order
interface DeliveryOrder {
    id: number;
    pickup_name: string;
    pickup_phone: string;
    pickup_address: string;
    dropoff_name: string;
    dropoff_phone: string;
    dropoff_address: string;
    instructions: { pickup: string; dropoff: string };
    distance: number | null;
    charge: number | null;
    pickup_cord: string | null;
    dropoff_cord: string | null;
    status: string;
    customer_id: string;
    isBusiness: number | null;
    business_id: string | null;
    created_at: string;
    updated_at: string;
}

interface ServiceBookedProps {
    orders: DeliveryOrder[];
    loading: boolean;
    error: string | null;
}

function ServiceBooked({ orders, loading, error }: ServiceBookedProps) {
    const generateReceiptPDF = (orderData: DeliveryOrder) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;

        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");

        // Header
        doc.setFillColor(0, 128, 0);
        doc.rect(0, y - 10, pageWidth, 15, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text("Mateng - Delivery Receipt", pageWidth / 2, y, { align: "center" });
        y += 15;

        // Order Details
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "normal");
        doc.text(`Service Booked ID: SB-${orderData.id}`, 20, y);
        y += 12;
        doc.setFont("helvetica", "bold");
        doc.text("Pickup Details -", 20, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.text(`Name: ${orderData.pickup_name}`, 24, y);
        y += 8;
        doc.text(`Phone: ${orderData.pickup_phone}`, 24, y);
        y += 8;
        doc.text(`Address: ${orderData.pickup_address}`, 24, y);
        y += 8;
        doc.text(`Instruction: ${orderData.instructions.pickup}`, 24, y);
        y += 12;
        doc.setFont("helvetica", "bold");
        doc.text("Dropoff Details -", 20, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.text(`Name: ${orderData.dropoff_name}`, 24, y);
        y += 8;
        doc.text(`Phone: ${orderData.dropoff_phone}`, 24, y);
        y += 8;
        doc.text(`Address: ${orderData.dropoff_address}`, 24, y);
        y += 8;
        doc.text(`Instruction: ${orderData.instructions.dropoff}`, 24, y);
        y += 12;
        doc.text(`Status: ${orderData.status}`, 20, y);
        y += 8;
        doc.text(`Order Date: ${format(new Date(orderData.created_at), "dd MMM, yyyy - h:mm a")}`, 20, y);
        y += 12;

        // Delivery Details
        doc.setFillColor(220, 220, 220);
        doc.rect(20, y - 5, pageWidth - 40, 10, "F");
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Details", 25, y);
        doc.text("Value", 160, y);
        y += 8;
        doc.line(20, y, 190, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        doc.text("Distance", 25, y);
        doc.text(orderData.distance !== null ? `${orderData.distance} km` : "N/A", 185, y, { align: "right" });
        y += 8;
        doc.text("Charge", 25, y);
        doc.setTextColor(0, 150, 0);
        doc.text(orderData.charge !== null ? `Rs. ${orderData.charge}` : "N/A", 185, y, { align: "right" });
        doc.setTextColor(0, 0, 0);
        y += 8;
        doc.text("Business Order", 25, y);
        doc.text(orderData.isBusiness !== null ? (orderData.isBusiness ? "Yes" : "No") : "N/A", 185, y, { align: "right" });

        // Save PDF
        doc.save(`Delivery_Receipt_${orderData.id}.pdf`);
    };

    if (loading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    if (error) {
        const isNoOrders = error === "No delivery orders found for this customer_id" || error === "404" || (typeof error === "string" && error.includes("404"));
    
        return (
            <div className="text-center py-10 text-gray-400">
                {isNoOrders ? "No service booked yet" : "Something went wrong, please try again"}
            </div>
        );
    }

    return (
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
            {orders.length === 0 ? (
                <p className="text-center col-span-2">No delivery orders found.</p>
            ) : (
                orders.map((order) => (
                    <Card key={order.id} className="shadow-lg py-6 h-fit gap-4">
                        <CardHeader>
                            <div className="flex justify-between">
                                <div className="space-y-1">
                                    <CardTitle>SB-{order.id}</CardTitle>
                                    <CardDescription>{format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}</CardDescription>
                                </div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger
                                            className="bg-black border p-2 rounded-md h-fit"
                                            onClick={() => generateReceiptPDF(order)}
                                        >
                                            <Download size={18} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-white">Download Receipt</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Separator />
                            <div className="text-base space-y-2">
                                <CardTitle className="text-base flex flex-row gap-2 items-center"> Pickup Details <Truck size={20} /> </CardTitle>
                                <div className="px-2 space-y-1 font-semibold text-gray-200">
                                    <CardDescription className="flex flex-row gap-2 items-center">
                                        <span className="text-blue-200"><UserRoundCheck size={14} /></span>
                                        {order.pickup_name}
                                    </CardDescription>
                                    <CardDescription className="flex flex-row gap-2 items-center">
                                        <span className="text-green-500"><Phone size={14} /></span>
                                        {order.pickup_phone}
                                    </CardDescription>
                                    <CardDescription>
                                        <a
                                            href={`https://www.google.com/maps?q=${order.pickup_cord}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-start gap-2 text-red-400 hover:underline"
                                        >
                                            <MapPin size={14} className="min-w-4 mt-1" />
                                            <span className="text-gray-400">{order.pickup_address}</span>
                                        </a>
                                    </CardDescription>

                                    <div className="flex flex-col items-start mt-2">
                                        <CardDescription className="text-gray-300/90"># Instruction:</CardDescription>
                                        <span className="text-sm font-normal pl-3"> {order.instructions.pickup ? order.instructions.pickup : "n/a"}</span>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="text-base space-y-2">
                                <CardTitle className="text-base flex flex-row gap-2 items-center"> Dropoff Details <Package size={20} /> </CardTitle>
                                <div className="px-2 space-y-1 font-semibold text-gray-200">
                                    <CardDescription className="flex flex-row gap-2 items-center">
                                        <span className="text-blue-200"><UserRoundCheck size={14} /></span>
                                        {order.dropoff_name}
                                    </CardDescription>
                                    <CardDescription className="flex flex-row gap-2 items-center">
                                        <span className="text-green-500"><Phone size={14} /></span>
                                        {order.dropoff_phone}
                                    </CardDescription>
                                    <CardDescription>
                                        <a
                                            href={`https://www.google.com/maps?q=${order.dropoff_cord}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-start gap-2 text-red-400 hover:underline mt-1"
                                        >
                                            <MapPin size={14} className="min-w-4 mt-1" />
                                            <span className="text-gray-400">{order.dropoff_address}</span>
                                        </a>
                                    </CardDescription>

                                    <div className="flex flex-col items-start mt-2">
                                        <CardDescription className="text-gray-300/90"># Instruction:</CardDescription>
                                        <span className="text-sm font-normal pl-3"> {order.instructions.dropoff ? order.instructions.dropoff : "n/a"}</span>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <Label className="font-medium">Distance</Label>
                                    <CardDescription className="text-blue-500 font-semibold">
                                        {order.distance !== null ? `${order.distance} km` : "N/A"}
                                    </CardDescription>
                                </div>
                                <div className="flex justify-between">
                                    <Label className="font-medium">Charge</Label>
                                    <CardDescription className="text-green-600  font-semibold">
                                        {order.charge !== null ? `₹${order.charge}` : "N/A"}
                                    </CardDescription>
                                </div>
                                <div className="flex justify-between">
                                    <Label className="font-medium">Business Order</Label>
                                    <CardDescription className="text-gray-200 font-semibold">
                                        {order.isBusiness !== null ? (order.isBusiness ? "Yes" : "No") : "No"}
                                    </CardDescription>
                                </div>
                                <div className="flex justify-start mt-3">
                                    <Button
                                        onClick={() => {
                                            const url = `https://www.google.com/maps/dir/?api=1&origin=${order.pickup_cord}&destination=${order.dropoff_cord}`;
                                            window.open(url, "_blank");
                                        }}
                                        variant="link"
                                        className="p-0"
                                    >
                                        Check Route on Map
                                    </Button>
                                </div>

                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}

export default ServiceBooked;