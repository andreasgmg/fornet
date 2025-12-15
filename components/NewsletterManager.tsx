'use client'

import { useState } from 'react'
import Editor from './Editor'
import { saveNewsletter, deleteNewsletter, sendNewsletter } from '@/app/actions'
import { toast } from 'sonner'
import { Send, Trash2, Edit2, Plus, Mail, CheckCircle2 } from 'lucide-react'

export default function NewsletterManager({ orgId, newsletters }: { orgId: string, newsletters: any[] }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!subject) return toast.error("Du måste skriva en rubrik!");
    setLoading(true);
    const fd = new FormData();
    fd.set('subject', subject);
    fd.set('content', content);
    
    await saveNewsletter(orgId, fd, editId || undefined);
    
    setLoading(false);
    setIsEditing(false);
    setEditId(null);
    setSubject('');
    setContent('');
    toast.success("Utkast sparat! 💾");
  }

  const handleSend = async (id: string) => {
    if(!confirm("Är du säker? Detta skickas till ALLA medlemmar nu.")) return;
    
    const res = await sendNewsletter(id);
    if(res?.error) toast.error(res.error);
    else toast.success(`Skickat till ${res?.count} medlemmar! 🚀`);
  }

  const handleDelete = async (id: string) => {
    if(!confirm("Ta bort utskicket?")) return;
    await deleteNewsletter(id);
    toast.success("Borttaget.");
  }

  const startEdit = (n?: any) => {
      setIsEditing(true);
      if (n) {
          setEditId(n.id);
          setSubject(n.subject);
          setContent(n.content);
      } else {
          setEditId(null);
          setSubject('');
          setContent('');
      }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-12">
        <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold flex items-center gap-2 text-gray-800">
                <Mail size={20} className="text-blue-600"/> Nyhetsbrev
            </h2>
            {!isEditing && (
                <button onClick={() => startEdit()} className="bg-black text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800">
                    <Plus size={16}/> Nytt utskick
                </button>
            )}
        </div>

        {isEditing ? (
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-gray-500">Skriv mail</span>
                    <button onClick={() => setIsEditing(false)} className="text-xs text-gray-400 hover:text-black">Avbryt</button>
                </div>
                <input 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    placeholder="Ämne: T.ex. Vårens städdag" 
                    className="w-full border p-3 rounded-lg font-bold"
                />
                <Editor content={content} onChange={setContent} orgId={orgId} />
                <button 
                    onClick={handleSave} 
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                    {loading ? 'Sparar...' : 'Spara Utkast'}
                </button>
            </div>
        ) : (
            <div className="space-y-3">
                {newsletters?.map((n) => (
                    <div key={n.id} className={`border rounded-lg p-4 flex justify-between items-center ${n.status === 'sent' ? 'bg-green-50 border-green-100' : 'bg-white'}`}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900">{n.subject}</h4>
                                {n.status === 'sent' ? (
                                    <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                                        <CheckCircle2 size={10}/> Skickat {new Date(n.sent_at).toLocaleDateString('sv-SE')}
                                    </span>
                                ) : (
                                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">UTKAST</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{n.content.replace(/<[^>]*>?/gm, '')}</p>
                        </div>
                        
                        <div className="flex gap-2">
                            {n.status === 'draft' && (
                                <>
                                    <button onClick={() => handleSend(n.id)} className="text-blue-600 hover:bg-blue-50 p-2 rounded" title="Skicka nu">
                                        <Send size={18} />
                                    </button>
                                    <button onClick={() => startEdit(n)} className="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded">
                                        <Edit2 size={18} />
                                    </button>
                                </>
                            )}
                            <button onClick={() => handleDelete(n.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {newsletters?.length === 0 && <p className="text-center text-sm text-gray-400 py-6">Inga nyhetsbrev än.</p>}
            </div>
        )}
    </div>
  )
}