'use client';

import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/cart/store';
import { hydrateCart } from '@/lib/cart/cartSlice';

export default function CartLoader() {
  const dispatch = useDispatch<AppDispatch>();

  const initializeCart = async (orderId?: string, customerId?: string) => {
    const cartData = localStorage.getItem('cart');
    const token = localStorage.getItem('token');

    if (cartData) {
      try {
        const parsedCart = JSON.parse(cartData);
        dispatch(hydrateCart(parsedCart));
      } catch (err) {
        console.error('Failed to load cart from localStorage', err);
      }
    } else if (orderId) {
      try {
        const response = await fetch(`/api/order/items?order_id=${orderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch order items');
        }

        if (data.success && data.data.items.length > 0) {
          const cart = data.data;
          dispatch(hydrateCart(cart));
          localStorage.setItem('cart', JSON.stringify(cart));
        }
      } catch (err) {
        console.error('Failed to initialize cart from order items:', err);
      }
    }
  };

  useEffect(() => {
    const orderId = localStorage.getItem('order_id');
    const customerId = localStorage.getItem('customer_id');
    initializeCart(orderId || undefined, customerId || undefined);
  }, [dispatch]);

  return null;
}