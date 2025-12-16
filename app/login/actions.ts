// app/login/actions.ts
'use server'

import { createClient } from '@/lib/pocketbase'; 
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const pb = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await pb.collection('users').authWithPassword(email, password);

    const cookieStore = await cookies();
    cookieStore.set('pb_auth', pb.authStore.exportToCookie({ httpOnly: false }), {
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      httpOnly: true, 
    });

    return { success: true };
  } catch (e) {
    return { error: "Fel email eller lösenord." };
  }
}

export async function signup(formData: FormData) {
  const pb = await createClient();
  
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    passwordConfirm: formData.get('password') as string, // PB kräver confirm
  };

  try {
    await pb.collection('users').create(data);
    return { success: true, message: "Konto skapat! Logga in nu." };
  } catch (e: any) {
    return { error: "Kunde inte skapa konto. Lösenord måste vara minst 8 tecken." };
  }
}

// NY FUNKTION:
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('pb_auth');
  redirect('/login');
}