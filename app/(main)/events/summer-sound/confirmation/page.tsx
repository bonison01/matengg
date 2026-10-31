'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { OrderConfirmationCard } from './order-confirmation-card'
import { Skeleton } from '@/components/ui/skeleton'
import { toPng } from 'html-to-image'
import { Download, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const API_BASE_URL = "https://api.matengdelivery.com";
// const API_BASE_URL = "http://127.0.0.1:8000";


function Page() {
  const [order, setOrder] = useState<any>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const hasAutoDownloaded = useRef(false)
  const router = useRouter()

  const getCookie = (name: string) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? match[2] : null
  }

  const downloadTicket = useCallback(async () => {
    if (!cardRef.current) return

    // Check if payment is successful before downloading
    if (order?.payment_status !== 'success') {
      console.log('Download blocked: Payment not successful')
      return
    }

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

  // Fetch order
  useEffect(() => {
    const merchantOrderId = getCookie('merchant_order_id')
    if (!merchantOrderId) return

    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/billing/payment/status/${merchantOrderId}`,
          { headers: { accept: 'application/json' } }
        )
        const data = await res.json()
        setOrder(data)
      } catch (err) {
        console.error('Failed to fetch payment status', err)
      }
    }

    fetchStatus()
  }, [])

  // Auto-download once order is loaded
  useEffect(() => {
    if (!order) return

    if (!hasAutoDownloaded.current && order.payment_status === 'success') {
      hasAutoDownloaded.current = true
      setTimeout(() => { downloadTicket() }, 800)
    }
  }, [order, downloadTicket])

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

  // Check if payment is successful
  const isPaymentSuccessful = order.payment_status === 'success'

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
        ) : (
          <p className="text-sm text-red-400 text-center max-w-md">
            Payment was not successful. Please try again or contact support.
          </p>
        )}
      </motion.div>

      {/* Action buttons - Only show if payment is successful */}
      {isPaymentSuccessful && (
        <div className="flex items-center gap-3">
          <Button className="bg-green-500 text-white" onClick={downloadTicket}>
            <Download size={16} />
            Download Ticket
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/events/summer-sound')}
          >
            Go to Ticket
            <ArrowRight size={16} />
          </Button>
        </div>
      )}

      {/* Ticket */}
      <div ref={cardRef}>
        <OrderConfirmationCard
          merchantOrderId={order.merchant_order_id}
          paymentStatus={order.payment_status}
          // transactionId={order.phonepe_transaction_id}
          paymentId={order.razorpay_payment_id}
          subtotal={order.subtotal}
          serviceFee={order.service_fee}
          totalAmount={order.total_amount}
          ticket_codes={order.ticket_codes}
          date={new Date()}
        />
      </div>

    </div>
  )
}

export default Page