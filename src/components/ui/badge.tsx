import { type JSX, splitProps } from 'solid-js';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-[4px] border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20',
        secondary:
          'border-border/60 bg-secondary/80 text-secondary-foreground hover:bg-secondary',
        destructive:
          'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20',
        success:
          'border-success/30 bg-success/10 text-success hover:bg-success/20',
        warning:
          'border-warning/30 bg-warning/10 text-warning hover:bg-warning/20',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends JSX.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge(props: BadgeProps) {
  const [local, others] = splitProps(props, ['class', 'variant']);
  
  return (
    <div class={cn(badgeVariants({ variant: local.variant }), local.class)} {...others} />
  );
}
