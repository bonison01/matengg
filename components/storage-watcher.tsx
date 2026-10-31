'use client';

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/cart/store';
import { hydrateCart } from '@/lib/cart/cartSlice';
import { setUser, setUserLoading, setUserError, clearUser } from '@/lib/cart/userSlice';

export default function StorageWatcher() {
  const dispatch = useDispatch<AppDispatch>();
  const prevCustomerId = useRef<string | null>(null);
  const prevOrderId = useRef<string | null>(null);

  // const validateAndUpdateUser = async (customerId: string) => {
  //   const token = localStorage.getItem('token');
  //   try {
  //     dispatch(setUserLoading());
  //     const response = await fetch(`/api/user/${customerId}`, {
  //       method: 'GET',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         ...(token && { 'Authorization': `Bearer ${token}` }),
  //       },
  //     });

  //     const data = await response.json();

  //     if (!response.ok || data.data.customer_id !== customerId) {
  //       throw new Error('Invalid or tampered customer ID');
  //     }

  //     dispatch(setUser(data.data));
  //   } catch (error) {
  //     console.error('User validation failed:', error);
  //     dispatch(setUserError(error instanceof Error ? error.message : 'Failed to validate user'));
  //     localStorage.removeItem('customer_id');
  //     localStorage.removeItem('token');
  //     dispatch(clearUser());
  //   }
  // };

  const updateCartFromOrder = async (orderId: string, customerId?: string) => {
    const token = localStorage.getItem('token');
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
        dispatch(hydrateCart(data.data));
        localStorage.setItem('cart', JSON.stringify(data.data));
      } else {
        localStorage.removeItem('cart');
        dispatch(hydrateCart({ items: [], totalPrice: 0, totalOriginalPrice: 0 }));
      }
    } catch (err) {
      console.error('Failed to update cart from order items:', err);
      localStorage.removeItem('cart');
      dispatch(hydrateCart({ items: [], totalPrice: 0, totalOriginalPrice: 0 }));
    }
  };

  useEffect(() => {
    const shouldUpdateCart = () => {
      const cartData = localStorage.getItem('cart');
      // If cart doesn't exist, return true to allow update
      if (!cartData) return true;
      // If cart exists, parse it and check if it has items
      try {
        const cart = JSON.parse(cartData);
        // Return true if cart has no items (empty), false if it has items
        return cart.items.length === 0;
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e);
        // If parsing fails, assume cart is invalid and allow update
        return true;
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) return;

      const customerId = localStorage.getItem('customer_id');
      const orderId = localStorage.getItem('order_id');

      // if (event.key === 'customer_id') {
      //   if (event.newValue !== prevCustomerId.current) {
      //     prevCustomerId.current = event.newValue;
      //     if (event.newValue) {
      //       validateAndUpdateUser(event.newValue);
      //     } else {
      //       dispatch(clearUser());
      //     }
      //   }
      // } else
       if (event.key === 'order_id') {
        if (event.newValue !== prevOrderId.current) {
          prevOrderId.current = event.newValue;
          if (event.newValue && customerId && shouldUpdateCart()) {
            updateCartFromOrder(event.newValue, customerId);
          } else if (!event.newValue && !customerId) {
            localStorage.removeItem('cart');
            dispatch(hydrateCart({ items: [], totalPrice: 0, totalOriginalPrice: 0 }));
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const checkStorage = () => {
      const customerId = localStorage.getItem('customer_id');
      const orderId = localStorage.getItem('order_id');

      // if (customerId !== prevCustomerId.current) {
      //   prevCustomerId.current = customerId;
      //   if (customerId) {
      //     validateAndUpdateUser(customerId);
      //   } else {
      //     dispatch(clearUser());
      //   }
      // }

      if (orderId !== prevOrderId.current) {
        prevOrderId.current = orderId;
        if (orderId && customerId && shouldUpdateCart()) {
          updateCartFromOrder(orderId, customerId);
        } else if (!orderId && !customerId) {
          localStorage.removeItem('cart');
          dispatch(hydrateCart({ items: [], totalPrice: 0, totalOriginalPrice: 0 }));
        }
      }
    };

    const intervalId = setInterval(checkStorage, 1000);

    checkStorage();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [dispatch]);

  return null;
}