import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import Link from 'next/link';
import BookingForm from '@/components/BookingForm'; // Vi skapar denna strax

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function BookingPage({ params, searchParams }: { params: Promise<{ site: string }>, searchParams: Promise<{ date?: string }> }) {
  const { site } = await params;
  const { date } = await searchParams;
  
  // Standard datum = Idag
  const selectedDate = date || new Date().toISOString().split('T')[0];

  // Hämta org, resurser och bokningar för VALT datum
  const { data: org } = await supabase
    .from('organizations')
    .select(`
        *, 
        resources(
            *,
            bookings(*)
        )
    `)
    .eq('subdomain', site)
    .single(); // Vi filtrerar datum i JS för enkelhetens skull i MVP

  if (!org) return <div>404</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-black flex items-center gap-1 mb-4"><ArrowLeft size={14}/> Tillbaka till startsidan</Link>
        <h1 className="text-4xl font-bold text-gray-900">Boka</h1>
        <p className="text-gray-500 mt-2">Välj datum för att se lediga tider.</p>
      </div>

      {/* Datumväljare (Enkel navigering via URL params) */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-8 flex items-center gap-4">
        <span className="font-bold text-gray-700">📅 Välj datum:</span>
        <form className="flex gap-2">
            <input 
                type="date" 
                name="date" 
                defaultValue={selectedDate}
                className="border rounded p-2 text-sm"
            />
            <button className="bg-black text-white px-4 py-2 rounded text-sm font-bold">Visa</button>
        </form>
      </div>

      <div className="grid gap-8">
        {org.resources?.map((resource: any) => {
            // Filtrera bokningar för vald dag
            const todaysBookings = resource.bookings?.filter((b: any) => b.start_time.startsWith(selectedDate));
            // Sortera tidigt till sent
            todaysBookings.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));

            return (
                <div key={resource.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">{resource.name}</h3>
                            <p className="text-xs text-gray-500">{resource.description}</p>
                        </div>
                        <div className="text-xs bg-white px-2 py-1 rounded border text-gray-500">
                            {todaysBookings.length} bokningar
                        </div>
                    </div>

                    <div className="p-6 grid md:grid-cols-2 gap-8">
                        {/* Vänster: Lista på bokningar */}
                        <div>
                            <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wide">Bokade tider</h4>
                            <div className="space-y-2">
                                {todaysBookings.length > 0 ? todaysBookings.map((b: any) => (
                                    <div key={b.id} className="flex items-center gap-3 text-sm bg-red-50 text-red-900 p-2 rounded border border-red-100">
                                        <Clock size={16} className="text-red-400"/>
                                        <span className="font-mono font-bold">
                                            {b.start_time.split('T')[1].substring(0,5)} - {b.end_time.split('T')[1].substring(0,5)}
                                        </span>
                                        <span className="text-red-700 opacity-75 truncate flex-1 text-right">
                                            {b.user_name}
                                        </span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100">
                                        Inga bokningar än. Allt är ledigt! 🟢
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Höger: Bokningsformulär */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wide">Gör en bokning</h4>
                            {/* Vi bryter ut formuläret till en Client Component för feedback */}
                            <BookingForm 
                                resourceId={resource.id} 
                                date={selectedDate} 
                            />
                        </div>
                    </div>
                </div>
            )
        })}
        
        {org.resources?.length === 0 && (
            <div className="text-center py-12 text-gray-400">Inga bokningsbara resurser upplagda.</div>
        )}
      </div>
    </div>
  );
}