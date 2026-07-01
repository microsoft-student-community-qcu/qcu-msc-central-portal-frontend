import { jsPDF } from "jspdf";
import type { FullEvent } from "@/lib/events-data";

type Extracted = {
  fullName: string;
  studentNumber: string;
  program: string;
};

// Brand palette — approximated from src/styles.css oklch tokens
const COLOR = {
  deep: [11, 31, 77] as [number, number, number],          // brand-blue-deep
  deepMid: [20, 42, 102] as [number, number, number],
  deepDark: [6, 18, 48] as [number, number, number],
  orange: [232, 93, 58] as [number, number, number],       // brand-orange
  orangeWarm: [245, 158, 72] as [number, number, number],
  blue: [91, 141, 239] as [number, number, number],        // brand-blue
  star: [255, 255, 255] as [number, number, number],
  paper: [255, 255, 255] as [number, number, number],
  ink: [11, 31, 77] as [number, number, number],
  inkSoft: [80, 95, 140] as [number, number, number],
};

function qrCells(seed: string, size: number) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    out.push((h >>> 0) % 100 < 48);
  }
  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) =>
      r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
  };
  const finderCell = (r: number, c: number) => {
    const lr = r < 7 ? r : r - (size - 7);
    const lc = c < 7 ? c : c - (size - 7);
    const ring = lr === 0 || lr === 6 || lc === 0 || lc === 6;
    const inner = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
    return ring || inner;
  };
  return { cells: out, isFinder, finderCell };
}

// Deterministic pseudo-random for star placement
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

