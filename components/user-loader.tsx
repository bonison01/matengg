'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/cart/store';
import { setUser, setUserLoading, clearUser } from '@/lib/cart/userSlice';

export default function UserLoader() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.user);
  const loading = useSelector((state: RootState) => state.user.loading);

  const validateAndInitializeUser = async (customerId: string) => {
    const token = localStorage.getItem('token');
    if (!customerId || loading) return;

    try {
      dispatch(setUserLoading());
      const response = await fetch(`/api/user/getUserInfo?user_id=${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (response.ok && data.data?.customer_id === customerId) {
        dispatch(setUser(data.data)); 
      } else if (response.status === 404 && data.error === 'User not found') {
        localStorage.removeItem('customer_id');
        localStorage.removeItem('token');
        dispatch(clearUser()); 
      } else {
        console.error('Unexpected API error:', response.status, data.error);
      }
    } catch (error) {
      console.error('User validation failed:', error);
    }
  };

  useEffect(() => {
    const customerId = localStorage.getItem('customer_id');
    if (customerId && !user) {
      validateAndInitializeUser(customerId);
    }
  }, [dispatch, user, loading]);

  return null;
}
