import { headers } from 'next/headers';
import Stripe from 'stripe';
import PocketBase from 'pocketbase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
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
      try {
        // Initiera PocketBase (ingen cookies/auth store behövs här)
        const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
        
        // Logga in som Super-Admin för att kunna skriva till user-tabellen fritt
        await pb.admins.authWithPassword(
          process.env.PB_ADMIN_EMAIL!, 
          process.env.PB_ADMIN_PASSWORD!
        );

        // UPPDATERA DATABASEN: Användaren är nu PRO!
        await pb.collection('users').update(userId, { 
            is_pro: true,
            stripe_customer_id: session.customer as string
        });
        
      } catch (err) {
        console.error("Failed to update PocketBase user:", err);
        return new Response("Database update failed", { status: 500 });
      }
    }
  }

  return new Response(null, { status: 200 });
}