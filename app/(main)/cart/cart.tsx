'use client';

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/cart/store";
import { addToCart, removeFromCart, decreaseQuantity } from "@/lib/cart/cartSlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Minus, Plus, CircleAlert } from "lucide-react";
import Image from 'next/image'
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { useState } from "react";
import { useRouter, usePathname } from 'next/navigation';
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
import { toast } from "sonner";

const Cart: React.FC = () => {
  const dispatch = useDispatch();
  const { items, totalPrice } = useSelector((state: RootState) => state.cart);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Calculate Total Original Price (MRP) without discounts
  const totalOriginalPrice = items.reduce((acc, item) => {
    return acc + (item.price_inr ?? 0) * item.quantity;
  }, 0);

  const totalDiscount = totalOriginalPrice - totalPrice;

  const handleCheckout = () => {
    const cartData = localStorage.getItem('cart');
    let cartItems = [];

    if (cartData) {
      try {
        const parsedCart = JSON.parse(cartData);
        cartItems = parsedCart.items || [];
      } catch (error) {
        console.error('Error parsing cart data:', error);
        return;
      }
    }

    if (cartItems.length === 0) {
      toast.error('Please add products to order!', {
        position: 'top-right',
      });
      setTimeout(() => {
        router.push('/products');
      }, 1500);
      return;
    }

    const customerId = localStorage.getItem('customer_id');
    if (customerId) {
      router.push('/cart/address');
    } else {
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-6 poppins">
      <Label className="text-2xl font-bold mb-4 sm:mb-6">🛒 Shopping Cart</Label>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="col-span-2 space-y-6">
          {items.length > 0 ? (
            items.map((item) => {
              const itemPrice = item.discounted_price ?? item.price_inr;
              return (
                <Card key={item.id} className="shadow-lg p-4 flex flex-row gap-4 relative">
                  {/* Product Image */}
                  <img
                    src={item.media_urls?.[0] || "/unavailable.jpg"}
                    alt={item.name}
                    width={120}
                    height={120}
                    className="rounded-lg object-cover"
                  />

                  {/* Product Details */}
                  <CardContent className="flex-1 px-1 sm:px-4">
                    <CardTitle className="text-base sm:text-lg md:text-xl">{item.name}</CardTitle>
                    {item.unit_quantity && (
                      <CardDescription className="text-xs sm:text-sm text-gray-600">
                        {item.unit_quantity}
                      </CardDescription>
                    )}

                    {/* Price Section */}
                    <div className="mt-2">
                      <p className="text-xs sm:text-sm text-gray-500 line-through">
                        MRP: ₹{item.price_inr.toFixed(2)}
                      </p>
                      <p className="text-base font-semibold text-green-600">
                        Discount Price: ₹{itemPrice.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dispatch(decreaseQuantity(item.id))}
                      >
                        <Minus size={16} />
                      </Button>
                      <span className="text-lg font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dispatch(addToCart(item))}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </CardContent>

                  {/* Remove Button */}
                  <Button
                    variant="outline"
                    className="absolute top-2 right-2 hover:bg-red-300"
                    size="icon"
                    onClick={() => dispatch(removeFromCart(item.id))}
                  >
                    <Trash2 size={16} />
                  </Button>
                </Card>
              );
            })
          ) : (
            <p className="text-gray-500">Your cart is empty.</p>
          )}
        </div>

        {/* Checkout Section */}
        <Card className="shadow-lg py-6 col-span-2 lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-base">
              <Label>Total MRP</Label>
              <CardDescription className="text-stone-800">₹{totalOriginalPrice.toFixed(2)}</CardDescription>
            </div>
            <div className="flex justify-between text-base">
              <Label>Discount</Label>
              <CardDescription className="text-green-600">-₹{totalDiscount > 0 ? totalDiscount.toFixed(2) : "0.00"}</CardDescription>
            </div>
            <div className="border-t pt-4 flex justify-between text-lg font-semibold">
              <CardTitle>Grand Total</CardTitle>
              <p>₹{totalPrice.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-gray-600 text-sm font-medium">Payment Mode - </span>
              <CardDescription>Cash on Delivery</CardDescription>
            </div>
            <div className="w-full flex justify-center">
              <Button
                className="mt-4 w-fit bg-gradient-to-t from-[#0752ef] to-[#437fff] text-[#FAF9F6] font-semibold"
                onClick={handleCheckout}
              >
                <ShoppingCart size={18} className="mr-2 ml-4" />
                <span className="mr-4">Proceed to Checkout</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex flex-row gap-2 items-center"><CircleAlert size={18} className="text-lime-600" />Login Required!</AlertDialogTitle>
            <AlertDialogDescription>
              Please log in to place your order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(pathname)}`)}
            >
              Log In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Cart;
