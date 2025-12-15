'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    FileText, Calendar, User, ArrowLeft, Shield, Lock, Map,
    CreditCard, Inbox, Key, ImageIcon, Megaphone, Briefcase,
    LayoutDashboard, Settings, Users, Wrench, PenTool
} from 'lucide-react'
import PostsManager from '@/components/PostsManager'
import PagesManager from '@/components/PagesManager'
import NewsletterManager from '@/components/NewsletterManager'
import BrokerInfoForm from '@/components/BrokerInfoForm'
import {
    updateModuleStatus, updateSnowStatusDetail, updateSettings,
    addEvent, uploadDocument, addBoardMember,
    inviteMember, removeMember,
    createResource, deleteResource, deleteDocument, deleteEvent, deleteBoardMember,
    addSponsor, deleteSponsor,
    approveMembershipApplication, rejectMembershipApplication
} from '@/app/actions' // Importera alla actions här

export default function AdminDashboard({ org, slug, currentUser, isOwner }: any) {
    const [activeTab, setActiveTab] = useState('content')

    const tabs = [
        { id: 'content', label: 'Innehåll', icon: PenTool },
        { id: 'tools', label: 'Verktyg', icon: Wrench },
        { id: 'members', label: 'Personer', icon: Users },
        { id: 'settings', label: 'Inställningar', icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm gap-4">
                    <div>
                        <Link href="/dashboard" className="text-gray-500 hover:text-black text-sm mb-2 flex items-center gap-1">
                            <ArrowLeft size={14} /> Tillbaka
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">{org.name}</h1>
                        <p className="text-gray-500 text-sm">Inloggad som {currentUser.email}</p>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href={`http://${org.subdomain}.fornet.se:3000`}
                            target="_blank"
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                        >
                            Visa hemsidan
                        </a>
                    </div>
                </header>

                {/* FLIKAR */}
                <div className="flex overflow-x-auto gap-2 mb-8 bg-white p-2 rounded-xl border border-gray-200 shadow-sm no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-black text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* --- FLIK 1: INNEHÅLL (Skriva och publicera) --- */}
                {activeTab === 'content' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="lg:col-span-2 space-y-10">
                            <PostsManager slug={slug} orgId={org.id} initialPosts={org.posts} />
                            <PagesManager orgId={org.id} subdomain={slug} initialPages={org.pages} />
                            <NewsletterManager orgId={org.id} newsletters={org.newsletters} />
                        </div>

                        <div className="space-y-6">
                            {/* DOKUMENT */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><FileText size={18} /> Dokumentarkiv</h2>
                                <form action={uploadDocument.bind(null, org.id)} className="space-y-2 mb-4">
                                    <input name="title" required placeholder="Namn på fil" className="w-full border rounded p-2 text-sm" />
                                    <input name="file" type="file" required accept=".pdf" className="w-full border rounded p-2 text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                                    <button className="w-full bg-black text-white text-sm py-2 rounded hover:bg-gray-800 transition-colors">Ladda upp PDF</button>
                                </form>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                    {org.documents?.map((d: any) => (
                                        <div key={d.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                            <span className="truncate max-w-[150px]">{d.title}</span>
                                            <form action={deleteDocument.bind(null, d.id)}><button className="text-gray-300 hover:text-red-600 px-2 font-bold">×</button></form>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* KALENDER */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><Calendar size={18} /> Kalender</h2>
                                <form action={addEvent.bind(null, org.id)} className="space-y-2 mb-4 bg-gray-50 p-3 rounded border border-gray-100">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input name="date" type="date" required className="w-full border rounded p-2 text-sm bg-white" />
                                        <input name="title" required placeholder="Händelse (t.ex. Årsmöte)" className="w-full border rounded p-2 text-sm bg-white" />
                                    </div>

                                    {/* NYTT FÄLT HÄR: */}
                                    <input
                                        name="description"
                                        placeholder="Beskrivning (t.ex. Vi bjuder på fika, lokal: Bygdegården)"
                                        className="w-full border rounded p-2 text-sm bg-white"
                                    />

                                    <button className="w-full bg-black text-white text-sm py-2 rounded hover:bg-gray-800 transition-colors font-bold">
                                        Lägg till i kalendern
                                    </button>
                                </form>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
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
                        </div>
                    </div>
                )}

                {/* --- FLIK 2: VERKTYG (Funktioner som är påslagna) --- */}
                {activeTab === 'tools' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        {/* 1. INKORG / FELANMÄLAN */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><Inbox size={18} /> Inkorg & Felanmälan</h2>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                                {org.form_submissions?.filter((s: any) => s.type !== 'membership').map((sub: any) => { // Filtrera bort medlemsansökningar här
                                    const data = typeof sub.data === 'string' ? JSON.parse(sub.data) : sub.data;
                                    return (
                                        <div key={sub.id} className="text-sm border rounded-lg p-3 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                                            <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2">
                                                <span className={`font-bold text-xs uppercase px-2 py-0.5 rounded ${sub.type === 'error_report' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {sub.type === 'error_report' ? '⚠️ Felanmälan' : '📩 Kontakt'}
                                                </span>
                                                <span className="text-[10px] text-gray-400">{new Date(sub.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {data.namn && <p><span className="font-semibold text-gray-700">Namn:</span> {data.namn}</p>}
                                                {data.kontakt && <p><span className="font-semibold text-gray-700">Kontakt:</span> <a href={`mailto:${data.kontakt}`} className="text-blue-600 hover:underline">{data.kontakt}</a></p>}
                                                {data.meddelande && <div className="mt-2 text-gray-600 italic border-l-2 border-gray-300 pl-2">"{data.meddelande}"</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!org.form_submissions || org.form_submissions.filter((s: any) => s.type !== 'membership').length === 0) && <p className="text-xs text-gray-400 italic text-center py-4">Tomt i inkorgen.</p>}
                            </div>
                        </div>

                        {/* 2. BOKNING (Endast om påslaget) */}
                        {org.config?.show_booking && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><Key size={18} /> Bokningsbara Resurser</h2>
                                <form action={createResource.bind(null, org.id)} className="space-y-2 mb-4 border-b border-gray-100 pb-4">
                                    <input name="name" required placeholder="Namn (t.ex. Tvättstuga 1)" className="w-full border rounded p-2 text-sm" />
                                    <input name="description" placeholder="Beskrivning" className="w-full border rounded p-2 text-sm" />
                                    <button className="w-full bg-black text-white text-sm py-2 rounded hover:bg-gray-800 transition-colors">Skapa resurs</button>
                                </form>
                                <div className="space-y-2">
                                    {org.resources?.map((r: any) => (
                                        <div key={r.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                            <span className="font-bold">{r.name}</span>
                                            <form action={deleteResource.bind(null, r.id)}><button className="text-gray-300 hover:text-red-600 px-2 font-bold">×</button></form>
                                        </div>
                                    ))}
                                    {(!org.resources || org.resources.length === 0) && <p className="text-xs text-gray-400 italic">Inga resurser upplagda.</p>}
                                </div>
                            </div>
                        )}

                        {/* 3. DRIFTSTATUS (Endast om påslaget) */}
                        {(org.config?.show_snow_status || org.config?.show_water_status) && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h2 className="font-bold mb-4 text-gray-800">⚙️ Driftstatus</h2>
                                <div className="space-y-4">
                                    {org.config?.show_snow_status && (
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-gray-700">❄️ Vinterväghållning</span>
                                            </div>
                                            <form action={updateSnowStatusDetail.bind(null, slug)} className="flex gap-2">
                                                <select name="status" defaultValue={org.config?.snow_status_text || "Ej åtgärdat"} className="flex-1 text-sm border-gray-300 rounded-md border p-2 bg-white">
                                                    <option value="Ej åtgärdat">Ej åtgärdat</option>
                                                    <option value="Pågår">🚜 Plogbil kör nu</option>
                                                    <option value="Plogat">✅ Endast Plogat</option>
                                                    <option value="Plogat & Sandat">✨ Plogat & Sandat</option>
                                                </select>
                                                <button className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-blue-700">Spara</button>
                                            </form>
                                        </div>
                                    )}
                                    {org.config?.show_water_status && (
                                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <span className="font-medium text-gray-700">💧 Sommarvatten</span>
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Påsläppt</span>
                                            {/* Enkel status switch, kan byggas ut om man vill ha mer detaljer */}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 4. MÄKLARINFO (Endast om påslaget) */}
                        {org.config?.show_broker_info && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                                <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><Briefcase size={20} /> Mäklarinfo</h2>
                                <BrokerInfoForm slug={slug} orgId={org.id} initialContent={org.broker_info} />
                            </div>
                        )}
                    </div>
                )}

                {/* --- FLIK 3: PERSONER (Medlemmar & Styrelse) --- */}
                {activeTab === 'members' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        {/* 1. ANSÖKNINGAR */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500 lg:col-span-2">
                            <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
                                <User size={20} className="text-blue-600" /> Nya ansökningar
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {org.form_submissions?.filter((sub: any) => sub.type === 'membership').map((sub: any) => {
                                    const data = typeof sub.data === 'string' ? JSON.parse(sub.data) : sub.data;
                                    return (
                                        <div key={sub.id} className="border border-blue-100 bg-blue-50/30 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-gray-900">{data.firstname} {data.lastname}</h4>
                                                <div className="flex gap-2">
                                                    <form action={rejectMembershipApplication.bind(null, sub.id)}>
                                                        <button className="text-xs bg-white border px-2 py-1 rounded hover:bg-red-50 text-red-600">Neka</button>
                                                    </form>
                                                    <form action={approveMembershipApplication.bind(null, sub.id, org.id, data.email)}>
                                                        <button className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Godkänn</button>
                                                    </form>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-600">{data.email}</p>
                                            <p className="text-xs text-gray-500 mt-1">{data.address}</p>
                                        </div>
                                    )
                                })}
                                {!org.form_submissions?.some((sub: any) => sub.type === 'membership') && <p className="text-sm text-gray-400 italic col-span-full text-center py-4">Inga nya ansökningar.</p>}
                            </div>
                        </div>

                        {/* 2. MEDLEMSREGISTER */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-bold flex items-center gap-2 text-gray-800"><Users size={18} /> Medlemsregister</h2>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold">
                                    {org.organization_members?.filter((m: any) => m.role === 'member').length} st
                                </span>
                            </div>
                            <div className="space-y-1 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {org.organization_members?.filter((m: any) => m.role === 'member').map((m: any) => (
                                    <div key={m.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded group">
                                        <span className="truncate max-w-[200px]">{m.email}</span>
                                        <form action={removeMember.bind(null, m.id)}>
                                            <button className="text-gray-300 hover:text-red-600 px-2 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                        </form>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. STYRELSE (Publik) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><Shield size={18} /> Styrelsen (Visas publikt)</h2>
                            <form action={addBoardMember.bind(null, org.id)} className="space-y-2 mb-4 bg-gray-50 p-3 rounded">
                                <div className="grid grid-cols-2 gap-2">
                                    <input name="name" required placeholder="Namn" className="w-full border rounded p-2 text-sm bg-white" />
                                    <input name="role" required placeholder="Roll" className="w-full border rounded p-2 text-sm bg-white" />
                                </div>
                                <input name="email" placeholder="Email (valfritt)" className="w-full border rounded p-2 text-sm bg-white" />
                                <button className="w-full bg-gray-900 text-white text-xs font-bold py-2 rounded">Lägg till i styrelsen</button>
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

                        {/* 4. ADMINS */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800"><Lock size={18} /> Administratörer (Behöriga)</h2>
                            <form action={inviteMember.bind(null, org.id)} className="flex gap-2 mb-4">
                                <input name="email" required type="email" placeholder="Email" className="w-full border rounded p-2 text-sm" />
                                <button className="bg-black text-white text-xs px-3 rounded">Bjud in</button>
                            </form>
                            <div className="space-y-2">
                                {org.organization_members?.filter((m: any) => m.role === 'admin' || m.role === 'owner').map((m: any) => (
                                    <div key={m.id} className="flex justify-between items-center text-sm">
                                        <span className="truncate">{m.email}</span>
                                        {m.user_id === org.owner_id ? <span className="text-[10px] bg-purple-100 text-purple-700 px-2 rounded">Ägare</span> :
                                            (isOwner && <form action={removeMember.bind(null, m.id)}><button className="text-red-500 px-2">×</button></form>)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 5. SPONSORER */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                            <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800">💰 Sponsorer</h2>
                            <form action={addSponsor.bind(null, org.id)} className="space-y-3 mb-6 bg-gray-50 p-4 rounded border border-gray-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <input name="name" required placeholder="Företagsnamn" className="w-full border rounded p-2 text-sm bg-white" />
                                    <input name="website_url" placeholder="Länk (t.ex. stadium.se)" className="w-full border rounded p-2 text-sm bg-white" />
                                </div>
                                <input name="logo" type="file" required accept="image/*" className="text-xs" />
                                <button className="bg-black text-white text-xs px-4 py-2 rounded">Lägg till</button>
                            </form>
                            <div className="flex flex-wrap gap-4">
                                {org.sponsors?.map((s: any) => (
                                    <div key={s.id} className="flex items-center gap-2 bg-white border p-2 rounded shadow-sm">
                                        <img src={s.logo_url} className="h-8 w-auto object-contain" />
                                        <span className="text-xs font-bold">{s.name}</span>
                                        <form action={deleteSponsor.bind(null, s.id)}><button className="text-gray-400 hover:text-red-600 px-1">×</button></form>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- FLIK 4: INSTÄLLNINGAR --- */}
                {activeTab === 'settings' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        {/* 1. AKTIVERA/INAKTIVERA MODULER */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="font-bold mb-4 text-gray-800">🧩 Funktioner & Meny</h2>
                            <p className="text-xs text-gray-500 mb-4">Slå på/av funktioner beroende på vad ni behöver.</p>

                            <div className="space-y-2">
                                {[
                                    { key: 'show_news', label: 'Nyhetsflöde' },
                                    { key: 'show_booking', label: 'Bokning' },
                                    { key: 'show_documents', label: 'Dokumentarkiv' },
                                    { key: 'show_calendar_widget', label: 'Kalender-widget' },
                                    { key: 'show_board', label: 'Styrelse-sida' },
                                    { key: 'show_contact_widget', label: 'Felanmälan & Kontakt' },
                                    { key: 'show_snow_status', label: 'Snö/Plog-status' },
                                    { key: 'show_water_status', label: 'Vattenstatus' },
                                    { key: 'show_broker_info', label: 'Mäklarinformation' },
                                    { key: 'show_membership_form', label: 'Bli Medlem (Ansökan)' },
                                    { key: 'show_waste_sorting', label: 'Sopsortering (Länk)' },
                                ].map((mod) => (
                                    <div key={mod.key} className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded">
                                        <span className="text-sm">{mod.label}</span>
                                        <form action={async () => {
                                            // Vi måste göra detta client-side kompatibelt i action-anropet, men här kör vi inline server action wrapper
                                            await updateModuleStatus(slug, mod.key, !org.config?.[mod.key])
                                        }}>
                                            <button className={`w-9 h-5 rounded-full relative transition-colors ${org.config?.[mod.key] ? 'bg-green-600' : 'bg-gray-300'}`}>
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${org.config?.[mod.key] ? 'left-5' : 'left-1'}`}></div>
                                            </button>
                                        </form>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. GRUNDINSTÄLLNINGAR */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="font-bold mb-4 text-gray-800">🔧 Grundinställningar</h2>
                            <form action={updateSettings.bind(null, slug)}>
                                {/* ALERT */}
                                <div className="mb-6 bg-yellow-50 p-4 rounded border border-yellow-100">
                                    <label className="text-xs font-bold text-yellow-800 block mb-1 uppercase">Viktigt meddelande (Alert)</label>
                                    <input name="alert_message" defaultValue={org.alert_message || ''} placeholder="T.ex. Vattnet stängs av imorgon" className="w-full border rounded p-2 text-sm mb-2" />
                                    <select name="alert_level" defaultValue={org.alert_level || 'warning'} className="w-full border rounded p-2 text-sm bg-white">
                                        <option value="info">🔵 Info</option>
                                        <option value="warning">🟡 Varning</option>
                                        <option value="critical">🔴 Kritisk</option>
                                    </select>
                                </div>

                                {/* HEADER TEXT */}
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Rubrik på startsidan</label>
                                    <input name="header_text" defaultValue={org.header_text || ''} placeholder={`Välkommen till ${org.name}`} maxLength={40} className="w-full border rounded p-2 text-sm" />
                                </div>

                                <div className="mb-4">
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Underrubrik</label>
                                    <textarea name="subheader_text" defaultValue={org.subheader_text || ''} placeholder="Här hittar du nyheter..." maxLength={150} rows={2} className="w-full border rounded p-2 text-sm resize-none" />
                                </div>

                                {/* BILDER */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 block mb-1">Omslagsbild (Hero)</label>
                                        <input type="file" name="hero_image" accept="image/*" className="text-xs w-full" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 block mb-1">Karta</label>
                                        <input type="file" name="map_image" accept="image/*" className="text-xs w-full" />
                                    </div>
                                </div>

                                {/* ÖVRIGT */}
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Swish-nummer</label>
                                    <input name="swish_number" defaultValue={org.swish_number || ''} placeholder="123 456 78 90" className="w-full border rounded p-2 text-sm" />
                                </div>

                                <div className="mb-4">
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Lösenordsskydd</label>
                                    <input name="site_password" defaultValue={org.site_password || ''} placeholder="Lämna tomt för öppen sida" type="text" className="w-full border rounded p-2 text-sm" />
                                </div>

                                <button className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800">Spara inställningar</button>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}