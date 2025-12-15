import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MembershipForm from '@/components/MembershipForm';

export const revalidate = 0;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function MembershipPage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  const { data: org } = await supabase.from('organizations').select('id, name').eq('subdomain', site).single();

  if (!org) return <div>404</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-8 transition-colors">
            <ArrowLeft size={16} /> Tillbaka
        </Link>

        <MembershipForm orgId={org.id} />
    </div>
  );
}