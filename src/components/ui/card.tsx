import * as React from "react"

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ")

function Card({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "glass-card overflow-hidden text-card-foreground",
                className
            )}
            {...props}
        />
    )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("p-6 flex flex-col gap-1.5", className)}
            {...props}
        />
    )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("text-lg font-bold tracking-tight text-foreground", className)}
            {...props}
        />
    )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("px-6 pb-6", className)}
            {...props}
        />
    )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("p-6 pt-0 flex items-center", className)}
            {...props}
        />
    )
}

export {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent,
}
