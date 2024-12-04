import { useEffect, useState } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
}

export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  {
    threshold = 0,
    root = null,
    rootMargin = '0px',
  }: UseIntersectionObserverProps = {},
) {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();

  useEffect(() => {
    const node = elementRef?.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
      },
      { threshold, root, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, threshold, root, rootMargin]);

  return entry;
}
