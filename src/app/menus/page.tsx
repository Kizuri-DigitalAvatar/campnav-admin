"use client"

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { 
    Plus, 
    Trash2, 
    FileText, 
    Upload, 
    Loader2, 
    ExternalLink,
    AlertCircle
} from "lucide-react";
import { api } from "@convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function MenusPage() {
    const menus = useQuery(api.menus.list, {});
    const createMenu = useMutation(api.menus.create);
    const removeMenu = useMutation(api.menus.remove);
    const updateMenu = useMutation(api.menus.update);
    const generateUploadUrl = useMutation(api.images.generateUploadUrl);

    const [isUploading, setIsUploading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Room Service");
    const [schedule, setSchedule] = useState<"" | "daily" | "weekly">("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [entryMode, setEntryMode] = useState<"upload" | "text" | "items">("upload");
    const [inlineContent, setInlineContent] = useState("");
    const [items, setItems] = useState<{ name: string; price: string; image: string }[]>([
        { name: "", price: "", image: "" },
    ]);
    const [editingMenu, setEditingMenu] = useState<any>(null);

    const handleUpload = async () => {
        if (!name) return;

        setIsUploading(true);
        try {
            if (entryMode === "upload") {
                let storageId: string | undefined = undefined;
                let fileType: string | undefined = undefined;

                if (selectedFile) {
                    const postUrl = await generateUploadUrl();
                    const result = await fetch(postUrl, {
                        method: "POST",
                        headers: { "Content-Type": selectedFile.type },
                        body: selectedFile,
                    });
                    const res = await result.json();
                    storageId = res.storageId;
                    fileType = selectedFile.type;
                }

                if (editingMenu) {
                    await updateMenu({
                        id: editingMenu._id,
                        name,
                        category,
                        schedule: schedule || undefined,
                        storageId: storageId ?? undefined,
                        type: storageId ? fileType : editingMenu.type,
                        clearStorage: storageId ? true : false,
                        content: storageId ? undefined : undefined,
                    });
                } else {
                    if (!storageId) return;
                    await createMenu({
                        name,
                        storageId,
                        type: fileType!,
                        category,
                        schedule: schedule || undefined,
                    });
                }
            } else if (entryMode === "text") {
                if (editingMenu) {
                    await updateMenu({
                        id: editingMenu._id,
                        name,
                        category,
                        schedule: schedule || undefined,
                        content: inlineContent.trim(),
                        type: "text",
                        clearStorage: true,
                    });
                } else {
                    await createMenu({
                        name,
                        content: inlineContent.trim(),
                        type: "text",
                        category,
                        schedule: schedule || undefined,
                    });
                }
            } else {
                // entryMode === "items"
                const filteredItems = items.filter(i => i.name.trim());
                const asText = filteredItems
                    .map(i => `${i.name.trim()}${i.price ? ` — ${i.price.trim()}` : ""}${i.image ? `\nImage: ${i.image.trim()}` : ""}`)
                    .join("\n\n");

                if (editingMenu) {
                    await updateMenu({
                        id: editingMenu._id,
                        name,
                        category,
                        schedule: schedule || undefined,
                        content: asText,
                        type: "text",
                        clearStorage: true,
                    });
                } else {
                    await createMenu({
                        name,
                        content: asText,
                        type: "text",
                        category,
                        schedule: schedule || undefined,
                    });
                }
            }

            setIsDialogOpen(false);
            setName("");
            setSelectedFile(null);
            setInlineContent("");
            setItems([{ name: "", price: "", image: "" }]);
            setEntryMode("upload");
            setSchedule("");
            setEditingMenu(null);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to save menu. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: any) => {
        if (confirm("Are you sure you want to delete this menu?")) {
            await removeMenu({ id });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
                    <p className="text-muted-foreground">Upload and manage menus for Room Service and other facilities.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" /> {editingMenu ? "Edit Menu" : "Add Menu"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-3xl">
                        <DialogHeader>
                            <DialogTitle>{editingMenu ? "Edit Menu" : "Add New Menu"}</DialogTitle>
                            <DialogDescription>
                                Upload a PDF/image or type the menu directly.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mode</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        type="button"
                                        variant={entryMode === "upload" ? "default" : "outline"}
                                        onClick={() => setEntryMode("upload")}
                                        className="rounded-xl"
                                    >
                                        Upload File
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={entryMode === "text" ? "default" : "outline"}
                                        onClick={() => setEntryMode("text")}
                                        className="rounded-xl"
                                    >
                                        Type Menu
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={entryMode === "items" ? "default" : "outline"}
                                        onClick={() => setEntryMode("items")}
                                        className="rounded-xl"
                                    >
                                        Add Items
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Menu Name</label>
                                <Input 
                                    placeholder="e.g. Dinner Menu 2024" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="rounded-xl bg-card text-foreground border-border"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="rounded-xl bg-card text-foreground border-border">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Room Service">Room Service</SelectItem>
                                        <SelectItem value="Restaurant">Restaurant</SelectItem>
                                        <SelectItem value="Drinks">Drinks</SelectItem>
                                        <SelectItem value="Laundry Price List">Laundry Price List</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Schedule</label>
                                <Select value={schedule} onValueChange={(val: string) => setSchedule(val as "" | "daily" | "weekly")}>
                                    <SelectTrigger className="rounded-xl bg-card text-foreground border-border">
                                        <SelectValue placeholder="Ad-hoc / none" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Ad-hoc / none</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {entryMode === "upload" ? (
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">File (PDF or Image)</label>
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            accept="application/pdf,image/*"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            className="hidden" 
                                            id="menu-file"
                                        />
                                        <label 
                                            htmlFor="menu-file"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors bg-card text-foreground border-border"
                                        >
                                            {selectedFile ? (
                                                <div className="flex flex-col items-center">
                                                    <FileText className="h-8 w-8 text-primary mb-2" />
                                                    <span className="text-xs font-medium">{selectedFile.name}</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                                    <span className="text-xs font-medium">Click to select file</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            ) : entryMode === "text" ? (
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Menu Content</label>
                                    <textarea
                                        className="rounded-xl border border-border bg-card p-3 text-sm text-foreground min-h-[160px] focus-visible:ring-2 focus-visible:ring-primary/30"
                                        placeholder="Type menu items, prices, notes..."
                                        value={inlineContent}
                                        onChange={(e) => setInlineContent(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Menu Items</label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-full px-3 py-1 text-xs"
                                            onClick={() => setItems([...items, { name: "", price: "", image: "" }])}
                                        >
                                            Add Row
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="grid grid-cols-3 gap-2 items-end">
                                                <div className="grid gap-1">
                                                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Name</span>
                                                    <Input
                                                        value={item.name}
                                                        onChange={(e) => {
                                                            const next = [...items];
                                                            next[idx].name = e.target.value;
                                                            setItems(next);
                                                        }}
                                                        placeholder="Burger"
                                                        className="rounded-lg"
                                                    />
                                                </div>
                                                <div className="grid gap-1">
                                                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Price</span>
                                                    <Input
                                                        value={item.price}
                                                        onChange={(e) => {
                                                            const next = [...items];
                                                            next[idx].price = e.target.value;
                                                            setItems(next);
                                                        }}
                                                        placeholder="$12.00"
                                                        className="rounded-lg"
                                                    />
                                                </div>
                                                <div className="grid gap-1">
                                                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Image URL</span>
                                                    <Input
                                                        value={item.image}
                                                        onChange={(e) => {
                                                            const next = [...items];
                                                            next[idx].image = e.target.value;
                                                            setItems(next);
                                                        }}
                                                        placeholder="https://..."
                                                        className="rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button 
                                onClick={handleUpload} 
                                disabled={
                                    isUploading ||
                                    !name ||
                                    (entryMode === "upload" ? (!selectedFile && !editingMenu) :
                                        entryMode === "text" ? !inlineContent.trim() :
                                            items.every(i => !i.name.trim()))
                                }
                                className="w-full rounded-xl"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : "Save Menu"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {!menus ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)}
                </div>
            ) : menus.length === 0 ? (
                <Card className="border-dashed flex flex-col items-center justify-center py-12 bg-muted/20 rounded-3xl">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <AlertCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">No menus found</CardTitle>
                    <CardDescription>Upload your first menu to get started.</CardDescription>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menus.map((menu) => (
                        <Card key={menu._id} className="overflow-hidden border-2 rounded-3xl hover:shadow-xl transition-all duration-300 group">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 overflow-hidden border border-primary/10">
                                        {menu.type?.startsWith("image") && menu.url ? (
                                            <img
                                                src={menu.url}
                                                alt={menu.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <FileText className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            className="rounded-full px-3 h-9 text-xs font-semibold"
                                            onClick={() => {
                                                setEditingMenu(menu);
                                                setIsDialogOpen(true);
                                                setName(menu.name);
                                                setCategory(menu.category || "Room Service");
                                                setSchedule((menu.schedule as any) || "");
                                                if (menu.type === "text") {
                                                    setEntryMode("text");
                                                    setInlineContent(menu.content || "");
                                                    setSelectedFile(null);
                                                } else {
                                                    setEntryMode("upload");
                                                    setInlineContent("");
                                                    setSelectedFile(null);
                                                }
                                            }}
                                        >
                                            <span>Edit</span>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="rounded-full px-3 h-9 text-xs font-semibold"
                                            onClick={() => handleDelete(menu._id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="text-lg">{menu.name}</CardTitle>
                                <div className="flex gap-2 flex-wrap">
                                    <Badge variant="secondary" className="w-fit rounded-lg">{menu.category}</Badge>
                                    {menu.schedule && (
                                        <Badge variant="outline" className="w-fit rounded-lg uppercase">
                                            {menu.schedule} menu
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Added: {new Date(menu.uploadedAt).toLocaleDateString()}</span>
                                    {menu.type === "text" ? (
                                        <span className="text-primary font-bold">Inline</span>
                                    ) : (
                                        <a 
                                            href={menu.url || "#"} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center text-primary font-bold hover:underline"
                                        >
                                            View File <ExternalLink className="ml-1 h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                                {menu.type === "text" && (
                                    <div className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                                        {menu.content}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
