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

// Define the type for Order and OrderItem
interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  discounted_price: number;
}

interface Order {
  order_id: string;
  buyer_name: string;
  buyer_address: string;
  buyer_phone: string;
  email: string;
  status: string;
  landmark: string;
  order_at: string;
  item_list: OrderItem[];
  total_price: number;
  total_calculated_price: number;
}

interface OrderDetailsProps {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

function OrderDetails({ orders, loading, error }: OrderDetailsProps) {
  const generateReceiptPDF = (orderData: Order) => {
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
    doc.text("Mateng - Thank You for Ordering", pageWidth / 2, y, { align: "center" });
    y += 15;

    // Order Details
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.text(`Order ID: ${orderData.order_id}`, 20, y);
    y += 8;
    doc.text(`Name: ${orderData.buyer_name}`, 20, y);
    y += 8;
    doc.text(`Address: ${orderData.buyer_address}`, 20, y);
    y += 8;
    doc.text(`Phone: ${orderData.buyer_phone}`, 20, y);
    y += 8;
    doc.text(`Email: ${orderData.email}`, 20, y);
    y += 8;
    doc.text(`Landmark: ${orderData.landmark}`, 20, y);
    y += 8;
    doc.text(`Payment Mode: Cash on Delivery`, 20, y);
    y += 8;
    doc.text(`Order Date: ${format(new Date(orderData.order_at), "dd MMM, yyyy - h:mm a")}`, 20, y);
    y += 12;

    // Table Header
    doc.setFillColor(220, 220, 220);
    doc.rect(20, y - 5, pageWidth - 40, 10, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Product Name", 25, y);
    doc.text("Qty", 100, y);
    doc.text("MRP", 130, y);
    doc.text("Offer Price", 160, y);
    y += 8;
    doc.line(20, y, 190, y);
    y += 6;

    // Product List
    doc.setFont("helvetica", "normal");
    orderData.item_list.forEach((item: OrderItem) => {
      doc.text(item.product_name, 25, y);
      doc.text(item.quantity.toString(), 100, y);
      doc.text(`Rs. ${item.price.toFixed(2)}`, 140, y, { align: "right" });
      doc.setTextColor(0, 150, 0);
      doc.text(`Rs. ${item.discounted_price.toFixed(2)}`, 185, y, { align: "right" });
      doc.setTextColor(0, 0, 0);
      y += 8;
    });

    // Totals Section
    y += 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 5, pageWidth - 40, 30, "F");
    doc.setFont("helvetica", "bold");
    doc.text(`Total MRP:`, 25, y);
    doc.text(`Rs. ${orderData.total_price.toFixed(2)}`, 185, y, { align: "right" });
    y += 10;
    const discount = orderData.total_price - orderData.total_calculated_price;
    doc.setTextColor(200, 0, 0);
    doc.text(`You saved:`, 25, y);
    doc.text(`-Rs. ${discount.toFixed(2)}`, 185, y, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(0, 150, 0);
    doc.text(`Payable Amount:`, 25, y);
    doc.text(`Rs. ${orderData.total_calculated_price.toFixed(2)}`, 185, y, { align: "right" });

    // Save PDF
    doc.save(`Receipt_${orderData.order_id}.pdf`);
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    const isNoOrders =
        error === "No orders found for this buyer_id" ||
        error === "404" ||
        (typeof error === "string" && error.includes("404")) ||
        (typeof error === "string" && error.includes("No orders found for this buyer_id"));

    return (
        <div className="text-center py-10 text-gray-400">
            {isNoOrders ? "No order placed yet" : "Something went wrong, please try again"}
        </div>
    );
}

  return (
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
      {orders.length === 0 ? (
        <p className="text-center col-span-2">No orders found.</p>
      ) : (
        orders.map((order) => (
          <Card key={order.order_id} className="shadow-lg py-6 h-fit gap-4">
            <CardHeader>
              <div className="flex justify-between">
                <div className="space-y-1">
                  <CardTitle>{order.order_id}</CardTitle>
                  <CardDescription>{format(new Date(order.order_at), "dd MMM yyyy, hh:mm a")}</CardDescription>
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
            <CardContent className="space-y-4">
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {order.buyer_name}</p>
                <p><strong>Address:</strong> {order.buyer_address}</p>
                <p><strong>Phone No:</strong> {order.buyer_phone}</p>
                <p className="capitalize"><strong>Status:</strong> {order.status}</p>
              </div>
              <Separator className="my-4" />
              {order.item_list.map((item: any) => (
                <div key={item.product_id} className="space-y-1 sm:px-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pb-1.5 border-b border-dashed">
                      <Label className="font-medium text-blue-500 mb-1">{item.product_name}</Label>
                      <Label className="text-xs text-gray-500">
                        Quantity: <span className="font-medium">{item.quantity}</span>
                      </Label>
                    </div>
                    <div className="text-right border-b border-dashed">
                      <CardDescription className="text-gray-500 line-through text-xs mb-1">
                        ₹{item.price.toFixed(2)}
                      </CardDescription>
                      <CardDescription className="font-semibold text-green-600">
                        ₹{item.discounted_price.toFixed(2)}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-base">
                  <CardDescription>Total MRP</CardDescription>
                  <CardDescription className="text-stone-300">₹{order.total_price.toFixed(2)}</CardDescription>
                </div>
                <div className="flex justify-between text-base">
                  <CardDescription>Discount</CardDescription>
                  <CardDescription className="text-green-600">
                    -₹{(order.total_price - order.total_calculated_price).toFixed(2)}
                  </CardDescription>
                </div>
                <div className="border-t pt-4 flex justify-between text-lg font-semibold">
                  <CardTitle>Grand Total</CardTitle>
                  <p>₹{order.total_calculated_price.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export default OrderDetails;