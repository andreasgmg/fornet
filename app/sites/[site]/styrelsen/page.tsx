import { createClient } from '@supabase/supabase-js';
import { User, Phone, Mail, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function BoardPage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  const { data: org } = await supabase.from('organizations').select('*, board_members(*)').eq('subdomain', site).single();

  if (!org) return <div>404</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      
      <div className="mb-10">
        <Link href="/" className="text-sm text-gray-500 hover:text-black flex items-center gap-1 mb-6"><ArrowLeft size={14}/> Tillbaka</Link>
        <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl"><Shield size={24}/></div>
            <h1 className="text-3xl font-bold text-gray-900">Styrelsen</h1>
        </div>
        <p className="text-gray-500 text-lg">Personerna som ansvarar för föreningens drift.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {org.board_members?.map((member: any) => (
          <div key={member.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-full text-gray-500">
                    <User size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-900 leading-tight">{member.name}</h3>
                    <p className="text-blue-600 font-medium text-sm">{member.role}</p>
                </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-gray-50 mt-auto">
              {member.email && (
                <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black hover:bg-gray-50 p-1.5 -ml-1.5 rounded transition-colors">
                  <Mail size={16} className="text-gray-400" /> {member.email}
                </a>
              )}
              {member.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 p-1.5 -ml-1.5">
                  <Phone size={16} className="text-gray-400" /> {member.phone}
                </div>
              )}
            </div>
          </div>
        ))}
        {(!org.board_members || org.board_members.length === 0) && (
             <div className="col-span-full text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                <User className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Ingen styrelse registrerad än.</p>
            </div>
        )}
      </div>
    </div>
  );
}