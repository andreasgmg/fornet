'use client'
import { useState } from 'react';
import { submitForm } from '@/app/actions';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';

export default function MembershipForm({ orgId }: { orgId: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    // Vi använder samma server action som förut, men med typen 'membership'
    await submitForm(orgId, 'membership', formData);
    setLoading(false);
    setSent(true);
    toast.success("Ansökan skickad!");
  };

  if (sent) return (
    <div className="bg-green-50 text-green-700 p-8 rounded-xl text-center border border-green-100">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <UserPlus size={32} />
      </div>
      <h3 className="text-xl font-bold mb-2">Tack för din ansökan! 🎉</h3>
      <p>Vi har tagit emot dina uppgifter och styrelsen kommer att kontakta dig inom kort.</p>
    </div>
  );

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bli medlem</h2>
            <p className="text-gray-500">Fyll i uppgifterna nedan för att skicka en intresseanmälan.</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Förnamn</label>
                    <input name="firstname" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-black transition-all" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Efternamn</label>
                    <input name="lastname" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-black transition-all" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Personnummer / Org.nr</label>
                <input name="personal_number" placeholder="ÅÅMMDD-XXXX" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-black transition-all" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                    <input name="email" type="email" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-black transition-all" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Telefon</label>
                    <input name="phone" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-black transition-all" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Gatuadress</label>
                <input name="address" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-black transition-all" />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Meddelande (Valfritt)</label>
                <textarea name="message" rows={3} placeholder="Övrig information..." className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-black transition-all" />
            </div>

            <button disabled={loading} className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-all flex justify-center items-center gap-2">
                {loading && <Loader2 className="animate-spin" size={20} />}
                Skicka ansökan
            </button>
        </form>
    </div>
  )
}