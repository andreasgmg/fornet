'use client'

import { useState } from 'react'
import CreatePageForm from './CreatePageForm' // Vår nya komponent
import { deletePage } from '@/app/actions'
import { Trash2, Edit2, ExternalLink, FilePlus } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Page {
    id: string;
    title: string;
    slug: string;
    content: string;
    created_at: string;
}

interface Props {
  orgId: string
  subdomain: string
  initialPages: Page[]
}

export default function PagesManager({ orgId, subdomain, initialPages }: Props) {
  const [editingPage, setEditingPage] = useState<Page | null>(null)

  const handleDelete = async (pageId: string) => {
    if(!confirm("Är du säker? Sidan försvinner permanent.")) return;
    
    try {
        await deletePage(pageId)
        toast.success("Sidan raderades.")
        if (editingPage?.id === pageId) setEditingPage(null)
    } catch(e) {
        toast.error("Kunde inte radera.")
    }
  }

  return (
    <div className="space-y-8">
      
      {/* FORMULÄR */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FilePlus size={24} className="text-purple-600" />
            {editingPage ? '✏️ Redigera sida' : '📄 Skapa ny undersida'}
        </h2>
        
        <CreatePageForm 
            orgId={orgId} 
            pageToEdit={editingPage || undefined} 
            onCancelEdit={() => setEditingPage(null)}
        />
      </div>

      {/* LISTA PÅ SIDOR */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-700">Dina sidor</h3>
        
        {initialPages?.map((page) => (
          <div 
            key={page.id} 
            className={`bg-white p-4 rounded-lg border flex justify-between items-center group transition-all ${editingPage?.id === page.id ? 'ring-2 ring-purple-500 border-transparent shadow-md' : ''}`}
          >
            <div>
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                {page.title}
                {editingPage?.id === page.id && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase">Redigerar</span>}
              </h4>
              
              <Link 
                href={`http://${subdomain}.fornet.se:3000/s/${page.slug}`} 
                target="_blank"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
              >
                /s/{page.slug} <ExternalLink size={10} />
              </Link>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={() => {
                        setEditingPage(page)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                    title="Redigera"
                >
                    <Edit2 size={18}/>
                </button>

                <button 
                    onClick={() => handleDelete(page.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Radera"
                >
                    <Trash2 size={18}/>
                </button>
            </div>
          </div>
        ))}

        {(!initialPages || initialPages.length === 0) && (
            <div className="text-center py-8 border border-dashed rounded-lg bg-gray-50 text-gray-400 text-sm">
                Du har inga egna sidor än. Skapa en ovan! 👆
            </div>
        )}
      </div>

    </div>
  )
}