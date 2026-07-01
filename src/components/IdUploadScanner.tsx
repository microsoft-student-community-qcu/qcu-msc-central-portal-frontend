import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  VideoOff,
  Upload,
  IdCard,
  RotateCcw,
  ArrowRight,
  SwitchCamera,
} from "lucide-react";

/**
 * Live-camera ID scanner.
 *
 * Captures a single full-frame still of the QCU ID and hands it to the
 * parent for backend OCR processing. The client does NOT crop or decode
 * anything — the backend OCR engine receives the full image.
 */

export type IdSubmission = {
  source: "camera" | "upload";
  /** Full ID image, ready to send to the backend OCR engine. */
  fullIdImageFile: File;
  meta: {
    capturedAt: string; // ISO timestamp
    canvasWidth: number;
    canvasHeight: number;
  };
};

type Status =
  | { kind: "starting" }
  | { kind: "live" }
  | { kind: "capturing" }
  | { kind: "captured" }
  | { kind: "upload" }
  | { kind: "camera-error"; message: string };

const CANVAS_W = 1200;
const CANVAS_H = 1600;

async function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  type = "image/jpeg",
  quality = 0.92,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode capture."));
          return;
        }
        resolve(new File([blob], fileName, { type: blob.type }));
      },
      type,
      quality,
    );
  });
}

