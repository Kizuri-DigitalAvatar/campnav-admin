"use client"

import { FormEvent, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../../campnav-client/convex/_generated/api"
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
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <Package className="w-8 h-8 text-blue-400" />
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">
                        Product Inventory
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="glass-input pl-10 w-64 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center glass-card px-3 py-1.5 space-x-2">
                        <Filter className="w-4 h-4 text-white/20" />
                        <select
                            className="bg-transparent text-xs text-white/60 outline-none cursor-pointer"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="all" className="bg-slate-900">All Categories</option>
                            <option value="Food" className="bg-slate-900">Food</option>
                            <option value="Drink" className="bg-slate-900">Drink</option>
                            <option value="Snacks" className="bg-slate-900">Snacks</option>
                            <option value="Gear" className="bg-slate-900">Gear</option>
                            <option value="Apparel" className="bg-slate-900">Apparel</option>
                            <option value="Items" className="bg-slate-900">Items</option>
                            <option value="Service" className="bg-slate-900">Services</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="glass-button bg-blue-600/50 hover:bg-blue-600/70 text-white flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{isAdding ? "Cancel" : "New Product"}</span>
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="glass-card p-6 border-blue-500/30 animate-in slide-in-from-top-4 duration-300">
                    <h3 className="text-xl font-semibold mb-6 text-blue-100 italic">
                        {editingId ? "Edit Product Details" : "Add New Item to Inventory"}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <label className="text-sm text-blue-200/60 ml-1 block">Product Image</label>
                                <div className="aspect-square glass-card flex items-center justify-center overflow-hidden group relative border-2 border-dashed border-white/10 hover:border-blue-500/50 transition-all rounded-2xl">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-8 h-8 text-white" />
                                            </button>
                                        </>
                                    ) : (
                                        <label className="cursor-pointer flex flex-col items-center p-8 text-center w-full h-full justify-center">
                                            <Upload className="w-8 h-8 text-white/10 mb-3" />
                                            <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Upload Photo</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm text-blue-200/60 ml-1">Product Name</label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                            <input
                                                className="glass-input w-full pl-10"
                                                placeholder="Premium Sleeping Bag"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-blue-200/60 ml-1">Category</label>
                                        <select
                                            className="glass-input w-full bg-indigo-950/40"
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
                                        <label className="text-sm text-blue-200/60 ml-1">Service Association</label>
                                        <select
                                            className="glass-input w-full bg-indigo-950/40 italic"
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
                                        <label className="text-sm text-blue-200/60 ml-1">Price (Le)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                            <input
                                                className="glass-input w-full pl-10"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-blue-200/60 ml-1">Initial Stock</label>
                                        <div className="relative">
                                            <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                            <input
                                                className="glass-input w-full pl-10"
                                                type="number"
                                                placeholder="100"
                                                value={stock}
                                                onChange={(e) => setStock(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 h-full pt-6 md:pt-8 px-2">
                                        <input
                                            type="checkbox"
                                            id="isAvailable"
                                            className="w-4 h-4 rounded bg-white/10 border-white/20 accent-blue-500"
                                            checked={isAvailable}
                                            onChange={(e) => setIsAvailable(e.target.checked)}
                                        />
                                        <label htmlFor="isAvailable" className="text-sm text-blue-200/80 cursor-pointer">
                                            Active & Shoppable
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-blue-200/60 ml-1">Description</label>
                                    <textarea
                                        className="glass-input w-full min-h-[100px] resize-none"
                                        placeholder="Provide details about features, sizing, or ingredients..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-6 border-t border-white/5">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="glass-button bg-white/5 hover:bg-white/10 px-8"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isUploading}
                                className="glass-button bg-emerald-600/50 hover:bg-emerald-600/70 text-white px-12 disabled:opacity-50"
                            >
                                {isUploading ? "Uploading..." : (editingId ? "Update Product" : "Publish Product")}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredResults.map((product: any) => (
                    <div key={product._id} className={`glass-card group relative overflow-hidden flex flex-col transition-all hover:translate-y-[-4px] ${!product.isAvailable ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                        <div className="h-48 overflow-hidden relative">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                    <Package className="w-12 h-12 text-white/5" />
                                </div>
                            )}
                            <div className="absolute top-3 right-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md shadow-lg ${product.stock > 10 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                                    product.stock > 0 ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' :
                                        'bg-red-500/20 text-red-400 border-red-500/20'
                                    }`}>
                                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                                </span>
                            </div>
                            <div className="absolute bottom-3 left-3">
                                <span className="bg-blue-600/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/10 uppercase tracking-widest">
                                    {product.category}
                                </span>
                            </div>
                        </div>

                        <div className="p-5 flex-grow flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-lg font-bold text-blue-50 group-hover:text-blue-400 transition-colors">{product.name}</h4>
                                <div className="text-emerald-400 font-mono font-bold">Le {product.price.toFixed(2)}</div>
                            </div>
                            <p className="text-xs text-blue-200/60 line-clamp-3 mb-6 flex-grow leading-relaxed italic">
                                {product.description || "No description provided."}
                            </p>

                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <div className="flex items-center space-x-1.5">
                                    <div className={`w-2 h-2 rounded-full ${product.isAvailable ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">
                                        {product.isAvailable ? 'Visible' : 'Hidden'}
                                    </span>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { if (confirm("Delete this product?")) deleteProduct({ id: product._id }) }}
                                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
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
                <div className="p-20 text-center glass-card border-dashed">
                    <Box className="w-16 h-16 text-white/5 mx-auto mb-4" />
                    <p className="text-white/20 italic">No products matched your search or category filters.</p>
                </div>
            )}
        </div>
    )
}
