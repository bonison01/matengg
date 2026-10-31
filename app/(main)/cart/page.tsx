'use client'

import React, { useEffect } from 'react'
import Cart from './cart';
import { useTheme } from "next-themes"
import { ScrollArea } from '@/components/ui/scroll-area';
import Footer from '@/components/footer/Footer';

// Define the shape of a cart item
interface CartItem {
  id: number;
  name: string;
  quantity: number;
  price_inr?: number;
  discounted_price?: number;
  media_urls?: string[];
  unit_quantity?: string | null;
  user_name?: string;
  description?: string;
  itemPrice?: number;
  originalPrice?: number;
}

// Define the shape of cart data
interface CartData {
  items: CartItem[];
  totalPrice?: number;
  totalOriginalPrice?: number;
}

export default function Page() {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("light");
    initializeCart();
  }, []);

  // Function to initialize cart and create/update order
  const initializeCart = async () => {
    try {
      // Get cart data and customer_id from localStorage
      const cartData: CartData = JSON.parse(localStorage.getItem('cart') || '{}');
      const customerId = localStorage.getItem('customer_id');
      const existingOrderId = localStorage.getItem('order_id'); // string | null

      // Check if cart is not empty
      if (cartData?.items?.length > 0) {
        const orderData = {
          buyer_id: customerId || null,
          is_ordered: 0,
          item_list: cartData.items,
          buyer_name: "",
          buyer_address: "",
          buyer_phone: ""
        };

        // Step 1: Create or update order_rec
        let orderResponse;
        let orderId: string; // Explicitly typed as string

        if (existingOrderId) {
          // Update existing order
          orderId = existingOrderId; // We know it’s a string here
          orderResponse = await fetch('/api/order', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...orderData,
              order_id: orderId
            }),
          });
        } else {
          // Create new order
          orderResponse = await fetch('/api/order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
          });
          const orderResult = await orderResponse.json();
          if (orderResult.success) {
            orderId = orderResult.data.order_id;
            localStorage.setItem('order_id', orderId);
          } else {
            throw new Error('Failed to create order');
          }
        }

        if (!orderResponse.ok) {
          throw new Error('Order API request failed');
        }

        // Step 2: Sync order_items with cart
        const itemsToSync = cartData.items.map((item: CartItem) => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
        }));

        const itemsResponse = await fetch('/api/order/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: orderId,
            items: itemsToSync,
          }),
        });

        if (!itemsResponse.ok) {
          console.error('Failed to sync order items:', await itemsResponse.text());
        }
      }
    } catch (error) {
      console.error('Error initializing cart:', error);
    }
  };

  return (
    <div className='bg-[#efeee7] w-[100vw] relative'>
      <ScrollArea>
        <div className='w-[100vw] h-[100svh] flex flex-col justify-between'>
          <div>
            <div className='w-full h-16 bg-stone-600'></div>
            <div className='w-full max-w-[1400px] mx-auto p-4 relative'>
              <Cart />
            </div>
          </div>
          <Footer />
        </div>
      </ScrollArea>
    </div>
  );
}