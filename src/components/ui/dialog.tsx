import * as React from "react"

const DialogContext = React.createContext<any>({})

export function Dialog({ open, onOpenChange, children }: any) {
    const [isOpen, setIsOpen] = React.useState(false)
    const activeOpen = open !== undefined ? open : isOpen
    const activeChange = (v: boolean) => {
        setIsOpen(v)
        if (onOpenChange) onOpenChange(v)
    }

    return (
        <DialogContext.Provider value={{ open: activeOpen, onOpenChange: activeChange }}>
            {children}
        </DialogContext.Provider>
    )
}

export function DialogTrigger({ asChild, children }: any) {
    const { onOpenChange } = React.useContext(DialogContext)
    if (asChild && React.isValidElement(children)) {
        const child = children as React.ReactElement<any>
        return React.cloneElement(child, {
            onClick: (e: any) => {
                if (child.props.onClick) child.props.onClick(e)
                onOpenChange(true)
            }
        })
    }
    return <div onClick={() => onOpenChange(true)} className="inline-block cursor-pointer">{children}</div>
}

export function DialogContent({ children, className }: any) {
    const { open, onOpenChange } = React.useContext(DialogContext)
    
    // Prevent scroll when open
    React.useEffect(() => {
        if (open) document.body.style.overflow = "hidden"
        else document.body.style.overflow = "unset"
        return () => { document.body.style.overflow = "unset" }
    }, [open])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-foreground/25 backdrop-blur-md animate-in fade-in duration-200" onClick={() => onOpenChange(false)} />
            <div className={`relative z-50 glass-panel p-6 rounded-3xl w-full max-w-lg shadow-pop animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ${className || ""}`}>
                {children}
            </div>
        </div>
    )
}

export function DialogHeader({ children, className }: any) {
    return <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className || ""}`}>{children}</div>
}

export function DialogTitle({ children, className }: any) {
    return <h2 className={`text-xl font-bold leading-none tracking-tight ${className || ""}`}>{children}</h2>
}

export function DialogDescription({ children, className }: any) {
    return <p className={`text-sm text-muted-foreground ${className || ""}`}>{children}</p>
}

export function DialogFooter({ children, className }: any) {
    return <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className || ""}`}>{children}</div>
}
