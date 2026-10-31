'use client'

import React, { Suspense, useEffect, useState, useRef, useCallback } from 'react'
import { OrderConfirmationCard } from './order-confirmation-card'
import { Skeleton } from '@/components/ui/skeleton'
import { toPng } from 'html-to-image'
import { Download, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

const API_BASE_URL = 'https://api.matengdelivery.com'
// const API_BASE_URL = "http://localhost:8000";

function ConfirmationContent() {
  const [order, setOrder] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const hasAutoDownloaded = useRef(false)
  const pollAttempts = useRef(0)
  const router = useRouter()
  const searchParams = useSearchParams()

  const paymentParam = searchParams.get('payment')
  const merchantOrderId =
    searchParams.get('merchantOrderId') ||
    (typeof window !== 'undefined' ? localStorage.getItem('merchant_order_id') : null)

  const downloadTicket = useCallback(async () => {
    if (!cardRef.current) return
    if (order?.payment_status !== 'success') return

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#1a1a1a',
      })
      const link = document.createElement('a')
      link.download = `ticket-${order?.merchant_order_id ?? 'ticket'}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Download failed', err)
    }
  }, [order])

  const fetchStatus = useCallback(async () => {
    if (!merchantOrderId) return
    try {
      const res = await fetch(
        `${API_BASE_URL}/billing-event2/payment/status/${merchantOrderId}`,
        { headers: { accept: 'application/json' } }
      )
      if (!res.ok) {
        setNotFound(true)
        return
      }
      const data = await res.json()
      setOrder(data)
    } catch (err) {
      console.error('Failed to fetch payment status', err)
      setNotFound(true)
    }
  }, [merchantOrderId])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (!order) return
    const needsPoll =
      order.payment_status === 'pending' ||
      (order.payment_status === 'success' && (!order.ticket_codes || order.ticket_codes.length === 0))

    if (!needsPoll || pollAttempts.current >= 10) return

    const timer = setTimeout(() => {
      pollAttempts.current += 1
      fetchStatus()
    }, 3000)

    return () => clearTimeout(timer)
  }, [order, fetchStatus])

  useEffect(() => {
    if (!order) return
    if (!hasAutoDownloaded.current && order.payment_status === 'success') {
      hasAutoDownloaded.current = true
      setTimeout(() => {
        downloadTicket()
      }, 800)
    }
  }, [order, downloadTicket])

  if (!merchantOrderId || notFound) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-4">
        <p className="text-sm text-red-400 text-center max-w-md">
          We couldn&apos;t find that order. If you just paid, please check your email for your tickets,
          or contact support.
        </p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 rounded-2xl border p-8 shadow-lg bg-gradient-to-br from-primary/15 to-secondary border-zinc-800 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-42" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-62" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex justify-center">
            <Skeleton className="h-40 w-40 rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  const isPaymentSuccessful = order.payment_status === 'success'
  const isPaymentFailed = order.payment_status === 'failed' || paymentParam === 'error'

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex flex-col items-center gap-2"
      >
        {isPaymentSuccessful ? (
          <p className="text-sm text-zinc-300 text-center max-w-md">
            Confirmation details and your ticket with QR code have been sent to your email.
            Please check your inbox or junk folder.
          </p>
        ) : isPaymentFailed ? (
          <p className="text-sm text-red-400 text-center max-w-md">
            Payment was not successful. Please try again or contact support.
          </p>
        ) : (
          <p className="text-sm text-zinc-300 text-center max-w-md">
            We&apos;re confirming your payment. This page will update automatically.
          </p>
        )}
      </motion.div>

      <div className="flex items-center gap-3">
        {isPaymentSuccessful && (
          <Button className="bg-green-500 text-white" onClick={downloadTicket}>
            <Download size={16} />
            Download Ticket
          </Button>
        )}
        {isPaymentFailed && (
          <Button
            className="bg-green-500 text-white"
            onClick={() => router.push('/events/abok-ki-singju')}
          >
            Try Again
            <ArrowRight size={16} />
          </Button>
        )}
        {isPaymentSuccessful && (
          <Button variant="outline" onClick={() => router.push('/events/abok-ki-singju')}>
            Go to Event
            <ArrowRight size={16} />
          </Button>
        )}
      </div>

      <div ref={cardRef}>
        <OrderConfirmationCard
          merchantOrderId={order.merchant_order_id}
          paymentStatus={order.payment_status}
          paymentId={order.razorpay_payment_id}
          subtotal={order.subtotal}
          serviceFee={order.service_fee}
          totalAmount={order.total_amount}
          ticket_codes={order.ticket_codes}
          date={new Date()}
          eventName="Abok Ki Singju"
          eventDateLabel="4th October 2026"
          eventVenue="M.S.F.D.S"
          eventGateTime="Premiere screening"
          posterSrc="/abok-ki-singju.jpeg"
        />
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ConfirmationContent />
    </Suspense>
  )
}
