import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { notFound } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Färgteman (samma som förut för konsekvent design)
const themeGradients: Record<string, string> = {
  green: "from-emerald-900 to-green-800",
  blue: "from-slate-900 to-blue-800",
  red: "from-red-900 to-rose-800",
  yellow: "from-yellow-900 to-amber-700",
  gray: "from-gray-900 to-gray-700",
};

type Props = {
  params: Promise<{ site: string; id: string }>
}

export default async function SinglePostPage({ params }: Props) {
  const resolvedParams = await params;
  const { site, id } = resolvedParams;

  // 1. Hämta inlägg + organisation
  const { data: post } = await supabase
    .from('posts')
    .select('*, organizations(*)') // Joinar organisationen
    .eq('id', id)
    .single();

  // Om inlägget inte finns, eller om det tillhör fel subdomän (säkerhet!)
  if (!post || post.organizations.subdomain !== site) {
    notFound(); // Visar Next.js inbyggda 404
  }

  const org = post.organizations;
  const themeClass = themeGradients[org.theme_color] || themeGradients.gray;

  return (
    <main className="min-h-screen bg-gray-50 font-sans selection:bg-black selection:text-white">

      {/* 2. ARTIKEL */}
      <article className="max-w-3xl mx-auto px-6 py-12">
        
        {/* Metadata */}
        <div className="mb-8 border-b border-gray-200 pb-8">
            <div className="flex gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border shadow-sm">
                    <Calendar size={14} />
                    {new Date(post.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1 px-2">
                    <User size={14} /> Styrelsen
                </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                {post.title}
            </h1>
        </div>

        {/* Innehåll */}
        <div 
            className="prose prose-slate prose-lg max-w-none text-gray-700 leading-relaxed 
            prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-blue-600 
            prose-img:rounded-xl prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: post.content }} 
        />

      </article>

    </main>
  );
}