"use client";

import { useEffect } from "react";

export default function PreNeetRules() {
  useEffect(() => {
    window.location.href = "/preneetrules.pdf";
  }, []);

  return (
    <div style={{textAlign:"center", marginTop:"50px"}}>
      <p>Redirecting to rules document...</p>
    </div>
  );
}