"use client";

import { CreateServerModal } from "@/components/modals/create-server-modal";
import { useSyncExternalStore } from "react";

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
    </>
  );
};
