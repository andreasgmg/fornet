'use client'

import { useState, useEffect } from 'react'
import Editor from './Editor'
import { createPage, updatePage } from '@/app/actions'
import { toast } from 'sonner' 
import { X } from 'lucide-react'

interface PageToEdit {
  id: string;
  title: string;
  content: string;
}

interface Props {
  orgId: string
  pageToEdit?: PageToEdit
  onCancelEdit?: () => void
}

export default function CreatePageForm({ orgId, pageToEdit, onCancelEdit }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPending, setIsPending] = useState(false)

  // Fyll i formuläret om vi redigerar
  useEffect(() => {
    if (pageToEdit) {
      setTitle(pageToEdit.title)
      setContent(pageToEdit.content)
    } else {
      setTitle('')
      setContent('')
    }
  }, [pageToEdit])

  async function handleSubmit() {
    if (!title.trim()) {
       toast.error("Du måste ge sidan en rubrik!")
       return
    }
    if (!content.trim() || content === '<p></p>') {
      toast.error("Sidan kan inte vara tom.")
      return
    }

    setIsPending(true)
    const formData = new FormData()
    formData.set('title', title)
    formData.set('content', content)
    
    try {
      if (pageToEdit) {
        // UPPDATERA
        await updatePage(pageToEdit.id, formData)
        toast.success("Sidan sparades! 💾")
        if (onCancelEdit) onCancelEdit()
      } else {
        // SKAPA NY
        await createPage(orgId, formData)
        toast.success("Sidan skapad! 🎉")
        setTitle('') 
        setContent('') 
      }
    } catch (error) {
      toast.error("Något gick fel.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className={`space-y-4 transition-all ${pageToEdit ? 'bg-purple-50 p-4 rounded-xl border border-purple-200' : ''}`}>
      
      {pageToEdit && (
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">Redigerar sida</span>
            <button onClick={onCancelEdit} className="text-gray-400 hover:text-red-500 flex items-center gap-1 text-xs">
                <X size={14}/> Avbryt
            </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sidrubrik (Länk i menyn)</label>
        <input 
          name="title" 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          required 
          placeholder="T.ex. Om Föreningen"
          className="w-full border border-gray-300 rounded-lg p-3 text-lg font-medium focus:ring-2 focus:ring-black focus:outline-none" 
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Innehåll</label>
        <Editor content={content} onChange={setContent} orgId={orgId} />
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={isPending}
        className={`${pageToEdit ? 'bg-purple-600 hover:bg-purple-700' : 'bg-black hover:bg-gray-800'} text-white px-6 py-3 rounded-lg font-medium w-full transition-all disabled:opacity-50`}
      >
        {isPending ? 'Sparar...' : pageToEdit ? 'Spara ändringar' : 'Skapa Sida'}
      </button>
    </div>
  )
}