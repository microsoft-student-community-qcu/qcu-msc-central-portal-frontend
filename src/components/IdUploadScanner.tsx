import { useState, useRef, useEffect } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Upload, IdCard, ArrowRight, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";

export type IdSubmission = {
  source: "camera" | "upload";
  fullIdImageFile: File;
  meta: {
    capturedAt: string; // ISO timestamp
    canvasWidth: number;
    canvasHeight: number;
  };
};

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

async function getCroppedImg(
  imageSrc: string,
  percentCrop: { x: number; y: number; width: number; height: number },
  fileName: string
): Promise<File> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const cropX = (percentCrop.x / 100) * image.naturalWidth;
  const cropY = (percentCrop.y / 100) * image.naturalHeight;
  let cropWidth = (percentCrop.width / 100) * image.naturalWidth;
  let cropHeight = (percentCrop.height / 100) * image.naturalHeight;

  const MAX_DIMENSION = 1600;
  let scale = 1;
  if (cropWidth > MAX_DIMENSION || cropHeight > MAX_DIMENSION) {
    if (cropWidth > cropHeight) {
      scale = MAX_DIMENSION / cropWidth;
    } else {
      scale = MAX_DIMENSION / cropHeight;
    }
  }

  const canvasWidth = Math.floor(cropWidth * scale);
  const canvasHeight = Math.floor(cropHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("No 2d context");

  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  return canvasToFile(canvas, fileName, "image/jpeg", 0.85);
}

export function IdUploadScanner({
  onSubmit,
  error,
  busy,
}: {
  onSubmit: (payload: IdSubmission) => void;
  collectEmail?: boolean;
  error?: string | null;
  busy?: boolean;
}) {
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  
  const [status, setStatus] = useState<"upload" | "cropping">("upload");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);

  // A failed OCR attempt sends the user back to picking a fresh photo.
  useEffect(() => {
    if (error && !busy) {
      setUploadPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setUploadFile(null);
      setStatus("upload");
    }
  }, [error, busy]);

  const handleUploadFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setStatus("cropping");
  };

  const retake = () => {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadFile(null);
    setUploadPreview(null);
    setStatus("upload");
  };


  const proceed = async () => {
    if (!uploadPreview || !uploadFile) return;
    let finalFile = uploadFile;
    
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      try {
        finalFile = await getCroppedImg(uploadPreview, completedCrop, "cropped-id.jpg");
      } catch (err) {
        console.error("Crop failed", err);
        return;
      }
    }

    onSubmit({
      source: "upload",
      fullIdImageFile: finalFile,
      meta: { 
        capturedAt: new Date().toISOString(), 
        canvasWidth: 1200, 
        canvasHeight: 1600 
      },
    });
  };

  return (
    <div>
      <h3 className="font-display text-lg font-bold text-brand-blue-deep">
        Upload your QCU ID
      </h3>
      <p className="mt-1 font-body text-sm text-brand-blue-deep/70">
        Please upload a clear photo of your QCU ID for verification.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 font-body text-sm text-amber-900"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}


      {status === "cropping" && uploadPreview && (
        <div className="mt-5 space-y-4">
          <div className="overflow-hidden rounded-3xl border-2 border-emerald-300 bg-white">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
              aspect={3 / 4}
            >
              <img
                src={uploadPreview}
                alt="Crop ID"
                className="mx-auto block w-full max-w-sm object-cover"
                onLoad={() => {
                  const initialCrop: Crop = {
                    unit: "%",
                    x: 5,
                    y: 5,
                    width: 90,
                    height: 90,
                  };
                  setCrop(initialCrop);
                  setCompletedCrop(initialCrop);
                }}
              />
            </ReactCrop>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={retake}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border-2 border-brand-blue-light bg-white px-5 py-2.5 font-heading text-xs font-bold uppercase tracking-[0.15em] text-brand-blue-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="size-4" /> Replace
            </button>
            <button
              type="button"
              onClick={() => void proceed()}
              disabled={busy}
              aria-busy={busy}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 font-heading text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              style={{ background: "var(--brand-blue-deep)" }}
            >
              {busy ? (
                <>
                  Verifying… <Loader2 className="size-4 animate-spin" />
                </>
              ) : (
                <>
                  Confirm Crop <ArrowRight className="size-4" />
                </>
              )}
            </button>

          </div>
        </div>
      )}

      {status === "upload" && (
        <div className="mt-5 space-y-3">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleUploadFile(e.dataTransfer.files?.[0]);
            }}
            className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand-blue-light bg-brand-blue-light/10 p-6 text-center"
          >
            <div className="grid size-12 place-items-center rounded-xl bg-brand-blue-light/40 text-brand-blue-deep">
              <IdCard className="size-6" />
            </div>
            <button
              type="button"
              onClick={() => fallbackInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-brand-blue-deep px-5 py-2.5 font-heading text-xs font-bold uppercase tracking-[0.15em] text-white"
            >
              <Upload className="size-4" />
              Choose ID photo
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
            <p className="font-body text-[11px] text-brand-blue-deep/60">
              JPG or PNG. Your ID will be verified for enrollment status.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
