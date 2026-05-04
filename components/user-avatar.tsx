import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string;
  className?: string;
  fallback?: string;
}

export const UserAvatar = ({ src, className, fallback }: UserAvatarProps) => {
  const fallbackLabel = (fallback ?? "?").trim().slice(0, 2).toUpperCase();

  return (
    <Avatar className={cn("md:w-10 md:h-10 w-7 h-7", className)}>
      <AvatarImage src={src} />
      <AvatarFallback>{fallbackLabel || "?"}</AvatarFallback>
    </Avatar>
  );
};
