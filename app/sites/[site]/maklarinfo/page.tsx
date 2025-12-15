import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, Briefcase } from 'lucide-react';

export const revalidate = 0;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function BrokerInfoPage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  const { data: org } = await supabase.from('organizations').select('name, broker_info').eq('subdomain', site).single();

  if (!org) return <div>404</div>;

  return (
    <main className="min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 py-12">

        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-8 transition-colors">
          <ArrowLeft size={16} /> Tillbaka
        </Link>

        <div className="mb-10 pb-8 border-b border-gray-100">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Briefcase size={28} />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Mäklarinformation</h1>
          <p className="text-lg text-gray-500">
            Information för mäklare och spekulanter i {org.name}.
          </p>
        </div>

        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          {org.broker_info ? (
            // FIX: Använd dangerouslySetInnerHTML för att visa HTML från editorn korrekt
            <div dangerouslySetInnerHTML={{ __html: org.broker_info }} />
          ) : (
            <p className="italic text-gray-400">Ingen information inlagd ännu.</p>
          )}
        </div>

      </div>
    </main>
  );
}