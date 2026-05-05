'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
}

const variants = {
  primary: 'bg-coral text-white hover:bg-coral-light shadow-glow-coral',
  secondary: 'bg-sky text-white hover:bg-sky-light',
  ghost: 'bg-white/60 text-charcoal hover:bg-white/80',
  danger: 'bg-red-400 text-white hover:bg-red-500',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-base rounded-[var(--radius-btn)]',
  lg: 'px-7 py-3.5 text-lg rounded-[var(--radius-btn)]',
  xl: 'px-10 py-5 text-xl rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, children, className = '', ...props }, ref) => {
    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          tap-target inline-flex items-center justify-center gap-2
          font-bold transition-colors cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]} ${sizes[size]} ${className}
        `}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
