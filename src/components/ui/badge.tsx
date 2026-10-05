import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-ink text-canvas",
        secondary: "bg-brand-soft text-brand",
        destructive: "bg-red-100 text-red-800",
        outline: "bg-surface text-ink ring-1 ring-inset ring-line",
        success: "bg-green-100 text-green-800",
        warning: "bg-amber-100 text-amber-900",
        info: "bg-sky-100 text-sky-800",
        accent: "bg-signal text-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
