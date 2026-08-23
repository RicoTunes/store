import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';

const styles: Record<Variant, string> = {
  primary: 'bg-primary text-[color:var(--color-on-primary,#fff)] shadow-sm hover:opacity-90 active:scale-[0.98]',
  secondary: 'bg-secondary text-[color:var(--color-on-secondary,#0f172a)] shadow-sm hover:opacity-90 active:scale-[0.98]',
  outline: 'border border-primary/50 text-primary bg-transparent hover:bg-primary/10',
  ghost: 'text-primary hover:bg-primary/10',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-semibold tracking-wide transition ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
