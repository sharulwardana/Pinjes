import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base text-ink transition duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted/70 hover:border-ink/25 focus-visible:border-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal/50 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
