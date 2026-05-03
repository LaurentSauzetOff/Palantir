import { useSyncExternalStore } from "react";

export const useOrigin = () => {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
};
