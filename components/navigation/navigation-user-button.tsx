"use client";

import { UserButton } from "@clerk/nextjs";

export const NavigationUserButton = () => {
  return (
    <UserButton appearance={{ elements: { avatarBox: "h-[48px] w-[48px]" } }} />
  );
};
