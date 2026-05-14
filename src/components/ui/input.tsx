import * as React from "react"

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ")

function Input({ className, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            className={cn(
                "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 transition-all",
                className
            )}
            {...props}
        />
    )
}

export { Input }
