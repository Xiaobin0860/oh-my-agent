'use client';

import { motion } from 'framer-motion';
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ hoverable = false, children, className = '', ...props }: CardProps) {
  const Comp = hoverable ? motion.div : 'div';
  const motionProps = hoverable
    ? { whileHover: { scale: 1.03, y: -4 }, transition: { type: 'spring', stiffness: 300 } }
    : {};

  return (
    <Comp
      className={`bg-white rounded-[var(--radius-card)] shadow-soft p-5 ${className}`}
      {...motionProps}
      {...(props as any)}
    >
      {children}
    </Comp>
  );
}
