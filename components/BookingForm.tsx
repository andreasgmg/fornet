'use client'

import { createBooking } from '@/app/actions'
import { toast } from 'sonner'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function BookingForm({ resourceId, date }: { resourceId: string, date: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    formData.append('date', date)
    
    const result = await createBooking(resourceId, formData)
    setIsLoading(false)

    if (result?.error) {
        toast.error(result.error)
    } else {
        toast.success("Bokning skapad! ✅")
        const form = document.getElementById(`form-${resourceId}`) as HTMLFormElement;
        form?.reset();
    }
  }

  return (
    <form id={`form-${resourceId}`} action={handleSubmit} className="space-y-3">
        <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Tid</label>
            <div className="flex items-center gap-2">
                <input required type="time" name="startTime" className="w-full border rounded p-2 text-sm" />
                <span>-</span>
                <input required type="time" name="endTime" className="w-full border rounded p-2 text-sm" />
            </div>
        </div>
        
        <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Namn</label>
            <input required type="text" name="name" placeholder="Förnamn Efternamn" className="w-full border rounded p-2 text-sm" />
        </div>

        {/* NYTT FÄLT: Kontaktuppgifter */}
        <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Hus / Lgh / Tel</label>
            <input required type="text" name="contact" placeholder="T.ex. Hus 4B eller 070-123..." className="w-full border rounded p-2 text-sm" />
            <p className="text-[10px] text-gray-400 mt-1">Visas för andra så de vet vem som bokat.</p>
        </div>

        <button 
            disabled={isLoading}
            className="w-full bg-black text-white font-bold text-sm py-2 rounded hover:bg-gray-800 disabled:opacity-50 flex justify-center items-center gap-2"
        >
            {isLoading && <Loader2 className="animate-spin" size={14} />}
            Boka tid
        </button>
    </form>
  )
}