import * as React from "react"

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ")

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            className={cn(
                "flex min-h-[80px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all",
                className
            )}
            {...props}
        />
    )
}

export { Textarea }
