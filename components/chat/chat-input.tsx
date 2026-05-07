"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Smile } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, any>;
  name: string;
  type: "conversation" | "channel";
}

const formSchema = z.object({
  content: z.string().min(1),
});

export const ChatInput = ({ apiUrl, query, name, type }: ChatInputProps) => {
  const { onOpen } = useModal();

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      content: "",
    },
    resolver: zodResolver(formSchema),
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: apiUrl,
        query,
      });

      await axios.post(url, values);
      form.reset();
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
                  <div className="relative p-4 pb-6">
                    <button
                      type="button"
                      onClick={() => onOpen("messageFiles", { apiUrl, query })}
                      className="absolute top-7 left-8 h-6 w-6 bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center"
                    >
                      <Plus className="text-white dark:text-[#313338]" />
                    </button>
                  </div>
                  <Input
                    {...field}
                    disabled={isLoading}
                    placeholder={`Message ${type === "conversation" ? name : "#" + name}`}
                    className="border-none border-0 px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 text-zinc-600 dark:text-zinc-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <div className="absolute top-7 right-8">
                    <Smile />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
      Chat Input
    </div>
  );
};
