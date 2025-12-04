'use client'

import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import ImageExtension from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import { 
  Bold, Italic, Heading1, Heading2, List, ListOrdered, 
  Image as ImageIcon, Youtube as YoutubeIcon, Quote, Link as LinkIcon, 
  Loader2, Plus, X 
} from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { checkStorageQuota, updateStorageUsage } from '@/app/actions'

interface EditorProps {
  content: string
  onChange: (html: string) => void
  orgId: string
}

export default function Editor({ content, onChange, orgId }: EditorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Tryck "/" för kommandon eller börja skriva...',
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'rounded-xl shadow-md max-w-full my-6 border border-gray-100',
        },
      }),
      Youtube.configure({
        controls: false,
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-xl shadow-md my-6 border border-gray-100',
        },
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        // Vi lägger till prose-klasser för att styla allt snyggt automatiskt
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] p-4 prose-img:mx-auto prose-headings:font-bold prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Synka innehåll utifrån (för redigering/nollställning)
  useEffect(() => {
    if (!editor) return
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // --- FUNKTIONER ---

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !editor) return

    try {
      setIsUploading(true)
      const quotaCheck = await checkStorageQuota(orgId, file.size)
      if (!quotaCheck.allowed) {
        alert(quotaCheck.message)
        return
      }
      
      const filename = `${orgId}/${Date.now()}-${file.name.replaceAll(' ', '_')}`
      const { error } = await supabase.storage.from('forum-media').upload(filename, file)
      if (error) throw error

      await updateStorageUsage(orgId, file.size)
      const { data: { publicUrl } } = supabase.storage.from('forum-media').getPublicUrl(filename)
      
      editor.chain().focus().setImage({ src: publicUrl }).run()

    } catch (error) {
      console.error(error)
      alert('Kunde inte ladda upp bilden.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const addYoutubeVideo = () => {
    const url = prompt('Klistra in YouTube-länk:')
    if (url && editor) {
      editor.commands.setYoutubeVideo({ src: url })
    }
  }

  const setLink = () => {
    const previousUrl = editor?.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  if (!editor) return null

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-black focus-within:border-transparent transition-all relative group">
      
      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />

      {/* --- 1. BUBBLE MENU (Vid markering av text) --- */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="bg-black text-white rounded-lg shadow-xl flex overflow-hidden border border-gray-700">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 hover:bg-gray-700 transition ${editor.isActive('bold') ? 'bg-gray-700 text-blue-400' : ''}`}
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 hover:bg-gray-700 transition ${editor.isActive('italic') ? 'bg-gray-700 text-blue-400' : ''}`}
            >
              <Italic size={16} />
            </button>
            <button
              onClick={setLink}
              className={`p-2 hover:bg-gray-700 transition ${editor.isActive('link') ? 'bg-gray-700 text-blue-400' : ''}`}
            >
              <LinkIcon size={16} />
            </button>
            <div className="w-px bg-gray-700 my-1"></div>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 hover:bg-gray-700 transition ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-700 text-blue-400' : ''}`}
            >
              <Heading1 size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 hover:bg-gray-700 transition ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-700 text-blue-400' : ''}`}
            >
              <Heading2 size={16} />
            </button>
          </div>
        </BubbleMenu>
      )}

      {/* --- 2. FLOATING MENU (Vid ny rad) --- */}
      {editor && (
        <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex gap-2 bg-white border border-gray-200 p-1 rounded-lg shadow-lg">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600 flex items-center gap-1 text-xs font-bold"
            >
              <Heading1 size={16} /> Rubrik
            </button>
            
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600 flex items-center gap-1 text-xs font-bold"
            >
              <List size={16} /> Lista
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600 flex items-center gap-1 text-xs font-bold"
            >
              <ImageIcon size={16} /> Bild
            </button>

            <button
              onClick={addYoutubeVideo}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600 flex items-center gap-1 text-xs font-bold"
            >
              <YoutubeIcon size={16} /> Video
            </button>

            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600 flex items-center gap-1 text-xs font-bold"
            >
              <Quote size={16} /> Kort
            </button>
          </div>
        </FloatingMenu>
      )}

      {/* --- 3. EDITOR AREA --- */}
      <div className="relative">
        <EditorContent editor={editor} />
        
        {isUploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
                <span className="text-sm font-bold text-black flex gap-2 items-center bg-white px-4 py-2 rounded-full shadow-lg border">
                    <Loader2 className="animate-spin" size={18}/> Laddar upp media...
                </span>
            </div>
        )}
      </div>

      {/* Hjälptext i botten */}
      <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 text-[10px] text-gray-400 rounded-b-xl flex justify-between">
        <span>Markera text för att formatera. Klicka på "+" för att lägga till objekt.</span>
        <span>{editor.storage.characterCount?.words()} ord</span>
      </div>
    </div>
  )
}