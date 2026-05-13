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
        <div className={`flex h-10 w-full items-center justify-between rounded-xl border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}>
            {children}
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
