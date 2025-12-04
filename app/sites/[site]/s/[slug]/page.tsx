import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function CustomPage({ params }: { params: Promise<{ site: string; slug: string }> }) {
  const { site, slug } = await params;
  
  // Hämta sidan + kolla att den tillhör rätt org
  const { data: page } = await supabase
    .from('pages')
    .select('*, organizations!inner(subdomain)')
    .eq('slug', slug)
    .eq('organizations.subdomain', site)
    .single();

  if (!page) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
        <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }} 
        />
    </div>
  );
}