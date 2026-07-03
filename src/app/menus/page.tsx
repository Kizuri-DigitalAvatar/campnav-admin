"use client"

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import {
    ChevronLeft,
    ChevronRight,
    FileText,
    ImagePlus,
    Loader2,
    Plus,
    ScanLine,
    Trash2,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "drink"];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type MenuItemDraft = {
    name: string;
    mealType: string;
    description: string;
    image?: string; // storageId
    imageUrl?: string | null; // preview (existing url or local object url)
};

function getCurrentWeekStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay()); // back to Sunday
    return d.getTime();
}

function formatWeekLabel(weekStart: number) {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const start = new Date(weekStart).toLocaleDateString(undefined, opts);
    const end = new Date(weekStart + 6 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, opts);
    return `${start} – ${end}`;
}

function emptyItem(): MenuItemDraft {
    return { name: "", mealType: "breakfast", description: "" };
}

export default function MenusPage() {
    const [weekStart, setWeekStart] = useState(getCurrentWeekStart);

    const weekMenus = useQuery(api.menus.getWeek, { weekStart });
    const allMenus = useQuery(api.menus.list, {});
    const saveWeek = useMutation(api.menus.saveWeek);
    const removeMenu = useMutation(api.menus.remove);
    const generateUploadUrl = useMutation(api.images.generateUploadUrl);
    const extractMenuItems = useAction(api.menuOcr.extractMenuItems);

    const [days, setDays] = useState<Record<number, MenuItemDraft[]>>({});
    const [scanningDay, setScanningDay] = useState<number | null>(null);
    const [uploadingImage, setUploadingImage] = useState<string | null>(null); // `${day}-${index}`
    const [isSaving, setIsSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<number | null>(null);
    const loadedWeekRef = useRef<number | null>(null);

    // Populate the editor when a week's menus load; don't clobber in-progress edits on refetch
    useEffect(() => {
        if (weekMenus !== undefined && loadedWeekRef.current !== weekStart) {
            loadedWeekRef.current = weekStart;
            const next: Record<number, MenuItemDraft[]> = {};
            weekMenus.forEach((m: any) => {
                if (m.dayOfWeek === undefined) return;
                next[m.dayOfWeek] = (m.items || []).map((item: any) => ({
                    name: item.name,
                    mealType: item.mealType || "breakfast",
                    description: item.description || "",
                    image: item.image,
                    imageUrl: item.imageUrl,
                }));
            });
            setDays(next);
            setSavedAt(null);
        }
    }, [weekMenus, weekStart]);

    const changeWeek = (delta: number) => {
        loadedWeekRef.current = null;
        setWeekStart((w) => w + delta * WEEK_MS);
    };

    const updateItem = (day: number, index: number, patch: Partial<MenuItemDraft>) => {
        setDays((prev) => {
            const items = [...(prev[day] || [])];
            items[index] = { ...items[index], ...patch };
            return { ...prev, [day]: items };
        });
    };

    const addItem = (day: number) => {
        setDays((prev) => ({ ...prev, [day]: [...(prev[day] || []), emptyItem()] }));
    };

    const removeItem = (day: number, index: number) => {
        setDays((prev) => ({ ...prev, [day]: (prev[day] || []).filter((_, i) => i !== index) }));
    };

    async function uploadToStorage(file: File): Promise<string> {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
        });
        const { storageId } = await result.json();
        return storageId;
    }

    // Scan a photo of the whole menu and append its items to the day
    async function handleMenuScan(day: number, file: File) {
        setScanningDay(day);
        try {
            const storageId = await uploadToStorage(file);
            const extracted = await extractMenuItems({ storageId });
            setDays((prev) => ({
                ...prev,
                [day]: [
                    ...(prev[day] || []),
                    ...extracted.map((item) => ({
                        name: item.name,
                        mealType: MEAL_TYPES.includes(item.mealType) ? item.mealType : "lunch",
                        description: item.description || "",
                    })),
                ],
            }));
        } catch (err: any) {
            console.error("Menu scan failed:", err);
            alert(err?.message?.split("Uncaught Error:").pop()?.trim() || "Failed to read the menu image. Please enter items manually.");
        } finally {
            setScanningDay(null);
        }
    }

    // Upload a photo for one item
    async function handleItemImage(day: number, index: number, file: File) {
        const key = `${day}-${index}`;
        setUploadingImage(key);
        try {
            const storageId = await uploadToStorage(file);
            updateItem(day, index, { image: storageId, imageUrl: URL.createObjectURL(file) });
        } catch (err) {
            console.error("Item image upload failed:", err);
            alert("Failed to upload the item photo.");
        } finally {
            setUploadingImage(null);
        }
    }

    async function handleSave() {
        setIsSaving(true);
        try {
            await saveWeek({
                weekStart,
                days: DAY_NAMES.map((_, i) => ({
                    dayOfWeek: i,
                    items: (days[i] || [])
                        .filter((item) => item.name.trim())
                        .map((item) => ({
                            name: item.name,
                            mealType: item.mealType,
                            description: item.description || undefined,
                            image: item.image || undefined,
                        })),
                })),
            });
            setSavedAt(Date.now());
        } catch (err) {
            console.error("Failed to save week menu:", err);
            alert("Failed to save the menu. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    const otherMenus = (allMenus || []).filter((m: any) => m.dayOfWeek === undefined);
    const isCurrentWeek = weekStart === getCurrentWeekStart();
    const isBusy = scanningDay !== null || uploadingImage !== null;

    // Past weeks that have saved menus, newest first
    const pastWeeks = useMemo(() => {
        const currentWeek = getCurrentWeekStart();
        const byWeek = new Map<number, any[]>();
        (allMenus || []).forEach((m: any) => {
            if (m.dayOfWeek === undefined || m.weekStart === undefined) return;
            if (m.weekStart >= currentWeek) return;
            const list = byWeek.get(m.weekStart) || [];
            list.push(m);
            byWeek.set(m.weekStart, list);
        });
        return [...byWeek.entries()]
            .sort((a, b) => b[0] - a[0])
            .map(([week, menus]) => ({
                week,
                menus: menus.sort((a, b) => (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0)),
            }));
    }, [allMenus]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <UtensilsCrossed className="h-7 w-7 text-primary" />
                        Weekly Room Service Menu
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Add each day&apos;s dishes with a photo and description, or scan a printed menu and we&apos;ll fill the items in.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-card border rounded-xl px-2 h-11 self-start">
                    <button
                        type="button"
                        onClick={() => changeWeek(-1)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        aria-label="Previous week"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="text-sm font-bold min-w-[150px] text-center">
                        {formatWeekLabel(weekStart)}
                        {isCurrentWeek && (
                            <span className="ml-2 text-[10px] uppercase tracking-widest text-primary font-black">This week</span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => changeWeek(1)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        aria-label="Next week"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {weekMenus === undefined ? (
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-3xl" />)}
                </div>
            ) : (
                <div className="space-y-6">
                    {DAY_NAMES.map((dayName, day) => {
                        const date = new Date(weekStart + day * 24 * 60 * 60 * 1000);
                        const isScanning = scanningDay === day;
                        const items = days[day] || [];
                        return (
                            <Card key={day} className="rounded-3xl border-2">
                                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                                    <div>
                                        <CardTitle className="text-lg">{dayName}</CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                            {items.filter((i) => i.name.trim()).length > 0 && (
                                                <span className="ml-2 text-primary font-bold">
                                                    {items.filter((i) => i.name.trim()).length} items
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id={`menu-scan-${day}`}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleMenuScan(day, file);
                                                e.target.value = "";
                                            }}
                                        />
                                        <label htmlFor={`menu-scan-${day}`}>
                                            <span
                                                className={`inline-flex items-center gap-2 h-9 px-4 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${isScanning ? "opacity-60 pointer-events-none" : "hover:bg-muted"}`}
                                            >
                                                {isScanning ? (
                                                    <>
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        Reading menu...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ScanLine className="h-3.5 w-3.5" />
                                                        Scan menu image
                                                    </>
                                                )}
                                            </span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => addItem(day)}
                                            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add item
                                        </button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {items.length === 0 ? (
                                        <p className="text-sm text-muted-foreground/60 text-center py-4">
                                            No items yet — add one or scan a menu photo.
                                        </p>
                                    ) : (
                                        items.map((item, index) => {
                                            const imageKey = `${day}-${index}`;
                                            const isUploadingThis = uploadingImage === imageKey;
                                            return (
                                                <div
                                                    key={index}
                                                    className="flex flex-col md:flex-row gap-3 items-start p-3 rounded-2xl border bg-muted/20"
                                                >
                                                    <div className="shrink-0">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            id={`item-image-${imageKey}`}
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleItemImage(day, index, file);
                                                                e.target.value = "";
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor={`item-image-${imageKey}`}
                                                            className="w-16 h-16 rounded-xl border-2 border-dashed bg-background flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
                                                            title="Upload item photo"
                                                        >
                                                            {isUploadingThis ? (
                                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                            ) : item.imageUrl ? (
                                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <ImagePlus className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                        </label>
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_140px] gap-2 w-full">
                                                        <input
                                                            className="h-10 rounded-xl border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-primary/30 outline-none"
                                                            placeholder="Item name (e.g. Grilled Chicken)"
                                                            value={item.name}
                                                            onChange={(e) => updateItem(day, index, { name: e.target.value })}
                                                        />
                                                        <select
                                                            className="h-10 rounded-xl border bg-background px-3 text-sm capitalize outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer"
                                                            value={item.mealType}
                                                            onChange={(e) => updateItem(day, index, { mealType: e.target.value })}
                                                        >
                                                            {MEAL_TYPES.map((t) => (
                                                                <option key={t} value={t} className="capitalize">{t}</option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            className="h-10 rounded-xl border bg-background px-3 text-sm md:col-span-2 focus-visible:ring-2 focus-visible:ring-primary/30 outline-none"
                                                            placeholder="Description (ingredients, price...)"
                                                            value={item.description}
                                                            onChange={(e) => updateItem(day, index, { description: e.target.value })}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(day, index)}
                                                        className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 self-center"
                                                        aria-label="Remove item"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <div className="flex items-center gap-4 sticky bottom-4">
                <Button
                    onClick={handleSave}
                    disabled={isSaving || weekMenus === undefined || isBusy}
                    className="rounded-xl h-12 px-8 shadow-lg shadow-primary/20"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Week Menu"
                    )}
                </Button>
                {savedAt && !isSaving && (
                    <span className="text-sm font-medium text-primary">Saved ✓ Residents can now see this week&apos;s menu.</span>
                )}
            </div>

            {pastWeeks.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                    <div>
                        <h2 className="text-lg font-bold">Menu History</h2>
                        <p className="text-sm text-muted-foreground">Past week menus. Expand a week to view it, or open it in the editor above.</p>
                    </div>
                    <div className="space-y-3">
                        {pastWeeks.map(({ week, menus }) => (
                            <details key={week} className="bg-card border rounded-2xl overflow-hidden group">
                                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/40 transition-colors list-none">
                                    <div className="flex items-center gap-3">
                                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                                        <span className="font-bold text-sm">{formatWeekLabel(week)}</span>
                                        <Badge variant="secondary" className="rounded-lg text-[10px]">
                                            {menus.length} {menus.length === 1 ? "day" : "days"}
                                        </Badge>
                                    </div>
                                    <button
                                        type="button"
                                        className="text-xs font-bold text-primary hover:underline"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            loadedWeekRef.current = null;
                                            setWeekStart(week);
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                    >
                                        Open in editor
                                    </button>
                                </summary>
                                <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                                    {menus.map((menu: any) => (
                                        <div key={menu._id} className="rounded-xl border bg-muted/20 p-4">
                                            <div className="text-xs font-black uppercase tracking-widest text-primary mb-2">
                                                {DAY_NAMES[menu.dayOfWeek]}
                                            </div>
                                            {menu.items?.length ? (
                                                <div className="space-y-2">
                                                    {menu.items.map((item: any, i: number) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            {item.imageUrl ? (
                                                                <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded-lg object-cover border shrink-0" />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                                    <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground/50" />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-bold truncate">
                                                                    {item.name}
                                                                    <span className="ml-2 text-[9px] uppercase tracking-widest text-muted-foreground font-black">{item.mealType}</span>
                                                                </div>
                                                                {item.description && (
                                                                    <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                    {menu.content || "No content"}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            )}

            {otherMenus.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                    <h2 className="text-lg font-bold">Other Menus</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherMenus.map((menu: any) => (
                            <Card key={menu._id} className="rounded-2xl">
                                <CardContent className="pt-6 flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm truncate">{menu.name}</div>
                                            <div className="flex gap-2 mt-1">
                                                {menu.category && <Badge variant="secondary" className="rounded-lg text-[10px]">{menu.category}</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="text-destructive hover:bg-destructive/10 rounded-xl shrink-0 h-9 w-9 p-0"
                                        onClick={async () => {
                                            if (confirm(`Delete "${menu.name}"?`)) {
                                                await removeMenu({ id: menu._id });
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
