"use client"

import { FormEvent, useEffect, useState } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"
import { Loader2, MessageCircle, Phone, PhoneCall } from "lucide-react"

import { useAdminSession } from "@/components/admin-session"

const label = "text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1"
const field = "w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"

export default function SettingsPage() {
    const session = useAdminSession()
    const contact = useQuery(api.settings.getReceptionContact)
    const save = useMutation(api.settings.setReceptionContact)

    const [phone, setPhone] = useState("")
    const [whatsapp, setWhatsapp] = useState("")
    const [hours, setHours] = useState("")
    const [saving, setSaving] = useState(false)
    const [loaded, setLoaded] = useState(false)

    // Fill the form once, without clobbering edits on live updates
    useEffect(() => {
        if (contact && !loaded) {
            setPhone(contact.phone ?? "")
            setWhatsapp(contact.whatsapp ?? "")
            setHours(contact.hours ?? "")
            setLoaded(true)
        }
    }, [contact, loaded])

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            await save({
                phone,
                whatsapp,
                hours,
                updatedBy: (session?.userId || undefined) as any,
            })
            toast.success("Reception contact saved", { description: "Residents and guests will see it straight away." })
        } catch (err: any) {
            toast.error("Could not save", { description: err?.message?.replace(/^.*Uncaught Error: /, "").split("\n")[0] })
        } finally {
            setSaving(false)
        }
    }

    const digits = whatsapp.replace(/\D/g, "")

    return (
        <div className="space-y-8 md:space-y-10 max-w-3xl">
            <div className="flex items-center space-x-4">
                <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground">
                    <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reception & Contact</h2>
                    <p className="text-sm text-muted-foreground">How residents and guests reach reception from the app.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label htmlFor="reception-phone" className={label}>Reception phone</label>
                        <input
                            id="reception-phone"
                            type="tel"
                            inputMode="tel"
                            className={field}
                            placeholder="+232 76 123456"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <p className="text-[11px] text-muted-foreground ml-1">The <strong>Call</strong> button opens the phone's dialler with this number.</p>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="reception-whatsapp" className={label}>Reception WhatsApp</label>
                        <input
                            id="reception-whatsapp"
                            type="tel"
                            inputMode="tel"
                            className={field}
                            placeholder="+232 76 123456"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                        />
                        <p className="text-[11px] text-muted-foreground ml-1">Include the country code. The <strong>Message</strong> button opens a WhatsApp chat.</p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label htmlFor="reception-hours" className={label}>Opening hours (optional)</label>
                        <input
                            id="reception-hours"
                            className={field}
                            placeholder="e.g. 24/7, or 07:00 – 22:00"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                        />
                    </div>
                </div>

                {(phone || digits) && (
                    <div className="rounded-2xl border bg-muted/30 p-4 space-y-2">
                        <p className={label}>Test the links</p>
                        <div className="flex flex-wrap gap-2">
                            {phone && (
                                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border bg-card text-xs font-bold hover:bg-muted">
                                    <Phone className="w-3.5 h-3.5" /> Call {phone}
                                </a>
                            )}
                            {digits && (
                                <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border bg-card text-xs font-bold hover:bg-muted">
                                    <MessageCircle className="w-3.5 h-3.5" /> Open WhatsApp chat
                                </a>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 pt-6 border-t">
                    <button
                        type="submit"
                        disabled={saving || contact === undefined}
                        className="bg-primary text-primary-foreground min-w-[160px] h-11 rounded-xl px-6 font-bold hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        SAVE
                    </button>
                    {contact?.updatedAt && (
                        <p className="text-xs text-muted-foreground">Last updated {new Date(contact.updatedAt).toLocaleString()}</p>
                    )}
                </div>
            </form>
        </div>
    )
}