export async function buildTicketPDF({
  event,
  extracted,
  email,
  payload,
}: {
  event: FullEvent;
  extracted: Extracted;
  email: string;
  payload: string;
}): Promise<Blob> {
  // Boarding-pass shape: 100 x 200 mm portrait
  const W = 100;
  const H = 200;
  const doc = new jsPDF({ unit: "mm", format: [W, H], orientation: "portrait" });

  // ===== Background: deep space with vertical gradient (banded) =====
  const bands = 60;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    const r = Math.round(COLOR.deepDark[0] + (COLOR.deepMid[0] - COLOR.deepDark[0]) * t);
    const g = Math.round(COLOR.deepDark[1] + (COLOR.deepMid[1] - COLOR.deepDark[1]) * t);
    const b = Math.round(COLOR.deepDark[2] + (COLOR.deepMid[2] - COLOR.deepDark[2]) * t);
    doc.setFillColor(r, g, b);
    doc.rect(0, (H / bands) * i, W, H / bands + 0.2, "F");
  }

  // Faint orbit arcs (top-right and bottom-left)
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.15);
  doc.setLineDashPattern([0.6, 0.8], 0);
  // jsPDF lacks opacity helper without GState; use mid color instead
  doc.setDrawColor(70, 90, 150);
  doc.circle(W + 8, -10, 40, "S");
  doc.circle(-12, H + 6, 38, "S");
  doc.setLineDashPattern([], 0);

  // ===== Stars =====
  const rand = rng(payload);
  for (let i = 0; i < 55; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const size = 0.18 + rand() * 0.45;
    const bright = 160 + Math.floor(rand() * 95);
    doc.setFillColor(bright, bright, 255);
    doc.circle(x, y, size, "F");
  }
  // A few bright accent stars
  for (let i = 0; i < 6; i++) {
    const x = rand() * W;
    const y = rand() * H;
    doc.setFillColor(255, 245, 220);
    doc.circle(x, y, 0.7, "F");
  }

  // ===== Header band =====
  const headerH = 30;
  doc.setFillColor(255, 255, 255);
  // glass-like header — slight off-white over deep bg
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(6, 6, W - 12, headerH, 4, 4, "F");

  // Orange accent stripe
  doc.setFillColor(...COLOR.orange);
  doc.roundedRect(6, 6, 4, headerH, 2, 2, "F");

  doc.setTextColor(...COLOR.deep);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("QCU · MSC", 13, 12);
  doc.setTextColor(...COLOR.orange);
  doc.text("BOARDING PASS", 26, 12);

  doc.setTextColor(...COLOR.deep);
  doc.setFontSize(11);
  doc.text("Now boarding", 13, 19);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLOR.inkSoft);
  const tagline = clip(`Destination: ${event.title}`, 42);
  doc.text(tagline, 13, 24);
  doc.setFontSize(6.5);
  doc.text(clip(`${event.tag} · ${event.date}`, 50), 13, 28.5);
  doc.text(clip(event.location, 50), 13, 32);

  // ===== Mission caption between header and ticket =====
  doc.setTextColor(220, 230, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("MISSION BRIEFING", W / 2, 44, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  wrapped(doc, "You've been cleared to join the next leg of the mission. Carry this pass — it's your seat in orbit.", W / 2, 49, W - 20, 4, "center");

  // ===== Ticket card (white) =====
  const cardX = 8;
  const cardY = 62;
  const cardW = W - 16;
  const cardH = 110;
  doc.setFillColor(...COLOR.paper);
  doc.roundedRect(cardX, cardY, cardW, cardH, 5, 5, "F");

  // Top label
  doc.setTextColor(...COLOR.inkSoft);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("SCAN AT THE GATE", cardX + cardW / 2, cardY + 7, { align: "center" });

  // QR
  const qrSize = 25;
  const qrPx = cardW - 22;
  const qrX = cardX + (cardW - qrPx) / 2;
  const qrY = cardY + 10;
  const cell = qrPx / qrSize;
  const { cells, isFinder, finderCell } = qrCells(payload, qrSize);
  // QR background pad
  doc.setFillColor(245, 248, 255);
  doc.roundedRect(qrX - 3, qrY - 3, qrPx + 6, qrPx + 6, 2, 2, "F");
  doc.setFillColor(...COLOR.deep);
  for (let i = 0; i < qrSize * qrSize; i++) {
    const r = Math.floor(i / qrSize);
    const c = i % qrSize;
    const onF = isFinder(r, c);
    const filled = onF ? finderCell(r, c) : cells[i];
    if (!filled) continue;
    doc.rect(qrX + c * cell, qrY + r * cell, cell, cell, "F");
  }

  // Passenger block
  const passY = qrY + qrPx + 7;
  doc.setTextColor(...COLOR.inkSoft);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("PASSENGER", cardX + 6, passY);
  doc.text("FLIGHT", cardX + cardW - 6, passY, { align: "right" });

  doc.setTextColor(...COLOR.ink);
  doc.setFontSize(11);
  doc.text(clip(extracted.fullName, 28), cardX + 6, passY + 5);
  doc.setFontSize(10);
  doc.text(`QCU-${event.id.toUpperCase()}`, cardX + cardW - 6, passY + 5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR.inkSoft);
  doc.text(clip(`${extracted.studentNumber} · ${extracted.program}`, 40), cardX + 6, passY + 10);
  doc.text(clip(email, 40), cardX + 6, passY + 14);

  // ===== Perforated divider + stub =====
  const stubY = cardY + cardH + 4;
  const stubH = 18;
  doc.setFillColor(...COLOR.paper);
  doc.roundedRect(cardX, stubY, cardW, stubH, 5, 5, "F");

  // perforations — small white circles cut visually with deep-bg dots
  doc.setFillColor(...COLOR.deepDark);
  for (let x = cardX + 4; x < cardX + cardW - 2; x += 2.6) {
    doc.circle(x, stubY - 0.5, 0.55, "F");
  }

  doc.setTextColor(...COLOR.inkSoft);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("GATE", cardX + 5, stubY + 5);
  doc.text("SEAT", cardX + 28, stubY + 5);
  doc.text("BOARDS", cardX + 51, stubY + 5);
  doc.text("ZONE", cardX + cardW - 5, stubY + 5, { align: "right" });

  doc.setTextColor(...COLOR.ink);
  doc.setFontSize(10);
  const seat = `${extracted.studentNumber.slice(-2) || "07"}A`;
  doc.text("A-12", cardX + 5, stubY + 11);
  doc.text(seat, cardX + 28, stubY + 11);
  doc.text(clip(event.date.split(",")[0] || event.date, 12), cardX + 51, stubY + 11);
  doc.setTextColor(...COLOR.orange);
  doc.text("ORBIT", cardX + cardW - 5, stubY + 11, { align: "right" });

  doc.setTextColor(...COLOR.inkSoft);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.text(clip(payload, 70), cardX + cardW / 2, stubY + 16, { align: "center" });

  // ===== Footer story line =====
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("QCU MICROSOFT STUDENT COMMUNITY", W / 2, H - 10, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 200, 240);
  doc.setFontSize(6);
  doc.text("Build · Launch · Inspire — see you on the launchpad.", W / 2, H - 6, { align: "center" });

  return doc.output("blob");
}

function clip(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function wrapped(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lh: number,
  align: "left" | "center" | "right" = "left",
) {
  const lines = doc.splitTextToSize(text, maxW) as string[];
  lines.forEach((ln, i) => doc.text(ln, x, y + i * lh, { align }));
}
