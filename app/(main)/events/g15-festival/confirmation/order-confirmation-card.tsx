/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import QRCode from "react-qr-code";

// --- Helper Components ---

const DashedLine = () => (
  <div
    className="w-full border-t-2 border-dashed border-gray-600 border-border"
    aria-hidden="true"
  />
);

const ConfettiExplosion = () => {
  const confettiCount = 100;
  const colors = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#8b5cf6", "#f97316"];

  return (
    <>
      <style>
        {`
          @keyframes fall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
        `}
      </style>
      <div className="fixed inset-0 z-0 pointer-events-none">
        {Array.from({ length: confettiCount }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-4"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-20 + Math.random() * 10}%`,
              backgroundColor: colors[i % colors.length],
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `fall ${2.5 + Math.random() * 2.5}s ${Math.random() * 2}s linear forwards`,
            }}
          />
        ))}
      </div>
    </>
  );
};

// --- Ticket Props ---

export interface TicketProps extends React.HTMLAttributes<HTMLDivElement> {
  merchantOrderId: string;
  paymentStatus: "success" | "pending" | "failed";
  transactionId: string;
  subtotal: number;
  serviceFee: number;
  totalAmount: number;
  date: Date;
  ticket_codes?: string[];
}

// --- Component ---

const OrderConfirmationCard = React.forwardRef<HTMLDivElement, TicketProps>(
  (
    {
      className,
      merchantOrderId,
      paymentStatus,
      transactionId,
      subtotal,
      serviceFee,
      totalAmount,
      date,
      ticket_codes = [],
      ...props
    },
    ref
  ) => {
    const [showConfetti, setShowConfetti] = React.useState(false);

    React.useEffect(() => {
      if (paymentStatus === "success") {
        const mountTimer = setTimeout(() => setShowConfetti(true), 100);
        const unmountTimer = setTimeout(() => setShowConfetti(false), 6000);
        return () => {
          clearTimeout(mountTimer);
          clearTimeout(unmountTimer);
        };
      }
    }, [paymentStatus]);

    const formattedDate = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .format(date)
      .replace(",", " •");

    const StatusIcon = () => {
      if (paymentStatus === "success") return <CheckCircle className="w-10 h-10 text-green-500" />;
      if (paymentStatus === "pending") return <Clock className="w-10 h-10 text-yellow-500" />;
      return <XCircle className="w-10 h-10 text-red-500" />;
    };

    const StatusText = () => {
      if (paymentStatus === "success") return "Your ticket has been issued successfully";
      if (paymentStatus === "pending") return "Your payment is being processed";
      return "Your payment failed";
    };

    const total = ticket_codes.length;

    return (
      <>
        {showConfetti && <ConfettiExplosion />}

        <div
          ref={ref}
          className={cn(
            "relative w-full max-w-sm bg-gradient-to-br from-primary/15 to-secondary border-zinc-800 backdrop-blur-sm text-card-foreground rounded-2xl shadow-lg font-sans z-10",
            "animate-in fade-in-0 zoom-in-95 duration-500",
            className
          )}
          {...props}
        >
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0A0A0A]" />
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0A0A0A]" />

          {/* Header */}
          <div className="p-8 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <StatusIcon />
            </div>
            <h1 className="text-2xl font-semibold mt-4 capitalize">{paymentStatus}</h1>
            <p className="text-muted-foreground mt-1">{StatusText()}</p>
          </div>

          {/* Content */}
          <div className="px-8 pb-8 space-y-6">
            <DashedLine />

            <div className="flex items-center gap-6">
                <div>
                    <img src="/G15_Poster.jpg" alt="poster" className="rounded-md w-20 h-20"/>
                </div>
                <div>
                    <h2 className="text-lg font-bold">G15 Festival 2026</h2>
                    <p className="text-sm text-muted-foreground">July 24, 2026</p>
                    <p className="text-sm text-muted-foreground">Chumthang Sanapung</p>
                    <p className="text-sm text-muted-foreground">Gate Open • 1:00 PM</p>
                </div>
            </div>

             <DashedLine />

            <div>
              <p className="text-xs text-muted-foreground uppercase">Order ID</p>
              <p className="font-mono font-medium">{merchantOrderId}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase">Transaction ID</p>
              <p className="font-mono font-medium">{transactionId}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase">Date & Time</p>
              <p className="font-medium">{formattedDate}</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Fee</span>
                <span>₹{serviceFee}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total Paid</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>

            {/* Per-ticket QR codes */}
            {ticket_codes.length > 0 && (
              <>
                <DashedLine />

                <div className="space-y-8">
                  {ticket_codes.map((code, index) => (
                    <div key={code} className="flex flex-col items-center gap-3">
                      {/* Ticket label */}
                      <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Ticket {index + 1} of {total}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground break-all mt-1">
                          {code}
                        </p>
                      </div>

                      {/* QR */}
                      <QRCode
                        value={code}
                        size={120}
                        bgColor="transparent"
                        fgColor="currentColor"
                      />

                      {/* Divider between tickets (not after last) */}
                      {index < total - 1 && (
                        <DashedLine />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }
);

OrderConfirmationCard.displayName = "OrderConfirmationCard";

export { OrderConfirmationCard };