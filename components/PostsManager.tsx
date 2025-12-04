'use client'

import { useState } from 'react'
import CreatePostForm from './CreatePostForm'
import { deletePost } from '@/app/actions'
import { Trash2, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

// 1. FIX: Lägg till 'content' i interfacet (CreatePostForm behöver det)
interface Post {
    id: string;
    title: string;
    content: string; 
    created_at: string;
}

interface Props {
  slug: string
  orgId: string
  initialPosts: Post[]
}

export default function PostsManager({ slug, orgId, initialPosts }: Props) {
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  const handleDelete = async (postId: string) => {
    if(!confirm("Är du säker på att du vill radera inlägget?")) return;
    
    try {
        await deletePost(postId)
        toast.success("Inlägget raderades.")
        if (editingPost?.id === postId) setEditingPost(null)
    } catch(e) {
        toast.error("Kunde inte radera.")
    }
  }

  return (
    <div className="space-y-8">
      
      {/* 1. FORMULÄRET */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-6">
            {editingPost ? '✏️ Redigera inlägg' : '✍️ Skriv nytt inlägg'}
        </h2>
        
        <CreatePostForm 
            slug={slug} 
            orgId={orgId} 
            // 2. FIX: Konvertera 'null' till 'undefined'
            postToEdit={editingPost || undefined} 
            onCancelEdit={() => setEditingPost(null)}
        />
      </div>

      {/* 2. LISTAN */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-700">Publicerade inlägg</h3>
        
        {initialPosts?.map((post) => (
          <div 
            key={post.id} 
            className={`bg-white p-4 rounded-lg border flex justify-between items-start group transition-all ${editingPost?.id === post.id ? 'ring-2 ring-blue-500 border-transparent shadow-md' : ''}`}
          >
            <div>
              <h4 className="font-bold text-gray-900">{post.title}</h4>
              
              <p className="text-xs text-gray-400" suppressHydrationWarning>
                {new Date(post.created_at).toLocaleDateString('sv-SE')} 
                {editingPost?.id === post.id && <span className="ml-2 text-blue-600 font-bold">• Redigeras</span>}
              </p>
              
            </div>
            
            <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => {
                        setEditingPost(post)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Redigera"
                >
                    <Edit2 size={18}/>
                </button>

                <button 
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    title="Radera"
                >
                    <Trash2 size={18}/>
                </button>
            </div>
          </div>
        ))}

        {(!initialPosts || initialPosts.length === 0) && (
            <p className="text-gray-400 italic text-center py-4">Inga inlägg än.</p>
        )}
      </div>

    </div>
  )
}