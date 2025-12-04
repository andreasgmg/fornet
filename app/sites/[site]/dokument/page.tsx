import { createClient } from '@supabase/supabase-js';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function DocumentsPage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  const { data: org } = await supabase.from('organizations').select('*, documents(*)').eq('subdomain', site).single();
  
  if (!org) return <div>404</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      
      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-black flex items-center gap-1 mb-6"><ArrowLeft size={14}/> Tillbaka</Link>
        <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-xl"><FileText size={24}/></div>
            <h1 className="text-3xl font-bold text-gray-900">Dokument</h1>
        </div>
        <p className="text-gray-500 text-lg">Protokoll, stadgar och årsredovisningar.</p>
      </div>
      
      <div className="grid gap-3 md:gap-4">
        {org.documents?.map((doc: any) => (
          <a key={doc.id} href={doc.file_url} target="_blank" className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="bg-gray-50 p-2.5 rounded-lg text-gray-500 group-hover:text-purple-600 group-hover:bg-purple-50 transition-colors">
                <FileText size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 truncate pr-4">{doc.title}</h3>
                <p className="text-xs text-gray-500">PDF • {(doc.size / 1024).toFixed(0)} KB • {new Date(doc.created_at).toLocaleDateString('sv-SE')}</p>
              </div>
            </div>
            <div className="text-purple-600 bg-purple-50 p-2 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Download size={18} />
            </div>
          </a>
        ))}
        {(!org.documents || org.documents.length === 0) && (
            <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                <FileText className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Inga dokument uppladdade än.</p>
            </div>
        )}
      </div>
    </div>
  );
}