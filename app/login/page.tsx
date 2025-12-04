'use client'

import { useState, useEffect } from 'react' // useEffect behövs
import { login, signup } from './actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation' // <--- NY IMPORT

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  
  // Hämta URL-parametrar
  const searchParams = useSearchParams()

  // Kolla URL när sidan laddas
  useEffect(() => {
    if (searchParams.get('view') === 'signup') {
      setMode('signup')
    }
  }, [searchParams])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      if (mode === 'login') {
        const result = await login(formData)
        
        if (result?.error) {
          toast.error(result.error)
          setIsLoading(false)
        } else {
          toast.success("Inloggad!")
          window.location.href = "/dashboard"
        }

      } else {
        const result = await signup(formData)
        
        if (result?.error) {
          toast.error(result.error)
          setIsLoading(false)
        } else {
          toast.success(result.message)
          setMode('login') 
          setIsLoading(false)
        }
      }
    } catch (e) {
      toast.error("Ett oväntat fel uppstod.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fornet.se</h1>
          <p className="text-gray-500 mt-2">
            {mode === 'login' ? 'Logga in till din förening' : 'Skapa ett nytt konto'}
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" required placeholder="namn@forening.se" className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-black" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lösenord</label>
            <input name="password" type="password" required placeholder="••••••••" className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-black" />
          </div>

          <button 
            disabled={isLoading}
            className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {mode === 'login' ? (isLoading ? 'Loggar in...' : 'Logga in') : (isLoading ? 'Skapar konto...' : 'Skapa konto')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-500">
            {mode === 'login' ? 'Inget konto?' : 'Redan konto?'} {' '}
            <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} 
                className="text-blue-600 font-bold hover:underline"
            >
                {mode === 'login' ? 'Registrera dig' : 'Logga in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}