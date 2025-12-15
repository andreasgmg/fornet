'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Search } from 'lucide-react'
import SiteSearch from './SiteSearch'

export default function SiteHeader({ org, config }: { org: any, config: any }) {
    const [isOpen, setIsOpen] = useState(false)

    const links = [
        { label: 'Start', href: '/' },
        ...(org.pages?.map((p: any) => ({ label: p.title, href: `/s/${p.slug}` })) || []),
        config.show_booking && { label: 'Boka', href: '/boka' },
        config.show_documents && { label: 'Dokument', href: '/dokument' },
        config.show_board && { label: 'Styrelsen', href: '/styrelsen' },
        config.show_contact_widget && { label: 'Felanmälan', href: '/felanmalan' },

        // NY RAD:
        config.show_membership_form && { label: 'Bli Medlem', href: '/bli-medlem' },

        { label: 'Kalender', href: '/kalender' },
    ].filter(Boolean);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex justify-between items-center">

                {/* LOGO */}
                <Link href="/" className="font-bold text-lg tracking-tight text-gray-900 truncate max-w-[200px]">
                    {org.name}
                </Link>

                {/* DESKTOP MENU (Hidden on mobile) */}
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                    {links.map((link: any) => (
                        <Link key={link.href} href={link.href} className="hover:text-black transition-colors">
                            {link.label}
                        </Link>
                    ))}
                    <div className="pl-4 border-l border-gray-200">
                        <SiteSearch subdomain={org.subdomain} />
                    </div>
                </div>

                {/* MOBILE MENU TOGGLE */}
                <div className="flex items-center gap-4 md:hidden">
                    <SiteSearch subdomain={org.subdomain} /> {/* Sökikon alltid synlig */}
                    <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700">
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* MOBILE MENU DROPDOWN */}
            {isOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white absolute w-full left-0 shadow-xl animate-in slide-in-from-top-2">
                    <div className="flex flex-col p-4 space-y-4">
                        {links.map((link: any) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className="text-lg font-medium text-gray-800 py-2 border-b border-gray-50 last:border-0"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    )
}