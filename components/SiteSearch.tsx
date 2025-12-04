'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, FileText, ArrowRight, X, Loader2, File } from 'lucide-react'
import { searchSite } from '@/app/actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SiteSearch({ subdomain }: { subdomain: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Sök när användaren slutar skriva (debounce)
  useEffect(() => {
    const timer = setTimeout(async () => {
        if (query.length > 2) {
            setLoading(true)
            const res = await searchSite(subdomain, query)
            setResults(res)
            setLoading(false)
        } else {
            setResults([])
        }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, subdomain])

  // Fokusera input när rutan öppnas
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  // Stäng vid navigering
  const handleLinkClick = () => {
    setIsOpen(false)
    setQuery('')
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-black px-3 py-2 rounded-full transition-colors"
      >
        <Search size={16} />
        <span className="hidden sm:inline">Sök...</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4 animate-in fade-in duration-200">
            {/* Overlay för att stänga */}
            <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>

            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 border border-gray-200">
                <div className="flex items-center border-b border-gray-100 p-4 gap-3">
                    <Search className="text-gray-400" />
                    <input 
                        ref={inputRef}
                        className="flex-1 outline-none text-lg text-gray-900 placeholder:text-gray-400"
                        placeholder="Vad letar du efter?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {loading && (
                        <div className="py-8 flex justify-center text-gray-400">
                            <Loader2 className="animate-spin" />
                        </div>
                    )}

                    {!loading && results.length === 0 && query.length > 2 && (
                        <div className="py-8 text-center text-gray-500 text-sm">
                            Inga träffar på "{query}"
                        </div>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-400 uppercase px-3 py-2">Resultat</p>
                            {results.map((item, i) => (
                                <Link 
                                    key={i} 
                                    href={item.url} 
                                    target={item.external ? '_blank' : '_self'}
                                    onClick={handleLinkClick}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className={`p-2 rounded-md ${
                                        item.type === 'doc' ? 'bg-red-50 text-red-600' : 
                                        item.type === 'page' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                        {item.type === 'doc' ? <File size={18} /> : item.type === 'page' ? <FileText size={18} /> : <ArrowRight size={18} />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{item.title}</div>
                                        {item.date && <div className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</div>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                    
                    {!loading && query.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-sm text-gray-400">Sök efter nyheter, dokument eller sidor.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </>
  )
}