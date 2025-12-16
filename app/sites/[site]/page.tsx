import { createClient } from '@/lib/pocketbase';
import Link from 'next/link';
// NYTT: Importera Target-ikonen
import { Snowflake, Droplets, MapPin, Calendar, ArrowRight, FileText, Key, AlertTriangle, ChevronRight, Info, Recycle, Briefcase, UserPlus, Target } from 'lucide-react';
import PublicForm from '@/components/PublicForm';

// Tvinga uppdatering så bilder/status syns direkt
export const revalidate = 0;

const themeGradients: Record<string, string> = {
  green: "from-emerald-900 via-emerald-800 to-green-600",
  blue: "from-slate-900 via-blue-900 to-blue-600",
  red: "from-red-900 via-rose-800 to-rose-600",
  yellow: "from-yellow-900 via-amber-700 to-amber-500",
  gray: "from-gray-900 via-gray-800 to-gray-600",
};

const StatusAlert = ({ icon: Icon, title, status, colorBg, colorText }: any) => (
  <div className={`${colorBg} ${colorText} px-4 py-2 md:py-3 flex items-center justify-center gap-2 md:gap-3 text-xs md:text-sm font-bold shadow-sm relative z-20 rounded-b-lg mb-4`}>
    <Icon size={16} className="md:w-5 md:h-5" />
    <span>{title}: {status}</span>
  </div>
);

