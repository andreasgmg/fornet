import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import AdminDashboard from '@/components/AdminDashboard'; // Importera vår nya komponent

// Tvinga sidan att alltid hämtas på nytt (ingen cache för admin)
export const dynamic = 'force-dynamic';

export default async function OrgAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Hämta inloggad användare
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // 2. Hämta all data
  // Vi hämtar ALLT här och skickar det som en prop till AdminDashboard
  const { data: org } = await supabase
    .from('organizations')
    .select('*, posts(*), documents(*), events(*), board_members(*), organization_members(*), resources(*), pages(*), form_submissions(*), sponsors(*), newsletters(*)')
    .eq('subdomain', slug)
    .order('created_at', { foreignTable: 'posts', ascending: false })
    .single();

  if (!org) return <div className="p-10">Föreningen hittades inte.</div>;

  // 3. SÄKERHETSKOLL
  const isMember = org.organization_members.some((m: any) => m.user_id === currentUser?.id);
  const isOwner = org.owner_id === currentUser?.id;

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

  // 4. RENDERA DASHBOARD-KOMPONENTEN
  return (
    <AdminDashboard 
        org={org} 
        slug={slug} 
        currentUser={currentUser} 
        isOwner={isOwner} 
    />
  );
}