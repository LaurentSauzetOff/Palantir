"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";
import { EmojiPicker } from "@/components/emoji-picker";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useSocket } from "@/components/providers/socket-provider";

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, string | number | boolean | undefined>;
  name: string;
  type: "conversation" | "channel";
  memberName?: string;
}

const formSchema = z.object({
  content: z.string().min(1),
});

export const ChatInput = ({ apiUrl, query, name, type, memberName }: ChatInputProps) => {
  const { onOpen } = useModal();
  const router = useRouter();
  const { socket } = useSocket();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      content: "",
    },
    resolver: zodResolver(formSchema),
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Arrêter l'indicateur de frappe à l'envoi
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socket && query.channelId) {
        socket.emit("stop-typing", { channelId: query.channelId, memberId: memberName });
      }

      const url = qs.stringifyUrl({
        url: apiUrl,
        query,
      });

      await axios.post(url, values);
      form.reset();
      router.refresh();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-4 border-t border-gray-300 dark:border-gray-700">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex items-center space-x-2"
        >
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => onOpen("messageFiles", { apiUrl, query })}
                      className="absolute inset-y-0 left-4 my-auto h-6 w-6 bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center z-10"
                    >
                      <Plus className="text-white dark:text-[#313338]" />
                    </button>

                    <Input
                      {...field}
                      disabled={isLoading}
                      placeholder={`Message ${type === "conversation" ? name : "#" + name}`}
                      className="h-12 border-none border-0 px-14 py-0 bg-zinc-200/90 dark:bg-zinc-700/75 text-zinc-600 dark:text-zinc-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                      onChange={(e) => {
                        field.onChange(e);
                        if (socket && query.channelId && memberName) {
                          socket.emit("typing", {
                            channelId: query.channelId,
                            name: memberName,
                            memberId: memberName,
                          });
                          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                          typingTimeoutRef.current = setTimeout(() => {
                            socket.emit("stop-typing", { channelId: query.channelId, memberId: memberName });
                          }, 2500);
                        }
                      }}
                    />

                    <div className="absolute inset-y-0 right-4 my-auto flex items-center z-10">
                      <EmojiPicker
                        onChange={(emoji) =>
                          field.onChange(`${field.value}${emoji}`)
                        }
                      />
                    </div>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
};
