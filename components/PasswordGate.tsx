'use client'
import { useState } from 'react';
import { verifySitePassword } from '@/app/actions';
import { Lock, ArrowRight } from 'lucide-react';

export default function PasswordGate({ subdomain }: { subdomain: string }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await verifySitePassword(subdomain, password);
    if (result.success) {
      window.location.reload(); // Ladda om för att visa sidan
    } else {
      setError('Fel lösenord');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Sidan är låst</h1>
        <p className="text-gray-500 mb-6">Ange föreningens lösenord för att fortsätta.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Lösenord"
                className="w-full border rounded-lg p-3 text-center text-lg tracking-widest outline-none focus:ring-2 focus:ring-black"
                autoFocus
            />
            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
            <button className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 flex justify-center items-center gap-2">
                Lås upp <ArrowRight size={18}/>
            </button>
        </form>
      </div>
    </div>
  );
}