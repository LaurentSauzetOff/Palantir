"use client";

import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Member, Profile } from "@/lib/generated/prisma/client";
import { UserAvatar } from "../user-avatar";
import { ActionTooltip } from "../action-tooltip";
import Image from "next/image";
import { FileIcon, DownloadIcon, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatItemProps {
  id: string;
  content: string;
  member: Member & {
    profile: Profile;
  };
  timestamp: string;
  fileUrl?: string | null;
  deleted: boolean;
  currentMember: Member;
  isUpdated: boolean;
  socketUrl: string;
  socketQuery: Record<string, string>;
}

const roleIconMap = {
  GUEST: "👤",
  MODERATOR: "🛡️",
  ADMIN: "👑",
};

const formSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const ChatItem = ({
  id,
  content,
  member,
  timestamp,
  fileUrl,
  deleted,
  currentMember,
  isUpdated,
  socketUrl,
  socketQuery,
}: ChatItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === "Escape" || event.keyCode === 27) {
        setIsEditing(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery,
      });
      await axios.patch(url, values);
      setIsEditing(false);
    } catch (error) {
      console.log(error);
    }
  };

  const onDelete = async () => {
    try {
      setIsDeleting(true);
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery,
      });
      await axios.delete(url);
    } catch (error) {
      console.log(error);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    form.reset({ content });
  }, [content, form]);

  const fileType = (() => {
    if (!fileUrl) return undefined;
    try {
      const utName = new URL(fileUrl).searchParams.get("ut_name");
      if (utName) return utName.split(".").pop()?.toLowerCase();
    } catch {}
    return fileUrl
      .split("/")
      .pop()
      ?.split("?")[0]
      ?.split(".")
      .pop()
      ?.toLowerCase();
  })();
  const fileName = (() => {
    if (!fileUrl) return "download-file";
    try {
      const utName = new URL(fileUrl).searchParams.get("ut_name");
      if (utName) return utName;
    } catch {}
    return fileUrl.split("/").pop()?.split("?")[0] || "download-file";
  })();

  const isAdmin = currentMember.role === "ADMIN";
  const isModerator = currentMember.role === "MODERATOR";
  const isOwner = currentMember.id === member.id;
  const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner);
  const canEditMessage = !deleted && isOwner && !fileUrl;
  const isPDF = fileType === "pdf" && fileUrl;
  const isImage =
    ["jpg", "jpeg", "png", "gif", "webp"].includes(fileType || "") && fileUrl;
  const isVideo =
    ["mp4", "webm", "ogv", "m4v"].includes(fileType || "") && fileUrl;
  const isAudio =
    ["mp3", "wav", "ogg", "oga", "m4a", "aac", "flac"].includes(
      fileType || "",
    ) && fileUrl;
  const isFile = fileUrl && !isPDF && !isImage && !isVideo && !isAudio;

  return (
    <div
      className="relative flex items-center hover:bg-black/5 p-4 transition w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex gap-x-2 items-start w-full">
        <div className="cursor-pointer hover:drop-shadow-md transition">
          <UserAvatar src={member.profile.imageUrl} />
        </div>
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-x-2">
            <div className="flex items-center">
              <p className="font-semibold text-sm hover:underline cursor-pointer">
                {member.profile.name}
              </p>
              <ActionTooltip label={member.role}>
                {roleIconMap[member.role]}
              </ActionTooltip>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {timestamp}
            </span>
          </div>
          {isImage && (
            <div className="relative mt-2 h-48 w-48">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square rounded-md overflow-hidden border flex items-center bg-secondary h-48 w-48 block"
              >
                <Image
                  src={fileUrl!}
                  alt={content}
                  fill
                  className="object-cover"
                />
              </a>
              <a
                href={fileUrl}
                download={fileName}
                className="absolute bottom-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition"
                title="Télécharger"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
          {isPDF && (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
              <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
              >
                PDF File
              </a>
            </div>
          )}
          {isVideo && (
            <div className="relative mt-2 max-w-140 w-full rounded-md overflow-hidden border bg-secondary">
              <video
                src={fileUrl!}
                controls
                preload="metadata"
                playsInline
                controlsList="nodownload noplaybackrate"
                className="w-full h-auto max-h-[60vh] bg-black"
              />
            </div>
          )}
          {isAudio && (
            <div className="relative mt-2 max-w-140 w-full rounded-md border bg-background/10 p-3">
              <audio
                src={fileUrl!}
                controls
                preload="none"
                controlsList="nodownload noplaybackrate"
                className="w-full"
              />
            </div>
          )}
          {isFile && (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
              <FileIcon className="h-10 w-10 fill-emerald-200 stroke-emerald-500" />
              <div className="ml-2 flex flex-col">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-60">
                  {fileName}
                </p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={fileName}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Telecharger le fichier
                </a>
              </div>
            </div>
          )}
          {!fileUrl && !isEditing && (
            <p
              className={cn(
                "text-sm text-zinc-600 dark:text-zinc-300",
                deleted &&
                  "italic text-zinc-500 dark:text-zinc-400 text-xs mt-1",
              )}
            >
              {content}
              {isUpdated && !deleted && (
                <span className="ml-2 text-xs text-zinc-400 italic dark:text-zinc-500">
                  (modifié)
                </span>
              )}
            </p>
          )}
          {!fileUrl && isEditing && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex items-center w-full gap-x-2 pt-2"
              >
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            disabled={isLoading}
                            autoFocus
                            {...field}
                            placeholder="Edit your message"
                            className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  disabled={isLoading}
                  type="submit"
                  size="sm"
                  variant="primary"
                  className="absolute bottom-2 right-2"
                >
                  Save
                </Button>
              </form>
              <span className="text-xs mt-1 text-zinc-400 dark:text-zinc-500">
                Press escape to cancel
              </span>
            </Form>
          )}
        </div>
      </div>
      {canDeleteMessage && isHovered && (
        <div className="flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800 border rounded-sm">
          {canEditMessage && (
            <ActionTooltip label="Edit">
              <Edit
                onClick={() => setIsEditing(true)}
                className="cursor-pointer ml-auto w-5 h-5 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
              />
            </ActionTooltip>
          )}
          <ActionTooltip label="Delete">
            <Trash2
              onClick={onDelete}
              className="cursor-pointer ml-auto w-5 h-5 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
            />
          </ActionTooltip>
        </div>
      )}
    </div>
  );
};
