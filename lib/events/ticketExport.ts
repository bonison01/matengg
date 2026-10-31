// Save on-screen PremiumTicket nodes as PNG (one ticket) or PDF (all tickets,
// one per A4 page). Libraries load on demand — only when someone downloads.

const PIXEL_RATIO = 3;
// PDF pages are this colour; JPEG snapshots are flattened onto it so the
// ticket's cut-outs still read as cut-outs.
const PAGE_RGB: [number, number, number] = [11, 20, 16];
const PAGE_HEX = "#0B1410";
// 1×1 transparent GIF: an image that can't be fetched is left blank instead
// of failing the whole snapshot.
const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

type Snap = { dataUrl: string; width: number; height: number };

const isSafari = () =>
  typeof navigator !== "undefined" && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/** PNG keeps the transparent notches; JPEG is for the PDF, where jsPDF embeds
 *  it as-is (it would otherwise decode a 1080×2400 PNG in JS — tens of seconds). */
async function snapshot(node: HTMLElement, format: "png" | "jpeg", fontEmbedCSS?: string): Promise<Snap> {
  const { toPng, toJpeg } = await import("html-to-image");
  const render = format === "png" ? toPng : toJpeg;
  await document.fonts?.ready;
  const opts = {
    pixelRatio: PIXEL_RATIO,
    cacheBust: false,
    imagePlaceholder: BLANK,
    fontEmbedCSS,
    // The on-screen drop shadow would be clipped at the node's edge.
    style: { filter: "none" },
    ...(format === "jpeg" ? { quality: 0.92, backgroundColor: PAGE_HEX } : {}),
  };
  // Safari often drops images from the first snapshot; the second is complete.
  if (isSafari()) await render(node, opts).catch(() => {});
  const dataUrl = await render(node, opts);
  return { dataUrl, width: node.offsetWidth, height: node.offsetHeight };
}

function save(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadTicketPng(node: HTMLElement, filename: string) {
  const { dataUrl } = await snapshot(node, "png");
  save(dataUrl, filename);
}

export async function downloadTicketsPdf(nodes: HTMLElement[], filename: string) {
  if (!nodes.length) return;
  const [{ jsPDF }, { getFontEmbedCSS }] = await Promise.all([import("jspdf"), import("html-to-image")]);
  // Fonts are the same for every ticket — embed them once.
  const fontEmbedCSS = await getFontEmbedCSS(nodes[0]).catch(() => undefined);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < nodes.length; i++) {
    const snap = await snapshot(nodes[i], "jpeg", fontEmbedCSS);
    if (i > 0) pdf.addPage();
    pdf.setFillColor(...PAGE_RGB);
    pdf.rect(0, 0, pageW, pageH, "F");
    const maxW = 100, maxH = pageH - 40;
    const scale = Math.min(maxW / snap.width, maxH / snap.height);
    const w = snap.width * scale, h = snap.height * scale;
    pdf.addImage(snap.dataUrl, "JPEG", (pageW - w) / 2, (pageH - h) / 2, w, h);
  }
  pdf.save(filename);
}
