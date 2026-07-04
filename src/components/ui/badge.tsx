import * as React from "react"

export function Badge({ className, variant = "default", ...props }: React.ComponentProps<"span"> & { variant?: "default" | "secondary" | "destructive" | "outline" }) {
    const base = "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 transition-colors"
    const variants = {
        default: "border-primary/20 bg-accent text-accent-foreground",
        secondary: "border-border bg-secondary text-secondary-foreground",
        destructive: "border-destructive/20 bg-destructive/10 text-destructive",
        outline: "border-border bg-card text-foreground shadow-sm"
    }
    return (
        <span className={`${base} ${(variants as any)[variant]} ${className || ""}`} {...props} />
    )
}
