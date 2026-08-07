/**
 * Crash/reload-safe progress for the multi-step application form.
 *
 * The picked `File` objects are deliberately NOT persisted: they are OS-managed
 * handles, not serialisable data. The backend copy (saved by `batch-2`) is the
 * source of truth for documents, so we persist only the *names* plus how far the
 * draft has been saved server-side. That is what stops a long session or an
 * accidental reload from reporting "no attachment" for a document the server
 * already has.
 */

const KEY = "qcumsc.applyProgress";
const TTL_MS = 24 * 60 * 60 * 1000;

export type SavedDocs = { cor?: string; cv?: string };

export type ApplyProgress = {
  savedAt: number;
  draftId: string | null;
  ocrSessionId: string | null;
  /** Number of batches the backend has stored (0 = only Batch 0). */
  savedStep: number;
  savedDocs: SavedDocs;
  formStep: 1 | 2 | 3;
  form: Record<string, string>;
  confirm: {
    studentId: string;
    lastName: string;
    firstName: string;
    middleInitial: string;
    email: string;
  };
};

export function saveApplyProgress(progress: Omit<ApplyProgress, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...progress, savedAt: Date.now() }));
  } catch {
    /* storage unavailable (private mode / quota) — in-memory state still applies */
  }
}

export function loadApplyProgress(): ApplyProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ApplyProgress;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Number.isFinite(parsed.savedAt) || Date.now() - parsed.savedAt > TTL_MS) {
      clearApplyProgress();
      return null;
    }
    if (!parsed.draftId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearApplyProgress() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/**
 * A `File` from an <input type="file"> points at an OS-managed temp copy. If the
 * user takes a long time — phone locks, the file is moved/renamed/synced, or the
 * OS reclaims the cache — the handle stays in memory but becomes unreadable, and
 * uploading it fails with an opaque network error. Reading one byte is the only
 * reliable liveness check.
 */
export async function isFileStillReadable(file: File): Promise<boolean> {
  try {
    await file.slice(0, 1).arrayBuffer();
    return true;
  } catch {
    return false;
  }
}
