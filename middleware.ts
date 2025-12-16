// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  let hostname = req.headers.get("host")!;

  // Hantera localhost för utveckling
  hostname = hostname.replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);
  
  // Ta bort portnummer om det finns (viktigt för VPS)
  if (hostname.includes(":")) {
    hostname = hostname.split(":")[0];
  }

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

  // 1. ROUTING

  // A. ADMIN (app.fornet.se) - Dashboard
  if (hostname === `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
    if (path === '/login') {
      return NextResponse.rewrite(new URL(`/login`, req.url));
    }
    // Vi kollar auth i layouten/sidorna istället för middleware för prestanda
    return NextResponse.rewrite(new URL(`/dashboard${path.replace('/dashboard', '')}`, req.url));
  }

  // B. LANDING PAGE (fornet.se)
  if (hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
    return NextResponse.rewrite(new URL(path, req.url));
  }

  // C. TENANT (bjorken.fornet.se)
  const subdomain = hostname.split(".")[0];
  return NextResponse.rewrite(new URL(`/sites/${subdomain}${path}`, req.url));
}