// Mateng Event Terms & Conditions (tickets bought through Mateng). The page at TICKETING_TERMS_PATH
// renders these; the backend prints the same text on the ticket PDF and email
// (mateng-candidate-apis: app/services/event/event_ticket_terms.py) — keep
// the two in step.

export const TICKETING_TERMS_PATH = "/terms/mateng-event";

export const TICKETING_TERMS_INTRO =
  "By purchasing a ticket through Mateng, you acknowledge and agree to the following terms and conditions:";

export const TICKETING_TERMS: { title: string; body: string; list?: string[] }[] = [
  {
    title: "Role of Mateng",
    body: "Mateng acts solely as a ticketing and ticket distribution partner for the event. The event is organised, managed, and conducted by the respective Event Organiser / Organising Committee.",
  },
  {
    title: "Event Details & Changes",
    body: "All event details, including the event date, time, venue, lineup, performers, programme, schedule, entry rules, and other event arrangements, are provided by the Event Organiser. Mateng is not responsible or liable for any changes, postponements, cancellations, delays, venue changes, programme changes, or other modifications made by the Event Organiser.",
  },
  {
    title: "Refund & Cancellation Policy",
    body: "Refunds, cancellations, or ticket-related compensation are subject to the refund and cancellation policy of the Event Organiser. Mateng does not independently approve or process refunds unless specifically authorised by the Event Organiser.",
  },
  {
    title: "Refund Requests",
    body: "For any refund request arising due to event cancellation, postponement, date/time change, venue change, or any other event-related matter, customers must contact the Event Organiser / Organising Committee directly.",
  },
  {
    title: "Charges & Fees",
    body: "Tickets purchased through Mateng are generally non-refundable by Mateng, except where a refund has been specifically approved and instructed by the Event Organiser. Any applicable ticketing fees, service charges, payment gateway charges, GST, or other applicable charges may be non-refundable, subject to the applicable event refund policy.",
  },
  {
    title: "Event Responsibility",
    body: "The Event Organiser is solely responsible for:",
    list: [
      "the conduct and management of the event",
      "the event schedule and programme",
      "the venue and facilities",
      "artists, performers and speakers",
      "security and entry arrangements",
      "event cancellation or postponement",
      "changes to event details",
      "refund decisions and processing",
    ],
  },
  {
    title: "Ticket Validity & Entry",
    body: "A ticket purchased through Mateng only confirms the ticket transaction. Entry to the event is subject to the rules and conditions imposed by the Event Organiser and venue. Mateng is not responsible for denial of entry resulting from organiser/venue rules, invalid identification, late arrival, prohibited items, age restrictions, or other conditions imposed by the Event Organiser.",
  },
  {
    title: "Customer Information",
    body: "Customers are responsible for providing accurate information while purchasing tickets. Mateng shall not be responsible for issues arising from incorrect or incomplete customer information provided during booking.",
  },
  {
    title: "Ticket Security",
    body: "Customers are responsible for keeping their tickets, QR codes, booking references, and other ticket information secure. Mateng is not responsible for unauthorised use, duplication, sharing, or loss of ticket information.",
  },
  {
    title: "Event Updates",
    body: "Where possible, Mateng may communicate event-related updates received from the Event Organiser. Customers should also follow the official communication channels of the Event Organiser for the latest information.",
  },
  {
    title: "Limitation of Liability",
    body: "Mateng shall not be held responsible for any loss, inconvenience, expense, or damage arising from changes, cancellation, postponement, conduct, management, or execution of an event by the Event Organiser.",
  },
  {
    title: "Acceptance of Terms",
    body: "By purchasing a ticket through Mateng, the customer confirms that they have read, understood, and agreed to these Terms & Conditions and acknowledge that Mateng is acting only as the ticketing partner and is not the Event Organiser.",
  },
];

export const TICKETING_TERMS_CONTACT =
  "For event-related queries, cancellations, postponements, refunds, or changes, please contact the respective Event Organiser / Organising Committee.";
