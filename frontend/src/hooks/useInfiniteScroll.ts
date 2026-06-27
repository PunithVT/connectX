import { useEffect, useRef } from "react";

export function useInfiniteScroll(onReachEnd: () => void, enabled = true) {
  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!enabled || !sentinel.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) onReachEnd();
    });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [onReachEnd, enabled]);
  return sentinel;
}
