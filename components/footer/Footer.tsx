"use client";

import React, { useState } from 'react';
import { CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useCustomer } from '@/lib/api/useCustomer';
import { TICKETING_TERMS_PATH } from '@/lib/events/ticketingTerms';

export default function Footer() {
  // const [open, setOpen] = useState(false);
  const [openTerms, setOpenTerms] = useState(false);
  const [aboutus, setabout] = useState(false);
  const [openProjects, setOpenProjects] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  // A signed-in customer doesn't need the older site logins.
  const { session, ready } = useCustomer();
  const showLogin = ready && !session;


  return (
    <div className='w-full min-h-16 py-3 bg-transparent flex flex-col justify-center items-center poppins'>
      <p className="text-sm">
        © {new Date().getFullYear()} Mateng. All rights reserved.
      </p>
      <div className='flex flex-row flex-wrap justify-center gap-x-4 gap-y-1 px-4 relative'>
        {/* Static Footer Links */}
        {/* <Link href={`/about-us`}>
          <Button variant="link" className='p-0 h-6 text-zinc-500 hover:text-green-600'>About Us</Button>
        </Link>
        <Link href={`/contact-us`}>
          <Button variant="link" className='p-0 h-6 text-zinc-500 hover:text-green-600'>Contact Us</Button>
        </Link> */}
        {/* <Link href={`/terms`}>
          <Button variant="link" className='p-0 h-6 text-zinc-500 hover:text-green-600'>Terms of Use</Button>
        </Link>
        <Link href={`/privacy_policy`}>
          <Button variant="link" className='p-0 h-6 text-zinc-500 hover:text-green-600'>Privacy Policy</Button>
        </Link> */}

        <div className="relative">
          <Button
            variant="link"
            className='p-0 h-6 text-zinc-500 hover:text-green-600'
            onClick={() => {
              setabout(prev => !prev);
              setOpenTerms(false);
              setOpenProjects(false);
              setOpenLogin(false);
            }}
          >
            About Us
          </Button>


          {aboutus && (
            <div className="absolute bottom-full mb-2 right-0 bg-white border border-zinc-200 rounded-md shadow-lg py-2 z-50 w-48">
              <Link href="/about-us">
                <Button variant="link" className='w-full text-left px-4 py-1.5 text-zinc-500 hover:text-green-600'>
                  About Us
                </Button>
              </Link>
              <Link href="/contact-us">
                <Button variant="link" className='w-full text-left px-4 py-1.5 text-zinc-500 hover:text-green-600'>
                  Contact Us
                </Button>
              </Link>
              <Link href="/joining_form">
                <Button variant="link" className='w-full text-left px-4 py-1.5 text-zinc-500 hover:text-green-600'>
                  Join Us
                </Button>
              </Link>
            </div>
          )}
        </div>



        <div className="relative">
          <Button
            variant="link"
            className='p-0 h-6 text-zinc-500 hover:text-green-600'
            onClick={() => {
              setOpenTerms(prev => !prev);
              setOpenProjects(false);
              setOpenLogin(false);
            }}
          >
            Terms
          </Button>

          {openTerms && (
            <div className="absolute bottom-full mb-2 right-0 bg-white border border-zinc-200 rounded-md shadow-lg py-2 z-50 w-48">
              <Link href="/terms">
                <Button variant="link" className='w-full text-left px-4 py-1.5 text-zinc-500 hover:text-green-600'>
                  Terms of Use
                </Button>
              </Link>
              <Link href="/privacy_policy">
                <Button variant="link" className='w-full text-left px-4 py-1.5 text-zinc-500 hover:text-green-600'>
                  Privacy Policy
                </Button>
              </Link>
            </div>
          )}
        </div>


        <Link href={TICKETING_TERMS_PATH}>
          <Button variant="link" className='p-0 h-6 text-zinc-500 hover:text-green-600'>
            Mateng Event Terms
          </Button>
        </Link>


        <div className="relative">
          <Button
            variant="link"
            className='p-0 h-6 text-zinc-500 hover:text-green-600'
            onClick={() => {
              setOpenProjects(prev => !prev);
              setOpenTerms(false);
              setOpenLogin(false);
            }}
          >
            Projects ↑
          </Button>

          {openProjects && (
            <div className="absolute bottom-full mb-2 right-0 bg-white border border-zinc-200 rounded-md shadow-lg py-2 z-50 w-48">
              <Link href="https://invoice9aug.vercel.app/">
                <Button variant="link" className='w-full text-left px-4 py-1.5 text-zinc-500 hover:text-green-600'>
                  Invoice Generator
                </Button>
              </Link>
              <Link href="https://textscan.vercel.app/">
                <Button variant="link" className='w-full text-left px-4 py-1.5 text-zinc-500 hover:text-green-600'>
                  Text Converter
                </Button>
              </Link>
              <Link href="/CargoBookingPage">
                <Button variant="link" className='w-full text-left px-4 py-1.5 text-zinc-500 hover:text-green-600'>
                  Cargo Service
                </Button>
              </Link>
            </div>
          )}
        </div>


        {/* Older site logins (moved here from the navbar, whose Login button now
    opens the customer account for event bookings). Hidden while a customer
    is signed in. */}
        {/* {showLogin && (
          <div className="relative">
            <Button
              variant="link"
              className='p-0 h-6 text-zinc-500 hover:text-green-600'
              onClick={() => {
                setOpenLogin(prev => !prev);
                setOpenTerms(false);
                setOpenProjects(false);
                setabout(false);
              }}
            >
              Login ↑
            </Button>

            {openLogin && (
              <div className="absolute bottom-full mb-2 right-0 bg-white border border-zinc-200 rounded-md shadow-lg py-2 z-50 w-48">
                <Link href="/login">
                  <Button variant="link" className='w-full text-left px-4 py-1.5 text-zinc-500 hover:text-green-600'>
                    User Login
                  </Button>
                </Link>
                <a href="https://matengdelivery.com/" target="_blank" rel="noopener noreferrer">
                  <Button variant="link" className='w-full text-left px-4 py-1.5 text-zinc-500 hover:text-green-600'>
                    Business Login
                  </Button>
                </a>
                <Link href="/admin">
                  <Button variant="link" className='w-full text-left px-4 py-1.5 text-zinc-500 hover:text-green-600'>
                    Admin Login
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )} */}

      </div>
    </div>
  );
}
