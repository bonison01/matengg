/** Global keyframes + utility classes shared by the home page sections. */
export default function HomeStyles() {
  return (
    <style jsx global>{`
      @keyframes dash-run { to { stroke-dashoffset: -200; } }
      @keyframes drift { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      .route-line { stroke-dasharray: 5 9; animation: dash-run 14s linear infinite; }
      .stub-row > div + div { position: relative; }
      .stub-row > div + div::before {
        content: "";
        position: absolute;
        left: -1px;
        top: 50%;
        transform: translateY(-50%);
        width: 10px;
        height: 10px;
        border-radius: 9999px;
        background: #0B1410;
        box-shadow: 0 -34px 0 -1px #0B1410, 0 34px 0 -1px #0B1410;
      }
      .eyebrow { font-family: var(--font-mono); letter-spacing: 0.18em; text-transform: uppercase; }
      .tabular { font-family: var(--font-mono); font-feature-settings: "tnum" 1; }
      @keyframes pop-in {
        0% { opacity: 0; transform: translateY(24px) scale(0.98); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      .event-card {
        animation: pop-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease;
        will-change: transform;
      }
      .event-card-past {
        filter: grayscale(0.85) saturate(0.7);
        opacity: 0.82;
        box-shadow: 0 0 0 1px rgba(243,241,234,0.06), 0 20px 50px -25px rgba(0,0,0,0.6);
        transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease, filter 0.35s ease, opacity 0.35s ease;
      }
      .event-card-past:hover {
        transform: translateY(-4px);
        filter: grayscale(0.4) saturate(0.85);
        opacity: 1;
        box-shadow: 0 0 0 1px rgba(243,241,234,0.12), 0 24px 60px -25px rgba(0,0,0,0.7);
      }
      .concluded-badge { background: rgba(243,241,234,0.08); border: 1px solid rgba(243,241,234,0.18); }
      .event-card-upcoming {
        box-shadow: 0 0 0 1px rgba(63,166,55,0.35), 0 28px 70px -30px rgba(63,166,55,0.45);
        transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease;
      }
      .event-card-upcoming:hover {
        transform: translateY(-4px);
        box-shadow: 0 0 0 1px rgba(63,166,55,0.5), 0 32px 80px -30px rgba(63,166,55,0.55);
      }
      @keyframes ring-pulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(63,166,55,0.35); }
        50% { box-shadow: 0 0 0 10px rgba(63,166,55,0); }
      }
      .live-dot { animation: ring-pulse 1.8s ease-in-out infinite; }
      .tickets-soon-btn { cursor: default; opacity: 0.85; }
      .partner-track { scrollbar-width: none; -ms-overflow-style: none; }
      .partner-track::-webkit-scrollbar { display: none; }
    `}</style>
  );
}
