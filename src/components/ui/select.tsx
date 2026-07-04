import * as React from "react"

const SelectContext = React.createContext<any>({})

export function Select({ value, onValueChange, children }: any) {
    return (
        <SelectContext.Provider value={{ value, onValueChange }}>
            <div className="relative isolate w-full">
                {children}
            </div>
        </SelectContext.Provider>
    )
}

export function SelectTrigger({ children, className }: any) {
    const { value } = React.useContext(SelectContext)
    return (
        <div className={`flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-[inset_0_1px_2px_rgb(16_24_40_/_0.04)] transition-all duration-200 hover:border-ring/40 focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}>
            {children}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2 shrink-0 text-muted-foreground" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
            </svg>
        </div>
    )
}

export function SelectValue({ placeholder }: any) {
    const { value } = React.useContext(SelectContext)
    return <span>{value || placeholder}</span>
}

export function SelectContent({ children }: any) {
    const { value, onValueChange } = React.useContext(SelectContext)
    return (
        <select
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
        >
            {/* Find SelectItems in children */}
            {React.Children.map(children, child => {
                if (React.isValidElement(child) && child.type === SelectItem) {
                    return React.cloneElement(child as any)
                }
                return child
            })}
        </select>
    )
}

export function SelectItem({ value, children }: any) {
    return <option value={value}>{children}</option>
}
