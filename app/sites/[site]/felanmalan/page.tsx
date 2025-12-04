import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import PublicForm from '@/components/PublicForm';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function ErrorReportPage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  
  const { data: org } = await supabase.from('organizations').select('id, name').eq('subdomain', site).single();

  if (!org) return <div>404</div>;

  return (
    <main className="min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-8 transition-colors">
            <ArrowLeft size={16} /> Tillbaka
        </Link>

        <div className="text-center mb-10">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <AlertTriangle size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Felanmälan</h1>
            <p className="text-gray-500">
                Upptäckt något trasigt? Skicka in en rapport direkt.
            </p>
        </div>

        {/* FIX: Tog bort den extra vita containern här. PublicForm har sin egen design. */}
        <PublicForm orgId={org.id} type="error_report" title="Beskriv problemet" />

        {/* Info-box */}
        <div className="mt-8 bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
            <CheckCircle2 className="text-blue-600 flex-shrink-0" size={20} />
            <div className="text-sm text-blue-800">
                <p className="font-bold mb-1">Vad händer sen?</p>
                <p>Din anmälan skickas direkt till ansvariga. Vi återkommer till dig om vi behöver mer information.</p>
            </div>
        </div>

      </div>
    </main>
  );
}