"use client";

/* eslint-disable @next/next/no-img-element -- canvas-generated data URLs, not optimizable by next/image */
import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Loader2, Printer, QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { triggerDownload } from "@/lib/download";
import { useClosing, useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";
import type { Messages } from "@/lib/i18n";

// Everything the guest needs is in the URL, so the QR is made entirely in the
// browser. We draw one "table card" (title + QR + instructions + optional PIN)
// onto a canvas and reuse that single PNG for the preview, the download and the
// print — no server and no DOM-to-image dependency.

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draws centered text, wrapping onto at most two lines. Returns the y below it.
function drawWrapped(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, 2);
  if (lines.length > 2) shown[1] = `${shown[1]}…`;
  shown.forEach((l, i) => ctx.fillText(l, cx, y + i * lineHeight));
  return y + shown.length * lineHeight;
}

// A centered rounded "pill" with a label inside. Returns its height.
function pill(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  opts: { font: string; textColor: string; bg: string; padX?: number; h?: number },
) {
  const { font, textColor, bg, padX = 42, h = 72 } = opts;
  ctx.font = font;
  const w = ctx.measureText(text).width + padX * 2;
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 2);
  ctx.textBaseline = "alphabetic";
  return h;
}

// Brand palette, straight from globals.css.
const CREAM = "#f9f2e6";
const LILAC = "#cfb0ff";
const BLAZE = "#ff6a33";
const INK = "#1d1b24";

// The same orange ribbons as <Swirls /> (viewBox 1200×800), so the printed card
// reads as part of the site.
const SWIRLS: [string, number][] = [
  ["M-80 180C120 40 330 20 420 140C510 260 360 420 190 520C40 610 -40 720 -60 900", 150],
  ["M1300 40C1080 120 930 300 880 520C840 700 900 820 980 900", 130],
  ["M560 -120C640 20 760 60 860 20", 110],
  ["M430 930C520 760 700 700 820 780", 100],
];

