import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from '@supabase/ssr'

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  let hostname = req.headers.get("host")!;

  // Hantera localhost
  hostname = hostname.replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);
  if (hostname.includes(":")) {
    hostname = hostname.split(":")[0];
  }

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

  // 1. SUPABASE AUTH
  let response = NextResponse.next({ request: { headers: req.headers } })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            // --- HÄR VAR FELET ---
            // Vi ändrar från (name, value, options) till ett objekt:
            req.cookies.set({ name, value, ...options })
          )
          
          response = NextResponse.next({ request: { headers: req.headers } })
          
          cookiesToSet.forEach(({ name, value, options }) => 
            // Response-objektet klarar fortfarande 3 argument, men objekt-syntaxen är säkrast även här
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()

  // 2. ROUTING

  // A. ADMIN (app.fornet.se)
  if (hostname === `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
    
    // Login-sidan ska ALLTID visas om path är /login
    if (path === '/login') {
        return NextResponse.rewrite(new URL(`/login`, req.url));
    }

    // Skydda Dashboard
    if (!user && path.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // Om inloggad användare går till roten -> Dashboard
    if (user && path === '/') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Dashboard rewrite
    return NextResponse.rewrite(new URL(`/dashboard${path.replace('/dashboard', '')}`, req.url));
  }

  // B. MAIN SITE
  if (hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
    return NextResponse.rewrite(new URL(path, req.url));
  }

  // C. TENANT
  const subdomain = hostname.split(".")[0];
  return NextResponse.rewrite(new URL(`/sites/${subdomain}${path}`, req.url));
}