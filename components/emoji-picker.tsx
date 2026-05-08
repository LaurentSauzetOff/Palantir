"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import data from "@emoji-mart/data";
import { useTheme } from "next-themes";
import { Picker } from "emoji-mart";

interface EmojiPickerProps {
  // Props can be added here if needed in the future
  onChange: (value: string) => void;
}

export const EmojiPicker = ({ onChange }: EmojiPickerProps) => {
  const { resolvedTheme } = useTheme();
  const pickerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, []);

  useEffect(() => {
    if (!open) return;

    const container = pickerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const picker = new Picker({
      data,
      theme: resolvedTheme === "dark" ? "dark" : "light",
      onEmojiSelect: (emoji: { native?: string }) => {
        if (emoji?.native) {
          onChange(emoji.native);
          setOpen(false);
        }
      },
    });

    container.appendChild(picker as unknown as Node);

    return () => {
      container.replaceChildren();
    };
  }, [onChange, resolvedTheme, open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Ouvrir le sélecteur d'emoji"
        onClick={() => setOpen((value) => !value)}
        className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 dark:text-zinc-400 transition"
      >
        <Smile size={24} />
      </button>

      {open && (
        <div className="absolute bottom-10 right-0 z-50">
          <div ref={pickerRef} />
        </div>
      )}
    </div>
  );
};
