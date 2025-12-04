import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function CalendarPage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  const { data: org } = await supabase.from('organizations').select('*, events(*)').eq('subdomain', site).single();

  if (!org) return <div>404</div>;

  const events = org.events?.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  return (
    <main className="min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        
        <div className="mb-10">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-6 transition-colors">
                <ArrowLeft size={16} /> Tillbaka
            </Link>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-green-100 text-green-700 rounded-xl"><Calendar size={24}/></div>
                <h1 className="text-3xl font-bold text-gray-900">Kalender</h1>
            </div>
            <p className="text-gray-500 text-lg">Kommande händelser och aktiviteter.</p>
        </div>

        <div className="space-y-4">
            {events.length > 0 ? events.map((event: any) => {
                const dateObj = new Date(event.date);
                const isPast = dateObj < new Date();
                
                return (
                    <div key={event.id} className={`bg-white p-5 rounded-2xl border ${isPast ? 'border-gray-100 opacity-60' : 'border-gray-200 shadow-sm'} flex gap-5 items-start transition-all`}>
                        <div className="flex-shrink-0 flex flex-col items-center justify-center bg-gray-50 border border-gray-100 w-16 h-16 rounded-xl text-center">
                            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                                {dateObj.toLocaleDateString('sv-SE', { month: 'short' }).replace('.', '')}
                            </span>
                            <span className="text-2xl font-black text-gray-900 leading-none">
                                {dateObj.getDate()}
                            </span>
                        </div>

                        <div className="flex-grow pt-1">
                            <h3 className={`text-lg font-bold ${isPast ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {event.title}
                            </h3>
                            
                            <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500 font-medium">
                                <span>{dateObj.toLocaleDateString('sv-SE', { weekday: 'long' })}</span>
                            </div>

                            {event.description && (
                                <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                                    {event.description}
                                </p>
                            )}
                        </div>
                    </div>
                );
            }) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                    <Calendar size={40} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Inga planerade aktiviteter just nu.</p>
                </div>
            )}
        </div>

      </div>
    </main>
  );
}