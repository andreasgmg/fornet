// app/login/actions.ts
'use server'

import { createClient } from '@/lib/pocketbase'; // OBS: Vår nya fil
import { cookies } from 'next/headers';

export async function login(formData: FormData) {
  const pb = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    // Försök logga in
    const authData = await pb.collection('users').authWithPassword(email, password);

    // Sätt kakan manuellt så Next.js kommer ihåg inloggningen
    const cookieStore = await cookies();
    cookieStore.set('pb_auth', pb.authStore.exportToCookie({ httpOnly: false }), {
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      httpOnly: true, // Viktigt för säkerhet
    });

    return { success: true };
  } catch (e) {
    return { error: "Fel email eller lösenord." };
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: "Konto skapat! Logga in nu." }
}