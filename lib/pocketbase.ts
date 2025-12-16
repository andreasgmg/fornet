// lib/pocketbase.ts
import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

export async function createClient() {
  // På servern ansluter vi internt (snabbare), på klienten externt
  const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
  
  const pb = new PocketBase(baseUrl);

  // Hämta kakor från inkommande request
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');

  if (authCookie) {
    pb.authStore.loadFromCookie(authCookie.value);
  }

  return pb;
}