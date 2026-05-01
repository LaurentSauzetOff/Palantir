"use client";

import { CreateServerModal } from "@/components/modals/create-server-modal";
import { useSyncExternalStore } from "react";
import { InviteModal } from "@/components/modals/invite-modal";

const emptySubscribe = () => () => {};

export const ModalProvider = () => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <CreateServerModal />
      <InviteModal />
    </>
  );
};
