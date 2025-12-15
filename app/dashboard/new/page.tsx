'use client'

import { useState, useEffect } from 'react'
import { createOrganization, createCheckoutSession } from '../../actions'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Check, Lock, Star } from 'lucide-react'
import Link from 'next/link'

export default function NewOrganizationPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isPro, setIsPro] = useState<boolean | null>(null)
    const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year')
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        async function checkStatus() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single()
                const status = profile?.is_pro || false
                setIsPro(status)
                if (status) clearInterval(intervalId)
            }
        }
        checkStatus()
        if (searchParams.get('success')) {
            intervalId = setInterval(checkStatus, 2000)
            toast.success("Betalning startad! Uppdaterar konto...")
        }
        return () => clearInterval(intervalId)
    }, [searchParams])

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        try {
            const result = await createOrganization(formData)
            if (result?.error) {
                toast.error(result.error)
                setIsLoading(false)
            } else if (result?.success) {
                toast.success("Föreningen skapad! 🚀")
                window.location.href = `http://${result.subdomain}.fornet.se:3000`
            }
        } catch (e) {
            toast.error("Något gick fel.")
            setIsLoading(false)
        }
    }

    const handlePayment = async () => {
        setIsLoading(true)
        const result = await createCheckoutSession(billingInterval)
        if (result.url) {
            window.location.href = result.url
        } else {
            toast.error("Kunde inte starta betalning")
            setIsLoading(false)
        }
    }

    if (isPro === null) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

    // --- VY 1: BETALVÄGG ---
    if (!isPro) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-200 text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Välj plan</h1>
                    <p className="text-gray-500 mb-6">Prova fritt i 60 dagar. Avsluta när som helst.</p>

                    {/* PRISVÄLJARE */}
                    <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-50 p-1 rounded-xl border">
                        <button
                            onClick={() => setBillingInterval('month')}
                            className={`text-sm font-bold py-2 rounded-lg transition-all ${billingInterval === 'month' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            Månadsvis
                        </button>
                        <button
                            onClick={() => setBillingInterval('year')}
                            className={`text-sm font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${billingInterval === 'year' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            Årsvis <span className="text-[9px] bg-green-100 text-green-700 px-1.5 rounded-full">-20%</span>
                        </button>
                    </div>

                    <div className="mb-2">
                        {billingInterval === 'year' ? (
                            <>
                                <span className="text-4xl font-extrabold">948 kr</span>
                                <span className="text-gray-500"> / år</span>
                                <p className="text-xs text-gray-400 mt-1">Motsvarar 79 kr/mån</p>
                            </>
                        ) : (
                            <>
                                <span className="text-4xl font-extrabold">99 kr</span>
                                <span className="text-gray-500"> / mån</span>
                                <p className="text-xs text-gray-400 mt-1">Faktureras varje månad</p>
                            </>
                        )}
                    </div>

                    <div className="bg-green-50 text-green-700 text-sm font-bold py-2 px-3 rounded-lg mb-8 inline-flex items-center gap-1">
                        <Star size={14} fill="currentColor" /> 0 kr att betala idag
                    </div>

                    <ul className="text-left space-y-3 mb-8 px-4">
                        <li className="flex gap-3 text-sm text-gray-600"><Check size={18} className="text-green-600 flex-shrink-0" /> 60 dagars gratis prövotid</li>
                        <li className="flex gap-3 text-sm text-gray-600"><Check size={18} className="text-green-600 flex-shrink-0" /> Ingen bindningstid</li>
                        <li className="flex gap-3 text-sm text-gray-600"><Check size={18} className="text-green-600 flex-shrink-0" /> Allt ingår (Driftstatus, CMS)</li>
                    </ul>

                    <button
                        onClick={handlePayment}
                        disabled={isLoading}
                        className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-900 transition-all flex justify-center items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Starta 60 dagars testperiod'}
                    </button>

                    <Link href="/dashboard" className="block mt-6 text-sm text-gray-400 hover:text-black">
                        Avbryt och gå tillbaka
                    </Link>
                </div>
            </div>
        )
    }

    // --- VY 2: SKAPA FORMULÄR ---
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-black flex items-center gap-1 mb-6">
                    <ArrowLeft size={16} /> Avbryt
                </Link>

                <div className="mb-6 flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg text-sm font-medium">
                    <Check size={16} /> Premium-konto aktivt
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Registrera Förening</h1>
                <p className="text-gray-500 mb-8">Fyll i uppgifterna för att skapa er sida.</p>

                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Föreningens namn</label>
                        <input name="name" type="text" required placeholder="T.ex. Björkens Vägförening" className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-black" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Önskad adress</label>
                        <div className="flex items-center">
                            <input name="subdomain" type="text" placeholder="bjorken" className="flex-1 border rounded-l-lg p-3 outline-none focus:ring-2 focus:ring-black border-r-0" />
                            <span className="bg-gray-100 border border-gray-200 border-l-0 rounded-r-lg p-3 text-gray-500 font-medium select-none">.fornet.se</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Typ av förening</label>
                        <div className="relative">
                            <select
                                name="type"
                                className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-black appearance-none bg-white"
                                defaultValue="road"
                            >
                                <option value="road">🛣️ Samfällighet / Vägförening</option>
                                <option value="brf">🏢 Bostadsrättsförening (BRF)</option>
                                <option value="cabin">🏡 Sommarstugeförening</option>
                                <option value="boat">⚓ Båtklubb</option>
                                <option value="allotment">🌻 Koloniträdgård</option>
                                <option value="hunt">🦌 Jaktlag</option>
                                <option value="fish">🐟 Fiskeförening</option>
                                <option value="venue">🎉 Bygdegårdsförening</option>
                                <option value="history">📜 Hembygdsförening</option>
                                <option value="other">🤝 Annan förening</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Vi anpassar funktionerna baserat på ditt val.</p>
                    </div>

                    <button disabled={isLoading} className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-900 transition-transform active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70">
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Starta Förening'}
                    </button>
                </form>
            </div>
        </div>
    )
}