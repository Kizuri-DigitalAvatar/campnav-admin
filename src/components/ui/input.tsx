import * as React from "react"

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ")

function Input({ className, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            className={cn(
                "flex h-10 w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-[inset_0_1px_2px_rgb(16_24_40_/_0.04)] placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-4 focus:ring-ring/15 disabled:opacity-50 transition-all duration-200",
                className
            )}
            {...props}
        />
    )
}

export { Input }
