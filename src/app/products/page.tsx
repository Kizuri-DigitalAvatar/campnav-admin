"use client"

import { FormEvent, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Package, Plus, Search, Filter, Trash2, Upload, X, Tag, DollarSign, Box } from "lucide-react"

export default function ProductsPage() {
    const [filterCategory, setFilterCategory] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [isAdding, setIsAdding] = useState(false)

    const products = useQuery(api.products.list, { category: filterCategory }) ?? []
    const createProduct = useMutation(api.products.create)
    const updateProduct = useMutation(api.products.update)
    const deleteProduct = useMutation(api.products.remove)
    const generateUploadUrl = useMutation(api.images.generateUploadUrl)

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [price, setPrice] = useState("")
    const [category, setCategory] = useState("Gear")
    const [service, setService] = useState("none")
    const [stock, setStock] = useState("0")
    const [isAvailable, setIsAvailable] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    const filteredResults = products.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!name.trim() || !price || !stock) return

        setIsUploading(true)
        let finalImage = undefined

        try {
            if (selectedFile) {
                const postUrl = await generateUploadUrl()
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedFile.type },
                    body: selectedFile,
                })
                const { storageId } = await result.json()
                finalImage = storageId
            }

            if (editingId) {
                await updateProduct({
                    id: editingId as any,
                    name: name.trim(),
                    description: description.trim(),
                    price: parseFloat(price),
                    category,
                    service: service !== "none" ? service : undefined,
                    stock: parseInt(stock),
                    isAvailable,
                    image: finalImage || undefined
                })
            } else {
                await createProduct({
                    name: name.trim(),
                    description: description.trim(),
                    price: parseFloat(price),
                    category,
                    service: service !== "none" ? service : undefined,
                    stock: parseInt(stock),
                    isAvailable,
                    image: finalImage
                })
            }
            resetForm()
        } catch (err) {
            console.error("Failed to save product:", err)
            alert("Error saving product. Check console.")
        } finally {
            setIsUploading(false)
        }
    }

    function handleEdit(product: any) {
        setName(product.name)
        setDescription(product.description)
        setPrice(product.price.toString())
        setCategory(product.category)
        setService(product.service || "none")
        setStock(product.stock.toString())
        setIsAvailable(product.isAvailable)
        setImagePreview(product.imageUrl || null)
        setEditingId(product._id)
        setIsAdding(true)
    }

    function resetForm() {
        setName("")
        setDescription("")
        setPrice("")
        setCategory("Gear")
        setService("none")
        setStock("0")
        setIsAvailable(true)
        setSelectedFile(null)
        setImagePreview(null)
        setEditingId(null)
        setIsAdding(false)
    }

    return (
        <div className="space-y-8 md:space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground">
                        <Package className="w-6 h-6" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        Product Inventory
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full md:w-64 pl-10 h-10 rounded-xl border bg-card focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-card border rounded-xl px-3 h-10">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select
                            className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="all">ALL CATEGORIES</option>
                            {['Food', 'Drink', 'Snacks', 'Gear', 'Apparel', 'Items', 'Service'].map(c => (
                                <option key={c} value={c}>{c.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-primary text-primary-foreground h-10 px-4 rounded-xl flex items-center gap-2 font-bold text-xs hover:opacity-90 transition-opacity"
                    >
                        {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{isAdding ? "CANCEL" : "NEW PRODUCT"}</span>
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <h3 className="text-xl font-bold mb-8">
                        {editingId ? "Edit Product Details" : "Add New Item"}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block">Product Image</label>
                                <div className="aspect-square bg-muted rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden group relative hover:border-primary transition-all">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                                                className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-8 h-8" />
                                            </button>
                                        </>
                                    ) : (
                                        <label className="cursor-pointer flex flex-col items-center p-8 text-center w-full h-full justify-center">
                                            <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                                            <span className="text-[10px] text-muted-foreground font-black uppercase">Upload Photo</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Product Title</label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                className="w-full h-11 rounded-xl border bg-muted/50 pl-10 pr-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                placeholder="Premium Sleeping Bag"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</label>
                                        <select
                                            className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                        >
                                            <option value="Food">Food</option>
                                            <option value="Drink">Drink</option>
                                            <option value="Snacks">Snacks</option>
                                            <option value="Gear">Gear</option>
                                            <option value="Apparel">Apparel</option>
                                            <option value="Items">Items</option>
                                            <option value="Service">Services</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Service Association</label>
                                        <select
                                            className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none italic"
                                            value={service}
                                            onChange={(e) => setService(e.target.value)}
                                        >
                                            <option value="none">None (Standard Product)</option>
                                            <option value="housekeeping">Housekeeping</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="laundry">Laundry</option>
                                            <option value="room-service">Room Service</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Price (Le)</label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                className="w-full h-11 rounded-xl border bg-muted/50 pl-10 pr-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold font-mono"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Stock Level</label>
                                        <div className="relative">
                                            <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                className="w-full h-11 rounded-xl border bg-muted/50 pl-10 pr-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-mono"
                                                type="number"
                                                placeholder="100"
                                                value={stock}
                                                onChange={(e) => setStock(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 h-11 pt-5 px-2">
                                        <input
                                            type="checkbox"
                                            id="isAvailable"
                                            className="w-4 h-4 rounded border-border bg-muted accent-primary"
                                            checked={isAvailable}
                                            onChange={(e) => setIsAvailable(e.target.checked)}
                                        />
                                        <label htmlFor="isAvailable" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">
                                            ACTIVE & VISIBLE
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
                                    <textarea
                                        className="w-full min-h-[120px] p-4 rounded-xl border bg-muted/50 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                                        placeholder="Provide details about features..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t font-bold">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-muted text-foreground px-8 h-12 rounded-xl hover:bg-muted/80 transition-all"
                            >
                                CANCEL
                            </button>
                            <button
                                type="submit"
                                disabled={isUploading}
                                className="bg-primary text-primary-foreground px-12 h-12 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isUploading ? "PROCESSING..." : (editingId ? "SAVE CHANGES" : "PUBLISH ITEM")}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredResults.map((product: any) => (
                    <div key={product._id} className={`bg-card border rounded-3xl group relative overflow-hidden flex flex-col transition-all hover:shadow-xl hover:-translate-y-1 ${!product.isAvailable ? 'opacity-40 grayscale' : ''}`}>
                        <div className="h-56 overflow-hidden relative">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                    <Package className="w-12 h-12 opacity-10" />
                                </div>
                            )}
                            <div className="absolute top-4 left-4">
                                <span className="bg-background/90 backdrop-blur-sm text-foreground text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest shadow-sm">
                                    {product.category}
                                </span>
                            </div>
                            <div className="absolute top-4 right-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border backdrop-blur-sm shadow-sm ${product.stock > 10 ? 'bg-primary/90 text-primary-foreground border-primary' :
                                        product.stock > 0 ? 'bg-background/90 text-foreground border-border' :
                                            'bg-destructive text-destructive-foreground border-destructive'
                                    }`}>
                                    {product.stock > 0 ? `${product.stock} STOCK` : 'SOLD OUT'}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 flex-grow flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="text-xl font-bold tracking-tight">{product.name}</h4>
                                <div className="text-lg font-black font-mono">Le {product.price.toFixed(2)}</div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-6 flex-grow leading-relaxed">
                                {product.description || "No description provided."}
                            </p>

                            <div className="flex justify-between items-center pt-5 border-t">
                                <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${product.isAvailable ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        {product.isAvailable ? 'SHOWN' : 'HIDDEN'}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="p-2.5 rounded-xl border bg-card text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-[10px] uppercase transition-all"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { if (confirm("Delete this product?")) deleteProduct({ id: product._id }) }}
                                        className="p-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredResults.length === 0 && (
                <div className="p-24 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                    <Box className="w-16 h-16 opacity-5 mx-auto mb-4" />
                    <p className="text-muted-foreground/40 font-bold text-sm tracking-widest uppercase">Inventory Empty</p>
                </div>
            )}
        </div>
    )
}
