import { createClient } from '@/utils/supabase/server';
import { 
  deleteDocument, deleteEvent, deleteBoardMember, 
  updateModuleStatus, updateSnowStatusDetail, updateSettings,
  addEvent, uploadDocument, addBoardMember, 
  inviteMember, removeMember, 
  createResource, deleteResource, 
  createPage, deletePage 
} from '../../actions';
import PostsManager from '@/components/PostsManager';
import PagesManager from '@/components/PagesManager'; 
import Link from 'next/link';
import { 
    FileText, Calendar, User, ArrowLeft, Shield, Lock, Map, 
    CreditCard, Inbox, Key, ImageIcon, Megaphone, Briefcase, AlertTriangle 
} from 'lucide-react';

export default async function OrgAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Hämta inloggad användare
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // 2. Hämta all data
  const { data: org } = await supabase
    .from('organizations')
    .select('*, posts(*), documents(*), events(*), board_members(*), organization_members(*), resources(*), pages(*), form_submissions(*)')
    .eq('subdomain', slug)
    .order('created_at', { foreignTable: 'posts', ascending: false })
    .single();

  if (!org) return <div className="p-10">Föreningen hittades inte.</div>;

  // 3. SÄKERHETSKOLL
  const isMember = org.organization_members.some((m: any) => m.user_id === currentUser?.id);
  
  // --- HÄR VAR DEN SAKNADE RADEN: ---
  const isOwner = org.owner_id === currentUser?.id;
  // ----------------------------------

  if (!currentUser || !isMember) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Ingen åtkomst 🔒</h1>
                <p className="text-gray-500">Du saknar behörighet att redigera denna förening.</p>
                <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 block">Gå till mina föreningar</Link>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex justify-between items-end mb-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div>
            <Link href="/dashboard" className="text-gray-500 hover:text-black text-sm mb-2 flex items-center gap-1">
              <ArrowLeft size={14}/> Tillbaka
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{org.name}</h1>
            <p className="text-gray-500">Admin-panel</p>
          </div>
          <a 
            href={`http://${org.subdomain}.fornet.se:3000`} 
            target="_blank" 
            className="bg-black text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Öppna sidan ↗
          </a>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- VÄNSTER SPALT (Content) --- */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* 1. NYHETER */}
            <PostsManager 
                slug={slug} 
                orgId={org.id} 
                initialPosts={org.posts} 
            />

            {/* 2. MÄKLARINFO (Om påslaget) */}
            {org.config?.show_broker_info && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><Briefcase size={20}/> Mäklarinfo</h2>
                    <p className="text-xs text-gray-500 mb-4">Information som visas på /maklarinfo.</p>
                    <form action={updateSettings.bind(null, slug)} className="space-y-3">
                        <textarea 
                            name="broker_info" 
                            defaultValue={org.broker_info || ''} 
                            rows={8} 
                            placeholder="Skriv om p-platser, bredband, stambyten..." 
                            className="w-full border rounded p-3 text-sm focus:ring-2 focus:ring-black outline-none" 
                        />
                        <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 transition-colors">Spara text</button>
                    </form>
                </div>
            )}

            {/* 3. EGNA SIDOR */}
            <PagesManager 
                orgId={org.id}
                subdomain={slug}
                initialPages={org.pages}
            />

          </div>

          {/* --- HÖGER SPALT (Verktyg) --- */}
          <div className="space-y-6">
            
            {/* 0. MENY & UTSEENDE */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="font-bold mb-4 text-gray-800">🎨 Meny & Utseende</h2>
              <p className="text-xs text-gray-500 mb-4">Välj vad som ska synas för besökarna.</p>
              
              <div className="space-y-3">
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">Toppmeny</div>
                 
                 <div className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded">
                    <span className="text-sm">Boka</span>
                    <form action={async () => {'use server'; await updateModuleStatus(slug, 'show_booking', !org.config?.show_booking)}}>
                        <button className={`w-9 h-5 rounded-full relative transition-colors ${org.config?.show_booking ? 'bg-black' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${org.config?.show_booking ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </form>
                 </div>

                 <div className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded">
                    <span className="text-sm">Dokument</span>
                    <form action={async () => {'use server'; await updateModuleStatus(slug, 'show_documents', !org.config?.show_documents)}}>
                        <button className={`w-9 h-5 rounded-full relative transition-colors ${org.config?.show_documents ? 'bg-black' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${org.config?.show_documents ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </form>
                 </div>

                 <div className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded">
                    <span className="text-sm">Felanmälan</span>
                    <form action={async () => {'use server'; await updateModuleStatus(slug, 'show_contact_widget', !org.config?.show_contact_widget)}}>
                        <button className={`w-9 h-5 rounded-full relative transition-colors ${org.config?.show_contact_widget ? 'bg-black' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${org.config?.show_contact_widget ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </form>
                 </div>

                 <div className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded">
                    <span className="text-sm">Kalender</span>
                    <form action={async () => {'use server'; await updateModuleStatus(slug, 'show_calendar_qlink', !org.config?.show_calendar_qlink)}}>
                        <button className={`w-9 h-5 rounded-full relative transition-colors ${org.config?.show_calendar_qlink ? 'bg-black' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${org.config?.show_calendar_qlink ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </form>
                 </div>

                 <div className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded">
                    <span className="text-sm">Sopsortering (Länk)</span>
                    <form action={async () => {'use server'; await updateModuleStatus(slug, 'show_waste_sorting', !org.config?.show_waste_sorting)}}>
                        <button className={`w-9 h-5 rounded-full relative transition-colors ${org.config?.show_waste_sorting ? 'bg-black' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${org.config?.show_waste_sorting ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </form>
                 </div>
                 
                 <div className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded">
                    <span className="text-sm">Mäklarinfo</span>
                    <form action={async () => {'use server'; await updateModuleStatus(slug, 'show_broker_info', !org.config?.show_broker_info)}}>
                        <button className={`w-9 h-5 rounded-full relative transition-colors ${org.config?.show_broker_info ? 'bg-black' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${org.config?.show_broker_info ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </form>
                 </div>
                 
                 <div className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded mt-4 border-t border-gray-200 pt-3">
                    <span className="text-sm font-bold text-gray-500">Visa "Styrelsen" i menyn</span>
                    <form action={async () => {'use server'; await updateModuleStatus(slug, 'show_board', !org.config?.show_board)}}>
                        <button className={`w-9 h-5 rounded-full relative transition-colors ${org.config?.show_board ? 'bg-black' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${org.config?.show_board ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </form>
                 </div>

                 <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4">Startsida (Högerspalt)</div>

                 {/* Kalender Widget */}
                 <div className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded">
                    <span className="text-sm">Kalender (På gång)</span>
                    <form action={async () => {'use server'; await updateModuleStatus(slug, 'show_calendar_widget', !org.config?.show_calendar_widget)}}>
                        <button className={`w-9 h-5 rounded-full relative transition-colors ${org.config?.show_calendar_widget ? 'bg-black' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${org.config?.show_calendar_widget ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </form>
                 </div>

                 {/* Kontakt Widget */}
                 <div className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded">
                    <span className="text-sm">Kontakt-ruta</span>
                    <form action={async () => {'use server'; await updateModuleStatus(slug, 'show_contact_widget', !org.config?.show_contact_widget)}}>
                        <button className={`w-9 h-5 rounded-full relative transition-colors ${org.config?.show_contact_widget ? 'bg-black' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${org.config?.show_contact_widget ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </form>
                 </div>

                 {/* Karta Widget */}
                 <div className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded">
                    <span className="text-sm">Områdeskarta</span>
                    <form action={async () => {'use server'; await updateModuleStatus(slug, 'show_map_widget', !org.config?.show_map_widget)}}>
                        <button className={`w-9 h-5 rounded-full relative transition-colors ${org.config?.show_map_widget ? 'bg-black' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${org.config?.show_map_widget ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </form>
                 </div>

                 {/* Swish Widget */}
                 <div className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded">
                    <span className="text-sm">Swish-ruta</span>
                    <form action={async () => {'use server'; await updateModuleStatus(slug, 'show_swish_widget', !org.config?.show_swish_widget)}}>
                        <button className={`w-9 h-5 rounded-full relative transition-colors ${org.config?.show_swish_widget ? 'bg-black' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${org.config?.show_swish_widget ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </form>
                 </div>

              </div>
            </div>

            {/* 1. VIKTIGT MEDDELANDE (ALERT) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
                    <Megaphone size={18}/> Viktigt meddelande
                </h2>
                
                <form action={updateSettings.bind(null, slug)} className="space-y-3">
                    <input 
                        name="alert_message" 
                        defaultValue={org.alert_message || ''} 
                        placeholder="T.ex. Vattnet stängs av imorgon 10:00" 
                        className="w-full border rounded p-2 text-sm" 
                    />
                    <select name="alert_level" defaultValue={org.alert_level || 'warning'} className="w-full border rounded p-2 text-sm bg-white">
                        <option value="info">🔵 Info (Blå)</option>
                        <option value="warning">🟡 Varning (Gul)</option>
                        <option value="critical">🔴 Kritisk (Röd)</option>
                    </select>
                    <button className="w-full bg-black text-white text-sm py-2 rounded hover:bg-gray-800 transition-colors">Uppdatera notis</button>
                </form>
            </div>

            {/* 2. INSTÄLLNINGAR (Lösenord, Swish, Karta, Hero) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold mb-4 text-gray-800">🔧 Inställningar</h2>
                <form action={updateSettings.bind(null, slug)}>
                    
                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 block mb-1 flex items-center gap-1"><Lock size={12}/> Lösenordsskydd</label>
                        <input name="site_password" defaultValue={org.site_password || ''} placeholder="Lämna tomt för öppen sida" type="text" className="w-full border rounded p-2 text-sm bg-yellow-50 focus:bg-white transition-colors" />
                    </div>

                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 block mb-1 flex items-center gap-1"><CreditCard size={12}/> Swish-nummer</label>
                        <input name="swish_number" defaultValue={org.swish_number || ''} placeholder="123 456 78 90" className="w-full border rounded p-2 text-sm mb-2" />
                        <input name="swish_message" defaultValue={org.swish_message || ''} placeholder="Meddelande" className="w-full border rounded p-2 text-sm" />
                    </div>

                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 block mb-1 flex items-center gap-1"><Map size={12}/> Ladda upp Karta (Bild)</label>
                        <input type="file" name="map_image" accept="image/*" className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                        {org.map_image_url && <p className="text-xs text-green-600 mt-1">Karta finns ✅</p>}
                    </div>

                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 block mb-1 flex items-center gap-1"><ImageIcon size={12}/> Omslagsbild (Hero)</label>
                        <input type="file" name="hero_image" accept="image/*" className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                        {org.hero_image_url && <p className="text-xs text-green-600 mt-1">Bild finns uppladdad ✅</p>}
                    </div>

                    <button className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition-colors">Spara inställningar</button>
                </form>
            </div>

            {/* 3. INKORG (Formulärsvar) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><Inbox size={18} /> Inkorg</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {org.form_submissions?.map((sub: any) => {
                        const data = typeof sub.data === 'string' ? JSON.parse(sub.data) : sub.data;
                        return (
                            <div key={sub.id} className="text-sm border rounded-lg p-3 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                                <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2">
                                    <span className={`font-bold text-xs uppercase px-2 py-0.5 rounded ${
                                        sub.type === 'error_report' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {sub.type === 'error_report' ? '⚠️ Felanmälan' : '📩 Kontakt'}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{new Date(sub.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="space-y-1">
                                    {data.namn && <p><span className="font-semibold text-gray-700">Namn:</span> {data.namn}</p>}
                                    {data.kontakt && <p><span className="font-semibold text-gray-700">Kontakt:</span> <a href={`mailto:${data.kontakt}`} className="text-blue-600 hover:underline">{data.kontakt}</a></p>}
                                    {data.meddelande && (
                                        <div className="mt-2 text-gray-600 italic border-l-2 border-gray-300 pl-2">"{data.meddelande}"</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {(!org.form_submissions || org.form_submissions.length === 0) && <p className="text-xs text-gray-400 italic text-center py-4">Inga meddelanden än.</p>}
                </div>
            </div>

            {/* 4. DRIFTSTATUS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="font-bold mb-4 text-gray-800">⚙️ Driftstatus</h2>
              <div className="space-y-4">
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-gray-700 flex items-center gap-2">❄️ Plogstatus</span>
                        <form action={async () => {'use server'; await updateModuleStatus(slug, 'show_snow_status', !org.config?.show_snow_status)}}>
                            <button className={`w-10 h-5 rounded-full relative transition-colors ${org.config?.show_snow_status ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${org.config?.show_snow_status ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </form>
                    </div>
                    {org.config?.show_snow_status && (
                        <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                            <form action={updateSnowStatusDetail.bind(null, slug)} className="flex gap-2">
                                <select name="status" defaultValue={org.config?.snow_status_text || "Ej åtgärdat"} className="flex-1 text-sm border-gray-300 rounded-md border p-1.5 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="Ej åtgärdat">Ej åtgärdat</option>
                                    <option value="Pågår">🚜 Plogbil kör nu</option>
                                    <option value="Plogat">✅ Endast Plogat</option>
                                    <option value="Plogat & Sandat">✨ Plogat & Sandat</option>
                                </select>
                                <button className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-blue-700">OK</button>
                            </form>
                        </div>
                    )}
                 </div>
                 <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <span>💧 Sommarvatten</span>
                    <form action={async () => {'use server'; await updateModuleStatus(slug, 'show_water_status', !org.config?.show_water_status)}}>
                        <button className={`w-10 h-5 rounded-full relative ${org.config?.show_water_status ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${org.config?.show_water_status ? 'left-6' : 'left-1'}`}></div>
                        </button>
                    </form>
                 </div>
              </div>
            </div>

            {/* 5. TEAM */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><Shield size={18}/> Administratörer</h2>
                <form action={inviteMember.bind(null, org.id)} className="space-y-2 mb-4">
                    <input name="email" required type="email" placeholder="Email (t.ex. kassor@bjorken.se)" className="w-full border rounded p-2 text-sm" />
                    <button className="w-full bg-black text-white text-sm py-2 rounded hover:bg-gray-800 transition-colors">Bjud in</button>
                </form>
                <div className="space-y-2">
                    {org.organization_members?.map((m: any) => {
                        const isTargetOwner = m.user_id === org.owner_id;
                        return (
                            <div key={m.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                <div className="overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold block truncate max-w-[120px]" title={m.email}>{m.email}</span>
                                        {isTargetOwner && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Ägare</span>}
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold ${m.user_id ? 'text-green-600' : 'text-orange-500'}`}>
                                        {m.user_id ? 'Aktiv' : 'Väntar...'}
                                    </span>
                                </div>
                                {isOwner && !isTargetOwner && (
                                    <form action={removeMember.bind(null, m.id)}>
                                        <button className="text-gray-300 hover:text-red-600 px-2 font-bold" title="Ta bort behörighet">×</button>
                                    </form>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 6. BOKNING */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><Key size={18}/> Bokning</h2>
                <form action={createResource.bind(null, org.id)} className="space-y-2 mb-4">
                    <input name="name" required placeholder="Namn (t.ex. Tvättstuga 1)" className="w-full border rounded p-2 text-sm" />
                    <input name="description" placeholder="Beskrivning" className="w-full border rounded p-2 text-sm" />
                    <button className="w-full bg-black text-white text-sm py-2 rounded hover:bg-gray-800 transition-colors">Lägg till resurs</button>
                </form>
                <div className="space-y-2">
                    {org.resources?.map((r: any) => (
                        <div key={r.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                            <span className="font-bold">{r.name}</span>
                            <form action={deleteResource.bind(null, r.id)}><button className="text-gray-300 hover:text-red-600 px-2 font-bold">×</button></form>
                        </div>
                    ))}
                    {(!org.resources || org.resources.length === 0) && <p className="text-xs text-gray-400 italic">Inga resurser.</p>}
                </div>
            </div>

            {/* 7. KALENDER */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><Calendar size={18}/> Kalender</h2>
                <form action={addEvent.bind(null, org.id)} className="space-y-2 mb-4">
                    <input name="title" required placeholder="Händelse" className="w-full border rounded p-2 text-sm" />
                    <input name="date" type="date" required className="w-full border rounded p-2 text-sm" />
                    <button className="w-full bg-black text-white text-sm py-2 rounded">Lägg till</button>
                </form>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {org.events?.map((e: any) => (
                        <div key={e.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                            <div>
                                <span className="font-bold text-xs block text-gray-500">{new Date(e.date).toLocaleDateString()}</span>
                                <span>{e.title}</span>
                            </div>
                            <form action={deleteEvent.bind(null, e.id)}><button className="text-gray-300 hover:text-red-600 px-2 font-bold">×</button></form>
                        </div>
                    ))}
                </div>
            </div>

            {/* 8. DOKUMENT */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><FileText size={18}/> Dokument</h2>
                <form action={uploadDocument.bind(null, org.id)} className="space-y-2 mb-4">
                    <input name="title" required placeholder="Namn" className="w-full border rounded p-2 text-sm" />
                    <input name="file" type="file" required accept=".pdf" className="w-full border rounded p-2 text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                    <button className="w-full bg-black text-white text-sm py-2 rounded hover:bg-gray-800 transition-colors">Ladda upp PDF</button>
                </form>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {org.documents?.map((d: any) => (
                        <div key={d.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                            <span className="truncate max-w-[150px]">{d.title}</span>
                            <form action={deleteDocument.bind(null, d.id)}><button className="text-gray-300 hover:text-red-600 px-2 font-bold">×</button></form>
                        </div>
                    ))}
                </div>
            </div>

            {/* 9. STYRELSE */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><User size={18}/> Styrelse</h2>
                <form action={addBoardMember.bind(null, org.id)} className="space-y-2 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                        <input name="name" required placeholder="Namn" className="w-full border rounded p-2 text-sm" />
                        <input name="role" required placeholder="Roll" className="w-full border rounded p-2 text-sm" />
                    </div>
                    <input name="email" placeholder="Email" className="w-full border rounded p-2 text-sm" />
                    <button className="w-full bg-black text-white text-sm py-2 rounded">Lägg till person</button>
                </form>
                <div className="space-y-2">
                    {org.board_members?.map((m: any) => (
                        <div key={m.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                            <div>
                                <span className="font-bold block">{m.name}</span>
                                <span className="text-xs text-gray-500">{m.role}</span>
                            </div>
                            <form action={deleteBoardMember.bind(null, m.id)}><button className="text-gray-300 hover:text-red-600 px-2 font-bold">×</button></form>
                        </div>
                    ))}
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}