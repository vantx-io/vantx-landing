"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { FileText, File as FileIcon, Archive, Code, Download } from "lucide-react";
import Lightbox from "./Lightbox";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"];

function isImagePath(path: string): boolean {
  const lower = path.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
}

function extractFilename(path: string): string {
  // Path format: {clientId}/{taskId}/{timestamp}-{filename}
  const segments = path.split("/");
  const lastSegment = segments[segments.length - 1];
  // Remove the timestamp prefix (e.g., "1711234567890-")
  const dashIndex = lastSegment.indexOf("-");
  return dashIndex > 0 ? lastSegment.slice(dashIndex + 1) : lastSegment;
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

// Human-readable file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// File type badge color map per UI-SPEC
function getFileBadge(filename: string): { label: string; color: string } {
  const ext = getExtension(filename);
  if (IMAGE_EXTENSIONS.includes(ext)) return { label: ext.slice(1).toUpperCase(), color: "#27AE60" };
  if ([".pdf", ".doc", ".docx"].includes(ext)) return { label: ext.slice(1).toUpperCase(), color: "#2E75B6" };
  if ([".zip", ".gz", ".tar", ".rar", ".7z"].includes(ext)) return { label: ext.slice(1).toUpperCase(), color: "#8E44AD" };
  if ([".json", ".yaml", ".yml", ".csv", ".xml"].includes(ext)) return { label: ext.slice(1).toUpperCase(), color: "#E67E22" };
  if ([".har", ".log"].includes(ext)) return { label: ext.slice(1).toUpperCase(), color: "#5C5C56" };
  return { label: ext ? ext.slice(1).toUpperCase() : "FILE", color: "#999" };
}

// File icon selection per MIME category
function getFileIcon(filename: string) {
  const ext = getExtension(filename);
  if ([".zip", ".gz", ".tar", ".rar", ".7z"].includes(ext)) return Archive;
  if ([".ts", ".js", ".py", ".sh", ".json", ".yaml", ".yml", ".xml", ".html", ".css"].includes(ext)) return Code;
  if ([".pdf", ".doc", ".docx", ".txt", ".md", ".csv"].includes(ext)) return FileText;
  return FileIcon;
}

interface AttachmentPreviewProps {
  attachments: string[];
}

export default function AttachmentPreview({ attachments }: AttachmentPreviewProps) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [fileSizes, setFileSizes] = useState<Record<string, number>>({});
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState("");
  const t = useTranslations("tasks");

  useEffect(() => {
    async function loadAttachmentData() {
      const supabase = createClient();
      const urls: Record<string, string> = {};
      const sizes: Record<string, number> = {};

      // Generate signed URLs for image attachments on mount (per research recommendation)
      // Non-image files generate signed URLs on click (lazy, per Pitfall 6)
      const imagePaths = attachments.filter(isImagePath);
      await Promise.all(
        imagePaths.map(async (path) => {
          const { data } = await supabase.storage
            .from("task-attachments")
            .createSignedUrl(path, 3600); // 1 hour expiry per D-12
          if (data?.signedUrl) urls[path] = data.signedUrl;
        })
      );
      setSignedUrls(urls);

      // Fetch file sizes for non-image attachments via storage.list() per D-07
      // Group paths by folder to minimize API calls
      const nonImagePaths = attachments.filter(p => !isImagePath(p));
      const folderGroups: Record<string, string[]> = {};
      for (const p of nonImagePaths) {
        const segments = p.split("/");
        const folder = segments.slice(0, -1).join("/");
        const fileName = segments[segments.length - 1];
        if (!folderGroups[folder]) folderGroups[folder] = [];
        folderGroups[folder].push(fileName);
      }

      await Promise.all(
        Object.entries(folderGroups).map(async ([folder, fileNames]) => {
          const { data: files } = await supabase.storage
            .from("task-attachments")
            .list(folder, { limit: 100 });
          if (files) {
            for (const f of files) {
              if (fileNames.includes(f.name)) {
                // storage.list returns metadata with size
                const fullPath = `${folder}/${f.name}`;
                if (f.metadata?.size) {
                  sizes[fullPath] = f.metadata.size;
                }
              }
            }
          }
        })
      );
      setFileSizes(sizes);
    }
    if (attachments.length > 0) loadAttachmentData();
  }, [attachments]);

  async function handleDownload(storagePath: string) {
    // Generate signed URL on demand for non-image files (per Pitfall 6)
    if (signedUrls[storagePath]) {
      window.open(signedUrls[storagePath], "_blank");
      return;
    }
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("task-attachments")
      .createSignedUrl(storagePath, 3600);
    if (data?.signedUrl) {
      setSignedUrls(prev => ({ ...prev, [storagePath]: data.signedUrl }));
      window.open(data.signedUrl, "_blank");
    }
  }

  function openLightbox(storagePath: string) {
    const url = signedUrls[storagePath];
    if (url) {
      setLightboxSrc(url);
      setLightboxAlt(t("attachment_alt", { filename: extractFilename(storagePath) }));
    }
  }

  const images = attachments.filter(isImagePath);
  const nonImages = attachments.filter(p => !isImagePath(p));

  return (
    <>
      {/* Image grid — D-05: 120x120px thumbnails, D-08: images first */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {images.map((path) => (
            <button
              key={path}
              onClick={() => openLightbox(path)}
              className="w-[120px] h-[120px] rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:opacity-90 transition flex-shrink-0"
              type="button"
            >
              {signedUrls[path] ? (
                <img
                  src={signedUrls[path]}
                  alt={t("attachment_alt", { filename: extractFilename(path) })}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Non-image file list — D-07: icon + filename + file size + type badge */}
      {nonImages.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {nonImages.map((path) => {
            const filename = extractFilename(path);
            const badge = getFileBadge(filename);
            const IconComponent = getFileIcon(filename);
            const fileSize = fileSizes[path];
            return (
              <button
                key={path}
                onClick={() => handleDownload(path)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-brand-bg hover:bg-gray-100 transition cursor-pointer text-left w-full group"
                type="button"
                aria-label={t("download_file", { filename })}
              >
                <IconComponent className="w-4 h-4 text-brand-muted flex-shrink-0" />
                <span className="text-sm text-brand-dark flex-1 truncate">{filename}</span>
                {/* File size per D-07 — fetched from Supabase Storage metadata */}
                {fileSize !== undefined && (
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(fileSize)}</span>
                )}
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                  style={{ background: badge.color + "18", color: badge.color }}
                >
                  {badge.label}
                </span>
                <Download className="w-4 h-4 text-brand-muted ml-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition" />
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox modal — D-06 */}
      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          alt={lightboxAlt}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}
