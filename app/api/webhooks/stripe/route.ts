import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js'; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Admin-klient för att uppdatera användare utan att vara inloggad
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  const body = await req.text();
  
  // FIX: Awaita headers() innan du kör .get()
  const headerList = await headers();
  const signature = headerList.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return new Response(`Webhook Error: ${error}`, { status: 400 });
  }

  // Lyssna på när en betalning är genomförd
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (userId) {
      // UPPDATERA DATABASEN: Användaren är nu PRO!
      await supabaseAdmin
        .from('profiles')
        .update({ 
            is_pro: true,
            stripe_customer_id: session.customer as string
        })
        .eq('id', userId);
    }
  }

  return new Response(null, { status: 200 });
}