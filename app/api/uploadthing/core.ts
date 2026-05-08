import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const handleAuth = async () => {
  const { userId } = await auth();
  if (!userId) throw new UploadThingError("Unauthorized");
  return { userId };
};
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  serverImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => handleAuth())
    .onUploadComplete(() => {}),
  messageFile: f({
    // Images — limites par format
    "image/png": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/jpeg": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/webp": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/gif": { maxFileSize: "32MB", maxFileCount: 1 },
    // Vidéos
    "video/mp4": { maxFileSize: "16MB", maxFileCount: 1 },
    "video/webm": { maxFileSize: "16MB", maxFileCount: 1 },
    // Audios (MP3/WAV/OGG pris en charge, limite <= 10MB)
    audio: { maxFileSize: "8MB", maxFileCount: 1 },
    // Archives (limite optimisée pour partage rapide en chat)
    "application/zip": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.rar": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/x-rar-compressed": { maxFileSize: "16MB", maxFileCount: 1 },
    // Documents
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    text: { maxFileSize: "1MB", maxFileCount: 1 },
  })
    .middleware(async () => handleAuth())
    .onUploadComplete(() => {}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
