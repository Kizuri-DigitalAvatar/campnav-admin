import * as React from "react"

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ")

function Button({
    className,
    variant = "default",
    ...props
}: React.ComponentProps<"button"> & { variant?: string }) {
    const variants: any = {
        default:
            "bg-primary text-primary-foreground shadow-primary-glow hover:brightness-110 hover:-translate-y-px active:translate-y-0 active:brightness-95",
        destructive:
            "bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive hover:text-destructive-foreground hover:shadow-card",
        outline:
            "tile-3d text-foreground hover:-translate-y-px active:translate-y-0",
        secondary:
            "bg-secondary text-secondary-foreground border hover:bg-muted",
        ghost:
            "text-muted-foreground hover:bg-muted hover:text-foreground",
    }

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                variants[variant] || variants.default,
                className
            )}
            {...props}
        />
    )
}

export { Button }
