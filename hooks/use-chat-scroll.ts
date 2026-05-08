"use client";

import { useEffect, useRef } from "react";

interface UseChatScrollProps {
  chatRef: React.RefObject<HTMLDivElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  count: number; // nombre total de messages dans le cache
  loadMore: () => void;
  shouldLoadMore: boolean;
}

export const useChatScroll = ({
  chatRef,
  bottomRef,
  count,
  loadMore,
  shouldLoadMore,
}: UseChatScrollProps) => {
  const hasInitialized = useRef(false);

  // Chargement automatique des messages plus anciens quand on scroll vers le haut
  useEffect(() => {
    const container = chatRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && shouldLoadMore) {
        loadMore();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [chatRef, loadMore, shouldLoadMore]);

  // Scroll initial vers le bas au premier chargement
  useEffect(() => {
    const container = chatRef.current;
    const bottom = bottomRef.current;
    if (!container || !bottom) return;

    if (!hasInitialized.current && count > 0) {
      hasInitialized.current = true;
      bottom.scrollIntoView();
    }
  }, [count, chatRef, bottomRef]);

  // Scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    const container = chatRef.current;
    const bottom = bottomRef.current;
    if (!container || !bottom) return;

    // Scroll seulement si l'utilisateur est déjà proche du bas (< 100px)
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom <= 100) {
      bottom.scrollIntoView({ behavior: "smooth" });
    }
  }, [count, chatRef, bottomRef]);
};
