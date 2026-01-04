import * as React from "react"

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ")

function Button({
    className,
    variant = "default",
    ...props
}: React.ComponentProps<"button"> & { variant?: string }) {
    const variants: any = {
        default: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20",
        destructive: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
        outline: "border border-white/10 bg-transparent hover:bg-white/5 text-white/80",
        ghost: "hover:bg-white/5 text-white/60 hover:text-white",
    }

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none",
                variants[variant] || variants.default,
                className
            )}
            {...props}
        />
    )
}

export { Button }
