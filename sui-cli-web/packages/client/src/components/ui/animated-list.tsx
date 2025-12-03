import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

export function AnimatedList({
  children,
  className,
  delay = 0,
  staggerDelay = 50
}: AnimatedListProps) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      children.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => [...prev, index]);
        }, index * staggerDelay);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [children.length, delay, staggerDelay]);

  return (
    <div ref={listRef} className={cn('space-y-2', className)}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(
            'transition-all duration-300 ease-out',
            visibleItems.includes(index)
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
