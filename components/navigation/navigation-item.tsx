"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { ActionTooltip } from "@/components/action-tooltip";

interface NavigationItemProps {
  id: string;
  name: string;
  imageUrl: string;
}

export const NavigationItem = ({ id, name, imageUrl }: NavigationItemProps) => {
  const params = useParams();

  return (
    <ActionTooltip side="right" align="center" label={name}>
      <Link
        href={`/servers/${id}`}
        aria-label={name}
        className={cn("group relative flex items-center")}
      >
        <div
          className={cn(
            "absolute left-0 bg-primary rounded-r-full transition-all w-1",
            params?.serverId !== id ? "group-hover:h-5" : "",
            params?.serverId === id ? "h-9" : "h-2",
          )}
        />
        <div
          className={cn(
            "relative group flex mx-3 h-12 w-12 rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden",
            params?.serverId === id && "bg-primary/10 text-primary rounded-[16px]",
          )}
        >
          <Image src={imageUrl} alt={name} width={48} height={48} />
        </div>
      </Link>
    </ActionTooltip>
  );
};
