import { createClient } from '@supabase/supabase-js';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import PasswordGate from '@/components/PasswordGate';
import SiteHeader from '@/components/SiteHeader'; // <--- Din nya hamburgermeny-komponent

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = { children: React.ReactNode; params: Promise<{ site: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { site } = await params;
  const { data: org } = await supabase.from('organizations').select('name').eq('subdomain', site).single();
  return { title: org ? org.name : 'Förening' };
}

export default async function SiteLayout({ children, params }: Props) {
  const { site } = await params;
  
  // Hämta org, config OCH pages för menyn
  const { data: org } = await supabase
    .from('organizations')
    .select('name, subdomain, site_password, config, pages(title, slug)')
    .eq('subdomain', site)
    .single();

  if (!org) return <div>Laddar...</div>;

  // Lås-logik
  if (org.site_password) {
    const cookieStore = await cookies();
    if (cookieStore.get(`access_${site}`)?.value !== 'true') return <PasswordGate subdomain={site} />;
  }

  const config = org.config || {};

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F8F9FA] text-slate-900">
      
      {/* HEADER MED HAMBURGERMENY */}
      {/* Vi skickar in org och config så menyn vet vilka länkar som ska visas */}
      <SiteHeader org={org} config={config} />

      <div className="pt-16 flex-grow px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
            {children}
        </div>
      </div>

      <footer className="mt-20 border-t border-slate-200 bg-white py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="font-bold text-slate-900 mb-2">{org.name}</p>
            <p className="text-sm text-slate-400">
                Driven av <a href="https://fornet.se" className="hover:text-slate-600 transition-colors">Fornet.se</a>
            </p>
        </div>
      </footer>
    </div>
  );
}