export function IdUploadScanner({
  onSubmit,
}: {
  onSubmit: (payload: IdSubmission) => void;
  /** Legacy prop kept for compatibility — email is no longer collected here. */
  collectEmail?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);
  const sharpSinceRef = useRef<number | null>(null);
  const autoCapturedRef = useRef(false);

  const [status, setStatus] = useState<Status>({ kind: "starting" });
  const statusRef = useRef<Status>({ kind: "starting" });
  const [cameraErrorCount, setCameraErrorCount] = useState(0);
  useEffect(() => {
    statusRef.current = status;
    if (status.kind === "camera-error") {
      setCameraErrorCount((c) => c + 1);
    }
  }, [status]);

  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  const [quality, setQuality] = useState<{
    state: "warming" | "dark" | "blurry" | "searching" | "steady" | "locked";
    message: string;
    box: { x: number; y: number; w: number; h: number } | null;
  }>({
    state: "warming",
    message: "Point the camera at your ID",
    box: null,
  });
  const boxHistoryRef = useRef<{ x: number; y: number; w: number; h: number }[]>([]);
  const smoothedBoxRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const facingModeRef = useRef<"environment" | "user">("environment");
  useEffect(() => {
    facingModeRef.current = facingMode;
  }, [facingMode]);

  const [isMobileDevice, setIsMobileDevice] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const ua = navigator.userAgent || "";
    const uaMobile = /android|iphone|ipad|ipod|mobile|tablet/i.test(ua);
    setIsMobileDevice(coarse || uaMobile);
  }, []);

  const stopCamera = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus({
        kind: "camera-error",
        message:
          "Your browser does not support live camera access. Try a recent Chrome, Safari, or Firefox build.",
      });
      return;
    }
    setStatus({ kind: "starting" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingModeRef.current } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
      setStatus({ kind: "live" });
    } catch (err) {
      setStatus({
        kind: "camera-error",
        message:
          err instanceof Error
            ? `Camera unavailable: ${err.message}`
            : "Camera unavailable. Please grant permission and try again.",
      });
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => {
      stopCamera();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live edge-detection auto-capture loop.
  useEffect(() => {
    if (status.kind !== "live") return;
    autoCapturedRef.current = false;
    sharpSinceRef.current = null;
    boxHistoryRef.current = [];
    smoothedBoxRef.current = null;

    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement("canvas");
    }
    const sample = analysisCanvasRef.current;
    const SW = 160;
    const SH = 213;
    sample.width = SW;
    sample.height = SH;
    const sctx = sample.getContext("2d", { willReadFrequently: true });

    const HOLD_MS = 900;
    const SHARP_THRESHOLD = 90;
    const DARK_THRESHOLD = 50;
    const MIN_FILL = 0.45;
    const STABILITY_TOL = 0.035;
    const SMOOTH = 0.35;

    const tick = () => {
      const video = videoRef.current;
      if (!sctx || !video || statusRef.current.kind !== "live") {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (video.readyState < 2 || video.videoWidth === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const targetRatio = SW / SH;
      const sourceRatio = vw / vh;
      let sx = 0,
        sy = 0,
        sWidth = vw,
        sHeight = vh;
      if (sourceRatio > targetRatio) {
        sWidth = vh * targetRatio;
        sx = (vw - sWidth) / 2;
      } else {
        sHeight = vw / targetRatio;
        sy = (vh - sHeight) / 2;
      }
      try {
        sctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, SW, SH);
      } catch {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const img = sctx.getImageData(0, 0, SW, SH).data;

      const luma = new Float32Array(SW * SH);
      let sum = 0;
      for (let i = 0, p = 0; i < img.length; i += 4, p++) {
        const y = 0.299 * img[i] + 0.587 * img[i + 1] + 0.114 * img[i + 2];
        luma[p] = y;
        sum += y;
      }
      const brightness = sum / (SW * SH);

      const STRONG = 26;
      const edges = new Uint8Array(SW * SH);
      let lapSum = 0;
      let lapSumSq = 0;
      let count = 0;
      for (let y = 1; y < SH - 1; y++) {
        for (let x = 1; x < SW - 1; x++) {
          const i = y * SW + x;
          const lap =
            4 * luma[i] - luma[i - 1] - luma[i + 1] - luma[i - SW] - luma[i + SW];
          lapSum += lap;
          lapSumSq += lap * lap;
          count++;
          if (Math.abs(lap) > STRONG) edges[i] = 1;
        }
      }
      const mean = lapSum / count;
      const variance = lapSumSq / count - mean * mean;

      const rowHist = new Uint16Array(SH);
      const colHist = new Uint16Array(SW);
      for (let y = 1; y < SH - 1; y++) {
        for (let x = 1; x < SW - 1; x++) {
          if (edges[y * SW + x]) {
            rowHist[y]++;
            colHist[x]++;
          }
        }
      }
      const ROW_T = Math.max(3, SW * 0.04);
      const COL_T = Math.max(3, SH * 0.04);
      let top = -1,
        bottom = -1,
        left = -1,
        right = -1;
      for (let y = 0; y < SH; y++) if (rowHist[y] > ROW_T) { top = y; break; }
      for (let y = SH - 1; y >= 0; y--) if (rowHist[y] > ROW_T) { bottom = y; break; }
      for (let x = 0; x < SW; x++) if (colHist[x] > COL_T) { left = x; break; }
      for (let x = SW - 1; x >= 0; x--) if (colHist[x] > COL_T) { right = x; break; }

      let detected: { x: number; y: number; w: number; h: number } | null = null;
      if (top >= 0 && bottom > top && left >= 0 && right > left) {
        const bw = (right - left) / SW;
        const bh = (bottom - top) / SH;
        if (bw > 0.25 && bh > 0.25) {
          detected = { x: left / SW, y: top / SH, w: bw, h: bh };
        }
      }

      let smoothed = smoothedBoxRef.current;
      if (detected) {
        if (!smoothed) smoothed = detected;
        else {
          smoothed = {
            x: smoothed.x + (detected.x - smoothed.x) * SMOOTH,
            y: smoothed.y + (detected.y - smoothed.y) * SMOOTH,
            w: smoothed.w + (detected.w - smoothed.w) * SMOOTH,
            h: smoothed.h + (detected.h - smoothed.h) * SMOOTH,
          };
        }
      } else {
        smoothed = null;
      }
      smoothedBoxRef.current = smoothed;

      if (detected) {
        boxHistoryRef.current.push(detected);
        if (boxHistoryRef.current.length > 10) boxHistoryRef.current.shift();
      } else {
        boxHistoryRef.current = [];
      }
      let stable = false;
      if (detected && boxHistoryRef.current.length >= 6) {
        const hist = boxHistoryRef.current;
        const avg = hist.reduce(
          (a, b) => ({ x: a.x + b.x, y: a.y + b.y, w: a.w + b.w, h: a.h + b.h }),
          { x: 0, y: 0, w: 0, h: 0 },
        );
        avg.x /= hist.length;
        avg.y /= hist.length;
        avg.w /= hist.length;
        avg.h /= hist.length;
        let drift = 0;
        for (const b of hist) {
          drift = Math.max(
            drift,
            Math.abs(b.x - avg.x),
            Math.abs(b.y - avg.y),
            Math.abs(b.w - avg.w),
            Math.abs(b.h - avg.h),
          );
        }
        stable = drift < STABILITY_TOL;
      }

      const fill = detected ? detected.w * detected.h : 0;

      let state: "warming" | "dark" | "blurry" | "searching" | "steady" | "locked" =
        "warming";
      let message = "Hold your ID in view";

      if (brightness < DARK_THRESHOLD) {
        state = "dark";
        message = "Too dark — improve lighting";
        sharpSinceRef.current = null;
      } else if (!detected) {
        state = "searching";
        message = "Searching for your ID…";
        sharpSinceRef.current = null;
      } else if (variance < SHARP_THRESHOLD) {
        state = "blurry";
        message = "Hold steady — image is blurry";
        sharpSinceRef.current = null;
      } else if (fill < MIN_FILL) {
        state = "searching";
        message = "Move ID closer to fill the frame";
        sharpSinceRef.current = null;
      } else if (!stable) {
        state = "steady";
        message = "Hold still…";
        sharpSinceRef.current = null;
      } else {
        const now = performance.now();
        if (sharpSinceRef.current == null) sharpSinceRef.current = now;
        const held = now - sharpSinceRef.current;
        if (held >= HOLD_MS) {
          state = "locked";
          message = "Locked — capturing…";
          if (!autoCapturedRef.current && statusRef.current.kind === "live") {
            autoCapturedRef.current = true;
            void captureFrame();
          }
        } else {
          state = "steady";
          message = "Hold still…";
        }
      }

      setQuality({ state, message, box: smoothed });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.kind]);

  useEffect(() => {
    return () => {
      if (uploadPreview) URL.revokeObjectURL(uploadPreview);
      if (capturedPreview) URL.revokeObjectURL(capturedPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (video.readyState < 2 || video.videoWidth === 0) {
      setStatus({
        kind: "camera-error",
        message: "Camera is still warming up. Try again in a second.",
      });
      return;
    }

    setStatus({ kind: "capturing" });

    try {
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable.");
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const targetRatio = CANVAS_W / CANVAS_H;
      const sourceRatio = vw / vh;
      let sx = 0,
        sy = 0,
        sWidth = vw,
        sHeight = vh;
      if (sourceRatio > targetRatio) {
        sWidth = vh * targetRatio;
        sx = (vw - sWidth) / 2;
      } else {
        sHeight = vw / targetRatio;
        sy = (vh - sHeight) / 2;
      }
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, CANVAS_W, CANVAS_H);

      const stamp = Date.now();
      const fullFile = await canvasToFile(canvas, `qcu-id-${stamp}.jpg`, "image/jpeg", 0.92);

      if (capturedPreview) URL.revokeObjectURL(capturedPreview);
      setCapturedFile(fullFile);
      setCapturedPreview(URL.createObjectURL(fullFile));
      setStatus({ kind: "captured" });
      stopCamera();
    } catch (err) {
      setStatus({
        kind: "camera-error",
        message:
          err instanceof Error
            ? `Capture failed: ${err.message}`
            : "Capture failed. Please try again.",
      });
    }
  };

  const retake = async () => {
    if (capturedPreview) URL.revokeObjectURL(capturedPreview);
    setCapturedFile(null);
    setCapturedPreview(null);
    await startCamera();
  };

  const switchToUpload = () => {
    stopCamera();
    if (capturedPreview) URL.revokeObjectURL(capturedPreview);
    setCapturedFile(null);
    setCapturedPreview(null);
    setStatus({ kind: "upload" });
  };

  const handleUploadFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const proceed = () => {
    const capturedAt = new Date().toISOString();
    if (status.kind === "upload") {
      if (!uploadFile) return;
      onSubmit({
        source: "upload",
        fullIdImageFile: uploadFile,
        meta: { capturedAt, canvasWidth: 0, canvasHeight: 0 },
      });
      return;
    }
    if (!capturedFile) return;
    onSubmit({
      source: "camera",
      fullIdImageFile: capturedFile,
      meta: { capturedAt, canvasWidth: CANVAS_W, canvasHeight: CANVAS_H },
    });
  };

  const showCamera =
    status.kind === "starting" ||
    status.kind === "live" ||
    status.kind === "capturing" ||
    status.kind === "camera-error";
  const showCaptured = status.kind === "captured" && capturedPreview;
  const showUpload = status.kind === "upload";

  return (
    <div>
      <h3 className="font-display text-lg font-bold text-brand-blue-deep">
        Verify your mission credentials
      </h3>
      <p className="mt-1 font-body text-sm text-brand-blue-deep/70">
        Position your QCU ID in the frame. Auto-capture starts once it's
        aligned and clear.
      </p>

      {showCamera && (
        <>
          <div className="mt-5 overflow-hidden rounded-3xl border-2 border-brand-blue-light bg-black">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-sm">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="absolute inset-0 h-full w-full object-cover"
              />
              <GhostFrameOverlay
                state={status.kind === "live" ? quality.state : "warming"}
                box={status.kind === "live" ? quality.box : null}
              />

              {isMobileDevice &&
                (status.kind === "live" || status.kind === "starting") && (
                  <button
                    type="button"
                    onClick={async () => {
                      const next = facingMode === "environment" ? "user" : "environment";
                      setFacingMode(next);
                      facingModeRef.current = next;
                      stopCamera();
                      await startCamera();
                    }}
                    aria-label="Switch camera"
                    className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 font-heading text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur transition hover:bg-black/70"
                  >
                    <SwitchCamera className="size-3.5" />
                    {facingMode === "environment" ? "Back" : "Front"}
                  </button>
                )}

              <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
                <span
                  className={[
                    "rounded-full px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur transition-colors",
                    status.kind !== "live"
                      ? "bg-black/55"
                      : quality.state === "locked"
                        ? "bg-emerald-600/85"
                        : quality.state === "steady"
                          ? "bg-amber-500/85"
                          : quality.state === "blurry" || quality.state === "dark"
                            ? "bg-red-600/85"
                            : "bg-black/55",
                  ].join(" ")}
                >
                  {status.kind === "live"
                    ? quality.message
                    : "Align your QCU ID within the frame"}
                </span>
              </div>

              {status.kind === "capturing" && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/65 text-white">
                  <Loader2 className="size-8 animate-spin" />
                  <p className="mt-3 font-heading text-sm font-bold uppercase tracking-[0.2em]">
                    Capturing…
                  </p>
                </div>
              )}

              {status.kind === "starting" && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/55 text-white">
                  <Loader2 className="size-8 animate-spin" />
                  <p className="mt-3 font-heading text-xs font-bold uppercase tracking-[0.2em]">
                    Starting camera…
                  </p>
                </div>
              )}

              {status.kind === "camera-error" && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center text-white">
                  <VideoOff className="size-8" />
                  <p className="font-heading text-sm font-bold">{status.message}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => void startCamera()}
                      className="rounded-full bg-white px-4 py-2 font-heading text-xs font-bold uppercase tracking-[0.15em] text-brand-blue-deep"
                    >
                      Retry
                    </button>
                    {cameraErrorCount >= 3 && (
                      <button
                        type="button"
                        onClick={switchToUpload}
                        className="rounded-full bg-brand-blue-deep px-4 py-2 font-heading text-xs font-bold uppercase tracking-[0.15em] text-white"
                      >
                        Upload instead
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-brand-blue-deep/70">
              Auto-verifying when aligned & clear
            </p>
          </div>
        </>
      )}

      {showCaptured && capturedPreview && (
        <div className="mt-5 space-y-4">
          <div className="overflow-hidden rounded-3xl border-2 border-emerald-300 bg-white">
            <img
              src={capturedPreview}
              alt="Captured QCU ID"
              className="mx-auto block aspect-[3/4] w-full max-w-sm object-cover"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => void retake()}
              className="inline-flex items-center gap-2 rounded-full border-2 border-brand-blue-light bg-white px-5 py-2.5 font-heading text-xs font-bold uppercase tracking-[0.15em] text-brand-blue-deep"
            >
              <RotateCcw className="size-4" /> Retake
            </button>
            <button
              type="button"
              onClick={proceed}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
              style={{ background: "var(--brand-blue-deep)" }}
            >
              Proceed <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="mt-5 space-y-3">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleUploadFile(e.dataTransfer.files?.[0]);
            }}
            className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand-blue-light bg-brand-blue-light/10 p-6 text-center"
          >
            {uploadPreview ? (
              <img
                src={uploadPreview}
                alt="Uploaded ID preview"
                className="max-h-56 w-auto rounded-xl border border-white object-cover shadow"
              />
            ) : (
              <div className="grid size-12 place-items-center rounded-xl bg-brand-blue-light/40 text-brand-blue-deep">
                <IdCard className="size-6" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fallbackInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-brand-blue-deep px-5 py-2.5 font-heading text-xs font-bold uppercase tracking-[0.15em] text-white"
            >
              <Upload className="size-4" />
              {uploadFile ? "Replace photo" : "Choose ID photo"}
            </button>
            <input
              ref={fallbackInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleUploadFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {uploadFile && (
              <p className="font-body text-[11px] text-brand-blue-deep/70">
                {uploadFile.name}
              </p>
            )}
            <p className="font-body text-[11px] text-brand-blue-deep/60">
              JPG or PNG. Your ID will be verified for enrollment status.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setStatus({ kind: "starting" });
                void startCamera();
              }}
              className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-brand-blue-deep/70 underline-offset-4 hover:underline"
            >
              ← Back to camera
            </button>
            <button
              type="button"
              onClick={proceed}
              disabled={!uploadFile}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--brand-blue-deep)" }}
            >
              Proceed <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        aria-hidden="true"
        style={{ display: "none" }}
      />
    </div>
  );
}

function GhostFrameOverlay({
  state = "warming",
  box,
}: {
  state?: "warming" | "dark" | "blurry" | "searching" | "steady" | "locked";
  box?: { x: number; y: number; w: number; h: number } | null;
}) {
  const stroke =
    state === "locked"
      ? "#10B981"
      : state === "steady"
        ? "#F59E0B"
        : state === "blurry" || state === "dark"
          ? "#EF4444"
          : "#FFFFFF";

  const VB_W = 300;
  const VB_H = 400;
  const b = box
    ? {
        x: Math.max(4, box.x * VB_W),
        y: Math.max(4, box.y * VB_H),
        w: Math.min(VB_W - 8, box.w * VB_W),
        h: Math.min(VB_H - 8, box.h * VB_H),
      }
    : null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <mask id="hole">
          <rect width={VB_W} height={VB_H} fill="white" />
          {b && <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={10} fill="black" />}
        </mask>
      </defs>
      <rect width={VB_W} height={VB_H} fill="rgba(0,0,0,0.45)" mask="url(#hole)" />
      {b ? (
        <>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={10}
            fill="none"
            stroke={stroke}
            strokeWidth={3}
          />
          {[
            [b.x, b.y, b.x + 22, b.y, b.x, b.y, b.x, b.y + 22],
            [b.x + b.w, b.y, b.x + b.w - 22, b.y, b.x + b.w, b.y, b.x + b.w, b.y + 22],
            [b.x, b.y + b.h, b.x + 22, b.y + b.h, b.x, b.y + b.h, b.x, b.y + b.h - 22],
            [
              b.x + b.w,
              b.y + b.h,
              b.x + b.w - 22,
              b.y + b.h,
              b.x + b.w,
              b.y + b.h,
              b.x + b.w,
              b.y + b.h - 22,
            ],
          ].map((pts, i) => (
            <g key={i} stroke={stroke} strokeWidth={4} strokeLinecap="round">
              <line x1={pts[0]} y1={pts[1]} x2={pts[2]} y2={pts[3]} />
              <line x1={pts[4]} y1={pts[5]} x2={pts[6]} y2={pts[7]} />
            </g>
          ))}
        </>
      ) : (
        <rect
          x={30}
          y={40}
          width={VB_W - 60}
          height={VB_H - 80}
          rx={14}
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth={2}
          strokeDasharray="8 8"
        />
      )}
    </svg>
  );
}