const QuickAction = ({ icon: Icon, title, href, colorClass }: any) => (
  <Link href={href} className="group flex flex-col items-center justify-center bg-white border border-gray-100 p-3 md:p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all text-center h-full relative overflow-hidden active:scale-95">
    <div className={`absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300`}>
      <ArrowRight size={16} />
    </div>
    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-3 ${colorClass} group-hover:scale-110 transition-transform`}>
      <Icon size={20} className="md:w-6 md:h-6" />
    </div>
    <span className="font-bold text-slate-800 text-xs md:text-sm group-hover:text-blue-600 transition-colors leading-tight">{title}</span>
  </Link>
)

export default async function TenantPage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  const pb = await createClient();

  let org;
  try {
    org = await pb.collection('organizations').getFirstListItem(`subdomain="${site}"`, {
      expand: 'posts,events,sponsors',
      sort: '-posts.created' // Sortering kan behöva göras klient-side eller via view i PB
    });
  } catch (e) {
    return <div className="p-10 text-center">404 - Föreningen hittades inte</div>;
  }

  const posts = org.expand?.posts || [];
  const events = org.expand?.events || [];
  const sponsors = org.expand?.sponsors || [];

  const config = org.config || {};
  const themeClass = themeGradients[org.theme_color] || themeGradients.gray;
  const sortedEvents = org.events?.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  // LOGIK FÖR STATUS-VARNING
  const isHunt = org.type === 'hunt';
  const showStatus = config.show_snow_status && config.snow_status_text &&
    (isHunt ? config.snow_status_text !== 'Ingen jakt' : (config.snow_status_text !== 'Ej åtgärdat' && config.snow_status_text !== 'Plogat & Sandat'));

  return (
    <main className="pb-20 bg-slate-50 min-h-screen">

      {showStatus && (
        isHunt ? (
          // JAKT-VARIANT
          <StatusAlert icon={Target} title="Jaktstatus" status={config.snow_status_text} colorBg="bg-orange-100" colorText="text-orange-900" />
        ) : (
          // SNÖ-VARIANT
          <StatusAlert icon={Snowflake} title="Vinterväghållning" status={config.snow_status_text} colorBg="bg-yellow-100" colorText="text-yellow-800" />
        )
      )}

      {org.alert_message && (
        <div className={`w-full px-4 py-3 flex items-center justify-center gap-2 text-sm font-bold shadow-sm relative z-50 ${org.alert_level === 'critical' ? 'bg-red-600 text-white' :
          org.alert_level === 'info' ? 'bg-blue-600 text-white' :
            'bg-yellow-100 text-yellow-800' // Default warning
          }`}>
          <AlertTriangle size={16} /> {org.alert_message}
        </div>
      )}

      {/* HERO SECTION */}
      <header className="relative bg-gray-900 text-white overflow-hidden pb-12 md:pb-32 -mx-4 md:-mx-6 rounded-b-[1.5rem] md:rounded-b-[3rem] shadow-lg mb-6 md:mb-12">
        <div className="absolute inset-0 z-0">
          {org.hero_image_url ? (
            <>
              <img src={org.hero_image_url} alt="Hero" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent"></div>
            </>
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${themeClass}`}></div>
          )}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 md:pt-32 text-center md:text-left">
          <h1 className="text-3xl md:text-6xl font-extrabold tracking-tight mb-2 md:mb-4 drop-shadow-md text-white leading-tight">
            {org.header_text || org.name}
          </h1>
          <p className="text-sm md:text-lg text-gray-200 max-w-xl leading-relaxed font-medium hidden md:block">
            {org.subheader_text || "Här hittar du nyheter, bokning och driftinformation för oss som bor i området."}
          </p>
        </div>
      </header>

      {/* QUICK ACTIONS */}
      <div className="max-w-6xl mx-auto px-3 md:px-6 relative z-20 -mt-8 md:-mt-24 mb-8 md:mb-16">
        {/* Ändrat från grid till flex wrap + center för att hantera få knappar snyggare */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {config.show_booking && <div className="w-[48%] md:w-[23%]"><QuickAction icon={Key} title="Boka tid" href="/boka" colorClass="bg-blue-50 text-blue-600" /></div>}
          {config.show_documents && <div className="w-[48%] md:w-[23%]"><QuickAction icon={FileText} title="Dokument" href="/dokument" colorClass="bg-purple-50 text-purple-600" /></div>}
          {config.show_contact_widget && <div className="w-[48%] md:w-[23%]"><QuickAction icon={AlertTriangle} title="Felanmälan" href="/felanmalan" colorClass="bg-orange-50 text-orange-600" /></div>}
          {config.show_calendar_qlink && <div className="w-[48%] md:w-[23%]"><QuickAction icon={Calendar} title="Kalender" href="/kalender" colorClass="bg-green-50 text-green-600" /></div>}
          {config.show_waste_sorting && <div className="w-[48%] md:w-[23%]"><QuickAction icon={Recycle} title="Sopsortering" href="/s/sopsortering" colorClass="bg-green-50 text-green-600" /></div>}
          {config.show_broker_info && <div className="w-[48%] md:w-[23%]"><QuickAction icon={Briefcase} title="Mäklarinfo" href="/maklarinfo" colorClass="bg-gray-100 text-gray-700" /></div>}

          {/* NYTT: Lägg till Bli Medlem här också om det är påslaget! */}
          {config.show_membership_form && <div className="w-[48%] md:w-[23%]"><QuickAction icon={UserPlus} title="Bli Medlem" href="/bli-medlem" colorClass="bg-blue-50 text-blue-600" /></div>}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 md:px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">

        <div className="lg:col-span-2">

          {/* Driftstatus - WIDGETAR OM DE INTE VISAS I TOPPEN */}
          {(config.show_snow_status || config.show_water_status) && !showStatus && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
              {config.show_snow_status && (
                <div className="bg-white border border-gray-200 p-3 md:p-4 rounded-xl flex items-center gap-3 shadow-sm">
                  <div className={`p-2 md:p-2.5 rounded-lg ${isHunt ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                    {isHunt ? <Target size={18} /> : <Snowflake size={18} />}
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      {isHunt ? 'Jaktstatus' : 'Vinterväghållning'}
                    </div>
                    <div className="font-semibold text-gray-800 text-sm">{config.snow_status_text || "Ingen info"}</div>
                  </div>
                </div>
              )}
              {config.show_water_status && (
                <div className="bg-white border border-gray-200 p-3 md:p-4 rounded-xl flex items-center gap-3 shadow-sm">
                  <div className="bg-cyan-50 text-cyan-600 p-2 md:p-2.5 rounded-lg"><Droplets size={18} /></div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sommarvatten</div>
                    <div className="font-semibold text-gray-800 text-sm">{config.show_water_status ? "Påsläppt" : "Avstängt"}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-4 md:mb-6 px-1">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
              Senaste nytt
            </h2>
          </div>

          <div className="space-y-4 md:space-y-6">
            {org.posts?.map((post: any) => (
              // FIX: Tog bort <Link> runt hela kortet. Använder "group" och "relative" istället.
              <article key={post.id} className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col h-full">

                {/* Metadata */}
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Nyhet</span>
                  <span>•</span>
                  <time>{new Date(post.created_at).toLocaleDateString('sv-SE')}</time>
                </div>

                {/* Rubrik med "Stretched Link" */}
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                  {/* Länken ligger här, men täcker hela kortet via CSS */}
                  <Link href={`/p/${post.id}`} className="after:absolute after:inset-0 focus:outline-none">
                    {post.title}
                  </Link>
                </h3>

                {/* Innehåll (Ligger nu utanför a-taggen) */}
                <div className="prose prose-sm prose-slate text-gray-600 line-clamp-6 mb-6 prose-img:w-full prose-img:rounded-lg prose-iframe:w-full prose-iframe:rounded-lg flex-grow" dangerouslySetInnerHTML={{ __html: post.content }} />

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-start">
                  <span className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors text-sm group-hover:translate-x-1">
                    Läs mer <ChevronRight size={16} />
                  </span>
                </div>
              </article>
            ))}

            {(!org.posts || org.posts.length === 0) && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <Info className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-gray-500">Inga nyheter publicerade ännu.</p>
              </div>
            )}
          </div>
        </div>

        {/* HÖGER SPALT: WIDGETS */}
        <aside className="space-y-6 md:space-y-8">

          {config.show_calendar_widget && (
            <div id="kalender" className="bg-white border border-slate-200 p-5 md:p-6 rounded-2xl shadow-sm md:top-24">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900">📅 Kalender</h3>
              <div className="space-y-3">
                {sortedEvents.length > 0 ? sortedEvents.map((event: any) => (
                  <div key={event.id} className="flex gap-3 items-start group">
                    <div className="bg-gray-50 text-gray-600 rounded-lg p-2 text-center min-w-[50px] border border-gray-100 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                      <span className="block text-[10px] font-bold uppercase tracking-wider">{new Date(event.date).toLocaleDateString('sv-SE', { month: 'short' }).replace('.', '')}</span>
                      <span className="block text-lg font-bold leading-none">{new Date(event.date).getDate()}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm leading-tight">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-400 italic py-2">Inga kommande händelser.</p>
                )}
              </div>
            </div>
          )}

          {org.map_image_url && config.show_map_widget && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold mb-3 text-xs text-slate-500 uppercase flex items-center gap-1">
                <MapPin size={12} /> Områdeskarta
              </h3>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 cursor-pointer group">
                <img src={org.map_image_url} alt="Karta" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          )}

          {org.swish_number && config.show_swish_widget && (
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-6 rounded-2xl shadow-sm text-center">
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm">
                <span className="font-black italic text-[10px] text-gray-900">Swish</span>
              </div>
              <div className="font-mono text-xl font-bold tracking-tight text-gray-900 mb-1">{org.swish_number}</div>
              <div className="text-xs text-gray-500 font-medium">{org.swish_message}</div>
            </div>
          )}

          {config.show_contact_widget && (
            <div id="kontakt" className="scroll-mt-24">
              <PublicForm orgId={org.id} type="contact" title="📩 Kontakta Styrelsen" />
            </div>
          )}

          {/* SPONSOR-WIDGET */}
          {org.sponsors && org.sponsors.length > 0 && (
            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm text-center">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Stolta samarbetspartners</h3>
              <div className="flex flex-wrap justify-center gap-6 items-center grayscale hover:grayscale-0 transition-all duration-500">
                {org.sponsors.map((s: any) => {
                  // FIX: Samma länk-logik här
                  const safeUrl = s.website_url && !s.website_url.startsWith('http')
                    ? `https://${s.website_url}`
                    : s.website_url;

                  return (
                    <a
                      key={s.id}
                      href={safeUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block transition-transform hover:scale-105 ${!safeUrl ? 'cursor-default pointer-events-none' : ''}`}
                    >
                      <img src={s.logo_url} alt={s.name} className="max-h-12 max-w-[100px] object-contain opacity-70 hover:opacity-100 transition-opacity" />
                    </a>
                  )
                })}
              </div>
            </div>
          )}

        </aside>

      </div>
    </main>
  );
}