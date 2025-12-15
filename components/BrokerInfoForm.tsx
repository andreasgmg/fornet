'use client'

import { useState } from 'react'
import Editor from './Editor'
import { updateSettings } from '@/app/actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Props {
  slug: string
  orgId: string
  initialContent: string
}

export default function BrokerInfoForm({ slug, orgId, initialContent }: Props) {
  const [content, setContent] = useState(initialContent || '')
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async () => {
    setIsPending(true)
    
    // Vi skapar en FormData precis som server-action förväntar sig
    const formData = new FormData()
    formData.set('broker_info', content)

    await updateSettings(slug, formData)
    
    setIsPending(false)
    toast.success("Mäklarinfo sparad! 💾")
  }

  return (
    <div className="space-y-4">
        {/* EDITORN */}
        <div className="min-h-[400px]"> 
            <Editor content={content} onChange={setContent} orgId={orgId} />
        </div>

        {/* KNAPP */}
        <button 
            onClick={handleSubmit} 
            disabled={isPending}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
        >
            {isPending && <Loader2 className="animate-spin" size={16} />}
            {isPending ? 'Sparar...' : 'Spara ändringar'}
        </button>
    </div>
  )
}