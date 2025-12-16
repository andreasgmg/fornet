'use client'

import { logout } from '@/app/login/actions' // Importera vår nya action
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

export default function SignOutButton() {
  const handleLogout = async () => {
    // Kör server action
    await logout();
    toast.success("Du har loggats ut.");
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