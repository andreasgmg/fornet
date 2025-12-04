'use client'

import { createClient } from '@/utils/supabase/client'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

export default function SignOutButton() {
  const handleLogout = async () => {
    const supabase = createClient()
    
    // 1. Logga ut mot Supabase
    await supabase.auth.signOut()
    
    // 2. Visa notis
    toast.success("Du har loggats ut.")
    
    // 3. HÅRD NAVIGERING till login (rensar cachen)
    window.location.href = '/login'
  }

  return (
    <button 
      onClick={handleLogout}
      className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200"
    >
      <LogOut size={16} /> Logga ut
    </button>
  )
}