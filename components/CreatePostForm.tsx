'use client'

import { useState, useEffect } from 'react'
import Editor from './Editor'
import { createPost, updatePost } from '@/app/actions' // Importera updatePost
import { toast } from 'sonner' 
import { X } from 'lucide-react'

// Vi tar emot "postToEdit" och en funktion för att avbryta redigering
interface PostToEdit {
  id: string;
  title: string;
  content: string;
}

interface Props {
  slug: string
  orgId: string
  postToEdit?: PostToEdit // Det inlägg vi redigerar just nu (eller null)
  onCancelEdit?: () => void
}

export default function CreatePostForm({ slug, orgId, postToEdit, onCancelEdit }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPending, setIsPending] = useState(false)

  // När "postToEdit" ändras (t.ex. vi klickar på pennan), fyll formuläret
  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title)
      setContent(postToEdit.content)
    } else {
      // Om vi avbryter, rensa
      setTitle('')
      setContent('')
    }
  }, [postToEdit])

  async function handleSubmit() {
    if (!title.trim()) {
       toast.error("Du har glömt rubriken!")
       return
    }
    if (!content.trim() || content === '<p></p>') {
      toast.error("Du måste skriva något innehåll! ✍️")
      return
    }

    setIsPending(true)
    const formData = new FormData()
    formData.set('title', title)
    formData.set('content', content)
    
    try {
      if (postToEdit) {
        // --- UPPDATERA ---
        await updatePost(postToEdit.id, formData)
        toast.success("Inlägget uppdaterades! 💾")
        if (onCancelEdit) onCancelEdit() // Gå ur redigeringsläge
      } else {
        // --- SKAPA NYTT ---
        await createPost(slug, formData)
        toast.success("Inlägget har publicerats! 🚀")
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
    <div className={`space-y-4 transition-all ${postToEdit ? 'bg-blue-50 p-4 rounded-xl border border-blue-200' : ''}`}>
      
      {/* Header för redigering */}
      {postToEdit && (
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Redigerar inlägg</span>
            <button onClick={onCancelEdit} className="text-gray-400 hover:text-red-500 flex items-center gap-1 text-xs">
                <X size={14}/> Avbryt
            </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rubrik</label>
        <input 
          name="title" 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          required 
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
        className={`${postToEdit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-gray-800'} text-white px-6 py-3 rounded-lg font-medium w-full transition-all disabled:opacity-50`}
      >
        {isPending ? 'Sparar...' : postToEdit ? 'Spara ändringar' : 'Publicera inlägg'}
      </button>
    </div>
  )
}