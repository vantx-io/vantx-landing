"use client";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { Paperclip, X, AlertCircle, FileText } from "lucide-react";

const BLOCKED_EXTENSIONS = [".exe", ".sh", ".bat", ".cmd", ".ps1", ".msi", ".dll", ".so"];
const MAX_FILE_SIZE = 52_428_800; // 50 MB

function isBlockedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return BLOCKED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

interface PendingFile {
  file: File;
  id: string;
  previewUrl: string | null;
  progress: number;
  error: string | null;
  status: "pending" | "uploading" | "done" | "error";
}

interface CommentFormProps {
  taskId: string;
  clientId: string;
  userId: string;
  onCommentAdded: () => void;
}

export default function CommentForm({
  taskId,
  clientId,
  userId,
  onCommentAdded,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [rejections, setRejections] = useState<
    { filename: string; reason: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("tasks");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxSize: MAX_FILE_SIZE,
    noClick: true,
    multiple: true,
    onDrop: (accepted, fileRejections) => {
      const newRejections: { filename: string; reason: string }[] = [];

      fileRejections.forEach((r) => {
        newRejections.push({
          filename: r.file.name,
          reason: t("error_size", { filename: r.file.name }),
        });
      });

      const valid: File[] = [];
      accepted.forEach((file) => {
        if (isBlockedExtension(file.name)) {
          newRejections.push({
            filename: file.name,
            reason: t("error_executable", { filename: file.name }),
          });
        } else {
          valid.push(file);
        }
      });

      setRejections((prev) => [...prev, ...newRejections]);

      const newPending = valid.map((file) => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        previewUrl: isImageFile(file) ? URL.createObjectURL(file) : null,
        progress: 0,
        error: null,
        status: "pending" as const,
      }));
      setPendingFiles((prev) => [...prev, ...newPending]);
    },
  });

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  async function uploadFile(pending: PendingFile): Promise<string> {
    const supabase = createClient();
    const safeName = pending.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${clientId}/${taskId}/${Date.now()}-${safeName}`;

    let pct = 0;
    const ticker = setInterval(() => {
      pct = Math.min(pct + 8, 90);
      setPendingFiles((prev) =>
        prev.map((f) =>
          f.id === pending.id
            ? { ...f, progress: pct, status: "uploading" as const }
            : f,
        ),
      );
    }, 300);

    try {
      const { data, error } = await supabase.storage
        .from("task-attachments")
        .upload(path, pending.file, { cacheControl: "3600", upsert: false });

      clearInterval(ticker);
      if (error) throw error;

      setPendingFiles((prev) =>
        prev.map((f) =>
          f.id === pending.id
            ? { ...f, progress: 100, status: "done" as const }
            : f,
        ),
      );
      return data.path;
    } catch (err) {
      clearInterval(ticker);
      setPendingFiles((prev) =>
        prev.map((f) =>
          f.id === pending.id
            ? {
                ...f,
                progress: 0,
                status: "error" as const,
                error: t("error_upload_failed"),
              }
            : f,
        ),
      );
      throw err;
    }
  }

  async function handleSubmit() {
    if (submitting) return;
    if (!content.trim() && pendingFiles.length === 0) return;

    setSubmitting(true);
    setRejections([]);

    try {
      const uploadPromises = pendingFiles
        .filter((f) => f.status !== "error")
        .map((f) => uploadFile(f).catch(() => null));

      const paths = (await Promise.all(uploadPromises)).filter(
        Boolean,
      ) as string[];

      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          content: content.trim(),
          attachments: paths.length > 0 ? paths : null,
        }),
      });

      if (!res.ok) throw new Error("Comment submit failed");

      setContent("");
      pendingFiles.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
      setPendingFiles([]);
      onCommentAdded();
    } catch {
      setRejections([{ filename: "", reason: t("error_comment_submit") }]);
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newRejections: { filename: string; reason: string }[] = [];
      const valid: File[] = [];
      files.forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          newRejections.push({
            filename: file.name,
            reason: t("error_size", { filename: file.name }),
          });
        } else if (isBlockedExtension(file.name)) {
          newRejections.push({
            filename: file.name,
            reason: t("error_executable", { filename: file.name }),
          });
        } else {
          valid.push(file);
        }
      });
      setRejections((prev) => [...prev, ...newRejections]);
      const newPending = valid.map((file) => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        previewUrl: isImageFile(file) ? URL.createObjectURL(file) : null,
        progress: 0,
        error: null,
        status: "pending" as const,
      }));
      setPendingFiles((prev) => [...prev, ...newPending]);
    }
    e.target.value = "";
  }

  return (
    <div className="mt-3">
      <div
        {...getRootProps()}
        className={`relative rounded-lg border transition ${
          isDragActive
            ? "border-brand-accent bg-brand-accent/5"
            : "border-gray-200"
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-lg z-10"
            aria-live="polite"
          >
            <span className="text-sm text-brand-accent font-medium">
              {t("drop_files_here")}
            </span>
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("comment_placeholder")}
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none min-h-[80px] bg-transparent resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>

      {/* Preview strip */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 py-2">
          {pendingFiles.map((pf) => (
            <div key={pf.id} className="relative">
              {pf.previewUrl ? (
                <div className="relative w-[80px] h-[80px] rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                  <img
                    src={pf.previewUrl}
                    alt={pf.file.name}
                    className="object-cover w-full h-full"
                  />
                  <button
                    onClick={() => removeFile(pf.id)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition"
                    type="button"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                  {pf.status === "uploading" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                      <div
                        className="h-1 bg-brand-accent transition-all"
                        style={{ width: `${pf.progress}%` }}
                        role="progressbar"
                        aria-valuenow={pf.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Uploading ${pf.file.name}`}
                      />
                    </div>
                  )}
                  {pf.status === "error" && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2 py-2 rounded-lg border border-gray-100 bg-white max-w-[200px] relative">
                  <FileText className="w-4 h-4 text-brand-muted flex-shrink-0" />
                  <span className="text-xs text-brand-dark truncate flex-1">
                    {pf.file.name}
                  </span>
                  <button
                    onClick={() => removeFile(pf.id)}
                    type="button"
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                  {pf.status === "uploading" && (
                    <div className="h-1 rounded-full bg-gray-200 mt-1 w-full absolute bottom-0 left-0 right-0">
                      <div
                        className="h-1 rounded-full bg-brand-accent"
                        style={{ width: `${pf.progress}%` }}
                        role="progressbar"
                        aria-valuenow={pf.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inline rejection errors */}
      {rejections.length > 0 && (
        <div className="py-1">
          {rejections.map((r, i) => (
            <div key={i} className="text-xs text-brand-red" role="alert">
              {r.reason}
            </div>
          ))}
        </div>
      )}

      {/* Button row */}
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={handleAttachClick}
          type="button"
          aria-label={t("attach_file")}
          className={`p-2 rounded-lg hover:bg-gray-100 transition min-w-[44px] min-h-[44px] flex items-center justify-center ${
            pendingFiles.length > 0 ? "text-brand-accent" : "text-brand-muted"
          }`}
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
        <div className="flex-1" />
        <button
          onClick={handleSubmit}
          disabled={submitting || (!content.trim() && pendingFiles.length === 0)}
          className={`px-4 py-2 rounded-lg bg-brand-accent text-white text-sm font-semibold transition ${
            submitting || (!content.trim() && pendingFiles.length === 0)
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-brand-accent/90"
          }`}
        >
          {t("send")}
        </button>
      </div>

      {submitting && <span className="sr-only">{t("uploading")}</span>}
    </div>
  );
}
