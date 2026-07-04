import * as React from "react"

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ")

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            className={cn(
                "flex min-h-[80px] w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground shadow-[inset_0_1px_2px_rgb(16_24_40_/_0.04)] placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-4 focus:ring-ring/15 disabled:opacity-50 transition-all duration-200",
                className
            )}
            {...props}
        />
    )
}

export { Textarea }
