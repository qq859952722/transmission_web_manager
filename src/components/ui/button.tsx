import { type JSX, splitProps } from 'solid-js';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 ease-in-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md',
        success: 'bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow-md',
        warning: 'bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 hover:shadow-md',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, ['class', 'variant', 'size']);
  
  return (
    <button
      class={cn(buttonVariants({ variant: local.variant, size: local.size, className: local.class }))}
      {...others}
    />
  );
}