async function buildCard(url: string, title: string, pin: string, q: Messages["qr"], appName: string): Promise<string> {
  const W = 1080;
  const H = 1500;
  const px = 40;
  const py = 40;
  const pw = W - px * 2;
  const ph = H - py * 2;
  const cx = W / 2;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  const ls = ctx as CanvasRenderingContext2D & { letterSpacing: string };

  // Cream page, then the rounded lilac panel.
  ctx.fillStyle = "#fbf6ee";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 72);
  ctx.clip();
  ctx.fillStyle = LILAC;
  ctx.fillRect(px, py, pw, ph);

  // Orange swirls, scaled to cover the panel (same as preserveAspectRatio="slice").
  const scale = Math.max(pw / 1200, ph / 800);
  ctx.save();
  ctx.translate(px + (pw - 1200 * scale) / 2, py + (ph - 800 * scale) / 2);
  ctx.scale(scale, scale);
  ctx.strokeStyle = BLAZE;
  ctx.lineCap = "round";
  for (const [d, width] of SWIRLS) {
    ctx.lineWidth = width;
    ctx.stroke(new Path2D(d));
  }
  ctx.restore();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Kicker.
  ls.letterSpacing = "2px";
  ctx.fillStyle = CREAM;
  ctx.font = "600 30px system-ui, -apple-system, sans-serif";
  ctx.fillText(q.kicker, cx, py + 140);
  ls.letterSpacing = "0px";

  // Event name — the big cream serif headline.
  ctx.fillStyle = CREAM;
  ctx.font = "84px Georgia, 'Times New Roman', serif";
  const afterTitle = drawWrapped(ctx, title, cx, py + 270, pw - 140, 92);

  // QR on a white block, so it always scans.
  const qs = 520;
  const pad = 42;
  const block = qs + pad * 2;
  const qx = (W - qs) / 2;
  const blockY = afterTitle + 56;
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, url, { width: qs, margin: 0, color: { dark: INK, light: "#ffffff" } });
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, cx - block / 2, blockY, block, block, 40);
  ctx.fill();
  ctx.drawImage(qr, qx, blockY + pad);

  // Instruction in a cream pill, like the description on the site.
  let y = blockY + block + 70;
  pill(ctx, q.instruction, cx, y, {
    font: "500 29px system-ui, -apple-system, sans-serif",
    textColor: INK,
    bg: "rgba(249,242,230,0.92)",
    h: 76,
    padX: 36,
  });

  // The link itself, in cream.
  y += 78;
  ctx.fillStyle = CREAM;
  ctx.font = "600 30px system-ui, -apple-system, sans-serif";
  ctx.fillText(url.replace(/^https?:\/\//, ""), cx, y);

  // Optional PIN, as a blaze button.
  if (pin) {
    y += 74;
    pill(ctx, `PIN · ${pin}`, cx, y, {
      font: "bold 36px system-ui, -apple-system, sans-serif",
      textColor: CREAM,
      bg: BLAZE,
      h: 78,
    });
  }

  // Uppercase strip at the bottom, like the site's footer line.
  ls.letterSpacing = "1px";
  ctx.fillStyle = CREAM;
  ctx.font = "800 26px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${appName} · ${q.footer}`.toUpperCase(), cx, H - py - 60);
  ls.letterSpacing = "0px";

  return canvas.toDataURL("image/png");
}

// Prints an image on its own page via a hidden iframe (no popup, prints only the card).
function printImage(dataUrl: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("style", "position:fixed;right:0;bottom:0;width:0;height:0;border:0;");
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:14mm}html,body{margin:0}img{width:100%;height:auto}</style></head><body><img src="${dataUrl}" onload="window.focus();window.print();"></body></html>`,
  );
  doc.close();
  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  if (iframe.contentWindow) iframe.contentWindow.onafterprint = cleanup;
  setTimeout(cleanup, 60_000);
}

export function QrCodeDialog({
  url,
  title,
  hasPin,
  fileBase,
}: {
  url: string;
  title: string;
  hasPin: boolean;
  fileBase: string;
}) {
  const t = useT();
  const q = t.qr;
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [cardUrl, setCardUrl] = useState<string | null>(null);

  const render = useCallback(async () => {
    setCardUrl(null);
    try {
      setCardUrl(await buildCard(url, title, pin.trim(), q, t.app.name));
    } catch (e) {
      console.error("QR card render failed", e);
    }
  }, [url, title, pin, q, t.app.name]);

  // Rebuild the card when it opens and whenever the PIN changes (debounced).
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(render, 200);
    return () => clearTimeout(id);
  }, [open, render]);

  // Esc and the page scroll lock are shared with the other overlays; `close`
  // lets the dialog animate out before it unmounts.
  const { closing, close } = useClosing(() => setOpen(false));
  useModal(open, close);

  async function downloadPlainQr() {
    const dataUrl = await QRCode.toDataURL(url, { width: 1024, margin: 2, color: { dark: INK, light: "#ffffff" } });
    triggerDownload(dataUrl, `qr-${fileBase}.png`);
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <QrCode aria-hidden />
        {q.open}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={q.title}
          className={cn(
            "fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm duration-200",
            closing ? "animate-out fade-out fill-mode-forwards" : "animate-in fade-in",
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className={cn(
              "flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-auto rounded-[1.75rem] bg-cream p-5 text-ink shadow-xl",
              closing
                ? "animate-out duration-200 fade-out slide-out-to-bottom-4 zoom-out-95 fill-mode-forwards"
                : "animate-in duration-300 fade-in slide-in-from-bottom-4 zoom-in-95",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl leading-tight">{q.title}</h2>
                <p className="text-sm text-muted-foreground">{q.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={q.close}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-card text-ink hover:bg-white"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="grid min-h-40 w-full place-items-center rounded-2xl">
              {cardUrl ? (
                <img src={cardUrl} alt={q.title} className="max-h-[52vh] w-auto max-w-full rounded-2xl object-contain shadow-inner" />
              ) : (
                <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
              )}
            </div>

            {hasPin && (
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                {q.pinField}
                <Input
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={8}
                  value={pin}
                  placeholder={q.pinPlaceholder}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="tracking-[0.3em]"
                />
              </label>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={!cardUrl} onClick={() => cardUrl && triggerDownload(cardUrl, `qr-kartica-${fileBase}.png`)}>
                <Download aria-hidden />
                {q.downloadCard}
              </Button>
              <Button type="button" variant="outline" className="text-foreground" disabled={!cardUrl} onClick={() => cardUrl && printImage(cardUrl)}>
                <Printer aria-hidden />
                {q.print}
              </Button>
              <Button type="button" variant="ghost" className="text-foreground" onClick={downloadPlainQr}>
                <QrCode aria-hidden />
                {q.downloadQr}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
