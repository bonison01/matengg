'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from "next-themes";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/cart/store';
import { MapPinHouse, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import TruckAnimation from '@/components/order/TruckAnimation';
import CheckmarkCircle from '@/components/order/CheckmarkCircle';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { hydrateCart } from '@/lib/cart/cartSlice';

export default function AddressPage() {
  const { setTheme } = useTheme();
  const dispatch = useDispatch();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTruckAnimationDone, setIsTruckAnimationDone] = useState(false);
  const [isCheckmarkVisible, setIsCheckmarkVisible] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setTheme("light");
  }, []);

  const user = useSelector((state: RootState) => state.user.user);
  const cart = useSelector((state: RootState) => state.cart);

  const [formData, setFormData] = useState({
    name: '',
    buyerAddress: '',
    buyerPhone: '',
    email: '',
    landmark: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        buyerAddress: user.address || '',
        buyerPhone: user.phone || '',
        email: user.email || '',
        landmark: '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted', formData);
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    const orderId = localStorage.getItem('order_id');

    try {
      const orderData = {
        order_id: orderId,
        buyer_name: formData.name,
        buyer_address: formData.buyerAddress,
        buyer_phone: formData.buyerPhone,
        landmark: formData.landmark,
        email: formData.email,
        order_at: new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString(),
        status: 'ordered',
        items: cart.items.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.itemPrice,
        })),
      };

      const response = await fetch('/api/order/placeOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const result = await response.json(); 
      const orderResponse = result.data;
      console.log(orderResponse)

      localStorage.removeItem('order_id');
      localStorage.removeItem('cart');

      dispatch(hydrateCart({ items: [], totalPrice: 0, totalOriginalPrice: 0 }));

      setIsDialogOpen(true);
      setIsTruckAnimationDone(false);
      setIsCheckmarkVisible(false);

      cleanExtraOrder();

      setTimeout(() => {
        setIsTruckAnimationDone(true);
      }, 4000);
      setTimeout(() => {
        setIsCheckmarkVisible(true);
      }, 3500);

      setTimeout(() => {
        setIsDialogOpen(false);
        router.push('/profile');
      }, 5500);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.', {
        position: "top-right",
      });
      setIsPlacingOrder(false);
    }
  };

  const cleanExtraOrder = () => {
    const buyer_id = localStorage.getItem('customer_id');
    if (buyer_id) {
      fetch(`/api/order/removeOrder?buyer_id=${buyer_id}`, {
        method: 'DELETE',
      })
        .then(response => {
          if (!response.ok) {
            console.error('');
          }
        })
        .catch(error => {
          console.error('', error);
        });
    }
  };

  return (
    <div className='bg-gradient-to-br from-[#d1ffc0] to-[#F0F6EE] w-[100vw] relative poppins'>
      <ScrollArea>
        <div className='w-[100vw] h-[100svh]'>
          <div className='w-full h-16'></div>
          <div className="w-full max-w-[1400px] mx-auto p-4 px-10">
            <div className="pb-1 my-3">
              <CardTitle className="text-2xl">Checkout</CardTitle>
              <CardDescription>
                To complete your purchase, add your shipping address and place the order.
              </CardDescription>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Address Form */}
                <div className="lg:col-span-2">
                  <Card className="shadow-none border-none">
                    <CardContent>
                      <CardTitle className="text-sm mb-4 flex flex-row gap-2 text-stone-800">
                        <MapPinHouse size={18} className='text-red-600/80' />
                        SHIPPING ADDRESS
                      </CardTitle>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-1 sm:col-span-2">
                          <Label htmlFor="name" className='text-stone-500 pl-1 pb-0.5'>Name*</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            required
                          />
                        </div>

                        <div className="col-span-1">
                          <Label htmlFor="buyerPhone" className='text-stone-500 pl-1 pb-0.5'>Contact Number*</Label>
                          <Input
                            id="buyerPhone"
                            name="buyerPhone"
                            type="tel"
                            value={formData.buyerPhone}
                            onChange={handleChange}
                            placeholder="Enter phone number"
                            required
                          />
                        </div>

                        <div className="col-span-1">
                          <Label htmlFor="email" className='text-stone-500 pl-1 pb-0.5'>Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter email"
                          />
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                          <Label htmlFor="buyerAddress" className='text-stone-500 pl-1 pb-0.5'>Address*</Label>
                          <Textarea
                            id="buyerAddress"
                            name="buyerAddress"
                            value={formData.buyerAddress}
                            onChange={handleChange}
                            placeholder="Enter buyer address"
                            required
                          />
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                          <Label htmlFor="landmark" className='text-stone-500 pl-1 pb-0.5'>Landmark</Label>
                          <Input
                            id="landmark"
                            name="landmark"
                            value={formData.landmark}
                            onChange={handleChange}
                            placeholder="Enter landmark"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <Card className="w-full shadow-none border-none gap-0">
                    <CardContent className='p-2'>
                      <div className='px-4'>
                        <CardTitle className="text-xl ml-0.5 mb-2 text-gray-700">Order Summary</CardTitle>

                        {cart.items.length === 0 ? (
                          <Label className="text-gray-500 text-center">Your cart is empty.</Label>
                        ) : (
                          <div className="space-y-4 p-4 rounded-lg bg-green-100/80">
                            {cart.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-start">
                                <div className="flex-1 pb-1.5 border-b border-dashed">
                                  <Label className="font-medium text-blue-500 mb-1">{item.name}</Label>
                                  <Label className="text-xs text-gray-500">
                                    Quantity: <span className="font-medium">{item.quantity}</span>
                                  </Label>
                                </div>
                                <div className="text-right border-b border-dashed">
                                  <CardDescription className="text-gray-500 line-through text-xs mb-1">₹{item.originalPrice}</CardDescription>
                                  <CardDescription className="font-semibold text-green-600">₹{item.itemPrice}</CardDescription>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 py-3 px-6 rounded-lg">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm font-medium">MRP Before Savings</span>
                            <span className="text-gray-500 text-base line-through">₹{cart.totalOriginalPrice}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm font-medium">You Saved</span>
                            <span className="text-green-600 text-base font-semibold">- ₹{cart.totalOriginalPrice - cart.totalPrice}</span>
                          </div>

                          <div className="flex justify-between items-center border-t pt-2">
                            <span className="text-base font-semibold text-gray-900">Final Amount</span>
                            <span className="text-base font-bold text-gray-900">₹{cart.totalPrice}</span>
                          </div>

                          <div className="flex justify-between items-center mt-4">
                            <span className="text-gray-600 text-sm font-medium">Payment Mode</span>
                            <CardDescription>Cash on Delivery</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end items-center">
                      <Button type='button' onClick={handlePlaceOrder} disabled={isPlacingOrder}>
                        {isPlacingOrder ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Placing Order...
                          </>
                        ) : (
                          "Place Order"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </form>
          </div>
        </div>
      </ScrollArea>

      <Dialog open={isDialogOpen} onOpenChange={() => { }}>
        <DialogContent className="flex flex-col items-center p-6 w-80 gap-4"
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

          <p className="mt-4 text-lg font-semibold text-gray-700">
            {isCheckmarkVisible ? "Order Placed Successfully!" : "Processing your order..."}
          </p>

          <DialogFooter>
            <div className='flex flex-col justify-center items-center'>
              <DialogDescription className="text-gray-400">Redirecting to Home Page...</DialogDescription>
              <DialogDescription className="text-gray-400">
                <Link href="/" className='p-0 pr-2 m-0 text-blue-600 h-4'>click here...</Link>
                if it doesn't happen.
              </DialogDescription>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}