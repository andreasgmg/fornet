'use client'
import { useState } from 'react';
import { submitForm } from '@/app/actions';
import { toast } from 'sonner';

export default function PublicForm({ orgId, type, title }: { orgId: string, type: string, title: string }) {
  const [sent, setSent] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    await submitForm(orgId, type, formData);
    setSent(true);
    toast.success("Skickat! Tack.");
  };

  if (sent) return <div className="bg-green-50 text-green-700 p-4 rounded-lg font-bold text-center">Tack för ditt meddelande! ✅</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <form action={handleSubmit} className="space-y-3">
            <input name="namn" required placeholder="Ditt namn" className="w-full border rounded p-2" />
            <input name="kontakt" required placeholder="Din email/telefon" className="w-full border rounded p-2" />
            <textarea name="meddelande" required placeholder="Meddelande..." rows={3} className="w-full border rounded p-2" />
            <button className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">Skicka</button>
        </form>
    </div>
  )
}