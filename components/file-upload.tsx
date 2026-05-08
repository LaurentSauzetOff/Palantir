"use client";

import { useState } from "react";
import Image from "next/image";

import { UploadDropzone } from "@/lib/uploadthing";

import "@uploadthing/react/styles.css";
import { FileIcon, X } from "lucide-react";

interface FileUploadProps {
  endpoint: "messageFile" | "serverImage";
  value: string;
  onChange?: (url?: string) => void;
}

// Badges d'extensions affichés dans la dropzone
const EXTENSION_BADGES: Record<
  "messageFile" | "serverImage",
  { label: string; className: string }[]
> = {
  serverImage: [
    { label: "PNG",  className: "bg-blue-500   text-white hover:cursor-zoom-in" },
    { label: "JPEG", className: "bg-blue-500   text-white hover:cursor-zoom-in" },
    { label: "WebP", className: "bg-blue-500   text-white hover:cursor-zoom-in" },
    { label: "GIF",  className: "bg-blue-500   text-white hover:cursor-zoom-in" },
  ],
  messageFile: [
    { label: "PNG",  className: "bg-blue-500   text-white hover:cursor-zoom-in" },
    { label: "JPEG", className: "bg-blue-500   text-white hover:cursor-zoom-in" },
    { label: "WebP", className: "bg-blue-500   text-white hover:cursor-zoom-in" },
    { label: "GIF",  className: "bg-blue-500   text-white hover:cursor-zoom-in" },
    { label: "MP4",  className: "bg-violet-500 text-white hover:cursor-cell" },
    { label: "WebM", className: "bg-violet-500 text-white hover:cursor-cell" },
    { label: "AUDIO", className: "bg-emerald-700 text-white hover:cursor-grab" },
    { label: "MP3",  className: "bg-emerald-500 text-white hover:cursor-grab" },
    { label: "WAV",  className: "bg-emerald-500 text-white hover:cursor-grab" },
    { label: "OGG",  className: "bg-emerald-500 text-white hover:cursor-grab" },
    { label: "ZIP",  className: "bg-rose-500 text-white hover:cursor-alias" },
    { label: "RAR",  className: "bg-rose-500 text-white hover:cursor-alias" },
    { label: "PDF",  className: "bg-amber-500  text-white hover:cursor-copy" },
    { label: "TXT",  className: "bg-zinc-500   text-white hover:cursor-text" },
  ],
};

/** Génère une thumbnail JPEG (data URL) depuis un fichier vidéo via Canvas. */
const generateVideoThumbnail = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const blobUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = blobUrl;
    video.muted = true;
    video.playsInline = true;

    const capture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(blobUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };

    video.addEventListener(
      "loadedmetadata",
      () => { video.currentTime = Math.min(1, video.duration * 0.1 || 0); },
      { once: true },
    );
    video.addEventListener("seeked", capture, { once: true });
    video.addEventListener(
      "error",
      () => { URL.revokeObjectURL(blobUrl); resolve(""); },
      { once: true },
    );
    video.load();
  });

export const FileUpload = ({ endpoint, value, onChange }: FileUploadProps) => {
  const isServerImage = endpoint === "serverImage";

  // URL affichée en aperçu pendant l'upload (blob: pour images, data: pour vidéos)
  const [previewDisplay, setPreviewDisplay] = useState<string | null>(null);
  // true si previewDisplay est une blob URL à révoquer
  const [previewIsBlob, setPreviewIsBlob] = useState(false);
  // thumbnail conservée après l'upload d'une vidéo (data URL)
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  // type du fichier uploadé pour le rendu post-upload
  const [uploadedFileType, setUploadedFileType] = useState<"image" | "video" | "other" | null>(null);

  const revokePreview = () => {
    if (previewDisplay && previewIsBlob) URL.revokeObjectURL(previewDisplay);
    setPreviewDisplay(null);
    setPreviewIsBlob(false);
  };

  const resetUploadedState = () => {
    setUploadedFileType(null);
    setVideoThumbnail(null);
  };

  // --- Rendus post-upload ---

  if (value && isServerImage) {
    return (
      <div className="relative h-20 w-20">
        <Image fill src={value} alt="Uploaded file" className="rounded-full" />
        <button
          className="bg-rose-500 text-white p-1 rounded-full absolute top-0 right-0 shadow-sm"
          type="button"
          onClick={() => onChange?.("")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (value && uploadedFileType === "image") {
    return (
      <div className="relative w-48 h-32">
        <Image
          fill
          src={value}
          alt="Image envoyée"
          className="rounded-md object-cover"
          unoptimized
        />
        <button
          className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
          type="button"
          onClick={() => { resetUploadedState(); onChange?.(""); }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (value && uploadedFileType === "video") {
    return (
      <div className="relative w-48 h-32">
        {videoThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={videoThumbnail}
            alt="Aperçu vidéo"
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <div className="w-full h-full rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
            <FileIcon className="h-10 w-10 text-zinc-400" />
          </div>
        )}
        {/* Icône play superposée */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-2">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <button
          className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
          type="button"
          onClick={() => { resetUploadedState(); onChange?.(""); }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (value) {
    return (
      <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
        <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-indigo-600 text-sm dark:text-indigo-400 hover:underline"
        >
          Ouvrir le fichier
        </a>
        <button
          className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
          type="button"
          onClick={() => onChange?.("")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // --- Dropzone ---

  const handleBeforeUpload = async (files: File[]) => {
    const firstFile = files[0];
    if (!firstFile) return files;

    if (firstFile.type.startsWith("image/")) {
      const blobUrl = URL.createObjectURL(firstFile);
      setPreviewDisplay(blobUrl);
      setPreviewIsBlob(true);
      setUploadedFileType("image");
    } else if (firstFile.type.startsWith("video/")) {
      setUploadedFileType("video");
      const thumb = await generateVideoThumbnail(firstFile);
      setVideoThumbnail(thumb);
      setPreviewDisplay(thumb || null);
      setPreviewIsBlob(false);
    } else {
      setUploadedFileType("other");
    }

    return files;
  };

  const badges = EXTENSION_BADGES[endpoint];

  return (
    <div className="w-full">
      {previewDisplay && (
        <div className="mb-3 flex justify-center">
          <div className="relative w-48 h-32 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewDisplay}
              alt="Aperçu"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-white/80 dark:bg-zinc-900/80 px-2 py-1 rounded">
                Upload en cours…
              </p>
            </div>
          </div>
        </div>
      )}
      <UploadDropzone
        endpoint={endpoint}
        onBeforeUploadBegin={handleBeforeUpload}
        onClientUploadComplete={(res) => {
          revokePreview();
          if (onChange) {
            const url = res?.[0]?.ufsUrl;
            const name = res?.[0]?.name;
            onChange(url && name ? `${url}?ut_name=${encodeURIComponent(name)}` : url);
          }
        }}
        onUploadError={(error: Error) => {
          revokePreview();
          resetUploadedState();
          console.error("Upload error:", error);
        }}
        content={{
          allowedContent: (
            <div className="flex flex-wrap gap-1.5 justify-center mt-2">
              {badges.map(({ label, className }) => (
                <span
                  key={label}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-sm ${className}`}
                >
                  {label}
                </span>
              ))}
            </div>
          ),
          button: "Choose a file",
        }}
      />
    </div>
  );
};
