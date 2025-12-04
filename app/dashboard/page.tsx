import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, ExternalLink } from 'lucide-react';
import { claimInvites } from '../actions'; // Importera från app/actions.ts
import SignOutButton from '@/components/SignOutButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Koppla ihop inbjudningar
  await claimInvites();

  // 2. Hämta mina föreningar via members-tabellen
  const { data: members } = await supabase
    .from('organization_members')
    .select('role, organizations(*)')
    .eq('user_id', user.id);

  // Filtrera ut eventuella null-värden
  const orgs = members?.map(m => m.organizations).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mina Föreningar</h1>
                <p className="text-gray-500">Inloggad som <span className="font-medium text-gray-900">{user.email}</span></p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/dashboard/new" className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                <Plus size={16} /> Ny förening
              </Link>
              <SignOutButton />
            </div>
        </header>
        
        {/* GRID MED FÖRENINGAR */}
        <div className="grid gap-6">
          {orgs.map((org: any) => (
            <div key={org.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start">
                
                {/* VÄNSTER: Info */}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Link href={`/dashboard/${org.subdomain}`} className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                      {org.name}
                    </Link>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border
                      ${org.type === 'road' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                        org.type === 'allotment' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`
                    }>
                      {org.type}
                    </span>
                  </div>
                  
                  <a 
                    href={`http://${org.subdomain}.fornet.se:3000`} 
                    target="_blank" 
                    className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                  >
                    {org.subdomain}.fornet.se <ExternalLink size={12} />
                  </a>
                </div>

                {/* HÖGER: Action */}
                <Link 
                    href={`/dashboard/${org.subdomain}`}
                    className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-sm"
                >
                    Hantera
                </Link>
              </div>
            </div>
          ))}

          {/* EMPTY STATE */}
          {orgs.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Inga föreningar än</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">Du har inte kopplats till några föreningar än.</p>
                <Link 
                  href="/dashboard/new"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition-colors inline-block"
                >
                    Starta ny förening
                </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}