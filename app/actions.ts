'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// DEFINIERA DEFAULTS FÖR OLIKA TYPER
const TYPE_DEFAULTS: Record<string, any> = {
  road: {
    show_snow_status: true,
    show_documents: true,
    show_board: true,
    show_contact_widget: true,
    show_news: true
  },
  brf: {
    show_booking: true,
    show_documents: true,
    show_board: true,
    show_calendar_widget: true,
    show_contact_widget: true,
    show_broker_info: true,
    show_news: true
  },
  boat: {
    show_booking: true, // Nattvakt/Kranlyft
    show_calendar_widget: true,
    show_water_status: true, // Hamnstatus
    show_contact_widget: true,
    show_board: true,
    show_news: true
  },
  cabin: { // Sommarstugeområde
    show_water_status: true,
    show_calendar_widget: true,
    show_documents: true,
    show_contact_widget: true,
    show_board: true,
    show_news: true
  },
  hunt: { // Jaktlag
    show_calendar_widget: true, // Jaktkalender
    show_news: true,            // Jaktrapporter
    show_documents: true,       // Slaktlistor/Kartor
    show_board: false,          // Oftast inte relevant publikt
    show_contact_widget: false, // Jaktlag har sällan "felanmälan"
    show_membership_form: true,  // Jaktlag vill ofta ha nya medlemmar/gästjägare
    show_snow_status: true, // Vi återanvänder denna för "Jaktstatus"!
    snow_status_text: 'Ingen jakt' // Default text
  },
  venue: { // Bygdegård
    show_booking: true,         // Uthyrning
    show_calendar_widget: true,
    show_contact_widget: true,
    show_news: true
  },
  other: {
    show_documents: true,
    show_contact_widget: true,
    show_news: true
  }
};

// HJÄLPFUNKTION: Kolla om användaren är admin (SÄKERHET)
async function requireAdmin(orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Ej inloggad");

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
    throw new Error("Behörighet saknas");
  }
  return user;
}

// --- SKAPA FÖRENING (Ny) ---

export async function createOrganization(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "Du måste vara inloggad." };
  }

  const name = formData.get('name') as string;
  const type = formData.get('type') as string;

  let subdomain = formData.get('subdomain') as string || name;
  subdomain = subdomain.toLowerCase()
    .replace(/[åä]/g, 'a').replace(/ö/g, 'o')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (subdomain.length < 3) return { error: "Subdomänen är för kort." };

  // --- HÄR ÄR MAGIN: Välj rätt config ---
  const typeConfig = TYPE_DEFAULTS[type] || TYPE_DEFAULTS['other'];

  const initialConfig = {
    show_news: true, // Nyheter är alltid på för alla
    ...typeConfig    // Slå ihop med de smarta förvalen
  };

  // 1. Skapa Org
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name,
      subdomain,
      type,
      owner_id: user.id,
      config: initialConfig // <--- Skicka in den smarta configen
    })
    .select()
    .single();

  if (orgError) {
    if (orgError.code === '23505') return { error: "Adressen är upptagen." };
    return { error: "Kunde inte skapa föreningen." };
  }

  // 2. Lägg till admin (Owner)
  await supabase.from('organization_members').insert({
    org_id: org.id,
    user_id: user.id,
    email: user.email,
    role: 'owner'
  });

  revalidatePath('/dashboard');
  return { success: true, subdomain: org.subdomain };
}

// --- MODULER & STORAGE ---

export async function updateModuleStatus(subdomain: string, moduleKey: string, newValue: boolean) {
  const supabase = await createClient();
  const { data: org } = await supabase.from('organizations').select('id, config').eq('subdomain', subdomain).single();
  if (!org) return;

  await requireAdmin(org.id); // SÄKERHETSKOLL

  const newConfig = { ...org.config, [moduleKey]: newValue };
  await supabase.from('organizations').update({ config: newConfig }).eq('subdomain', subdomain);
  revalidatePath('/'); revalidatePath('/dashboard');
}

export async function checkStorageQuota(orgId: string, fileSize: number) {
  const supabase = await createClient();
  const { data: org } = await supabase.from('organizations').select('storage_used, storage_limit').eq('id', orgId).single();
  if (!org) throw new Error("Hittade inte föreningen");
  const newTotal = (org.storage_used || 0) + fileSize;
  if (newTotal > (org.storage_limit || 0)) {
    return { allowed: false, message: `Lagringsutrymmet är fullt!` };
  }
  return { allowed: true };
}

export async function updateStorageUsage(orgId: string, fileSize: number) {
  const supabase = await createClient();
  const { data: org } = await supabase.from('organizations').select('storage_used').eq('id', orgId).single();
  if (org) {
    await supabase.from('organizations').update({ storage_used: (org.storage_used || 0) + fileSize }).eq('id', orgId);
    revalidatePath('/dashboard');
  }
}

export async function updateSnowStatusDetail(subdomain: string, formData: FormData) {
  const supabase = await createClient();
  const newStatus = formData.get('status') as string;
  const { data: org } = await supabase.from('organizations').select('id, config').eq('subdomain', subdomain).single();
  if (!org) return;

  await requireAdmin(org.id); // SÄKERHETSKOLL

  const newConfig = {
    ...org.config,
    snow_status_text: newStatus,
    snow_updated_at: new Date().toISOString()
  };
  await supabase.from('organizations').update({ config: newConfig }).eq('subdomain', subdomain);
  revalidatePath('/'); revalidatePath('/dashboard');
}

// --- POSTS ---

export async function createPost(slug: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const { data: org } = await supabase.from('organizations').select('id').eq('subdomain', slug).single();
  if (!org) throw new Error("Föreningen hittades inte");

  await requireAdmin(org.id); // SÄKERHETSKOLL

  await supabase.from('posts').insert({ org_id: org.id, title, content });
  revalidatePath('/'); revalidatePath('/dashboard');
}

export async function updatePost(postId: string, formData: FormData) {
  const supabase = await createClient();
  // Hämta post för att hitta org_id
  const { data: post } = await supabase.from('posts').select('org_id').eq('id', postId).single();
  if(post) await requireAdmin(post.org_id); // SÄKERHETSKOLL

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  await supabase.from('posts').update({ title, content }).eq('id', postId);
  revalidatePath('/'); revalidatePath('/dashboard');
}

export async function deletePost(id: string) {
  const supabase = await createClient();
  const { data: post } = await supabase.from('posts').select('org_id').eq('id', id).single();
  if(post) await requireAdmin(post.org_id); // SÄKERHETSKOLL

  await supabase.from('posts').delete().eq('id', id);
  revalidatePath('/dashboard');
}

// --- DOKUMENT ---

export async function uploadDocument(orgId: string, formData: FormData) {
  await requireAdmin(orgId); // SÄKERHETSKOLL
  const supabase = await createClient();
  const title = formData.get('title') as string;
  const file = formData.get('file') as File;
  
  if (!file || !title) throw new Error("Saknar data");

  // FIX: Tuffare tvätt av filnamnet
  const safeName = file.name
    .toLowerCase()
    .replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
    .replace(/[^a-z0-9._-]/g, '_');

  const filename = `${orgId}/${Date.now()}-${safeName}`;
  
  const { error } = await supabase.storage.from('forum-documents').upload(filename, file);
  if (error) {
      console.error("Upload error:", error);
      throw new Error("Kunde inte ladda upp filen. Testa att byta namn på den.");
  }

  await updateStorageUsage(orgId, file.size);
  const { data: { publicUrl } } = supabase.storage.from('forum-documents').getPublicUrl(filename);
  
  await supabase.from('documents').insert({ 
      org_id: orgId, 
      title, 
      file_url: publicUrl, 
      size: file.size 
  });
  
  revalidatePath('/dashboard'); 
  revalidatePath('/dokument');
}

export async function deleteDocument(id: string) {
  const supabase = await createClient();
  const { data: doc } = await supabase.from('documents').select('org_id').eq('id', id).single();
  if(doc) await requireAdmin(doc.org_id); // SÄKERHETSKOLL

  await supabase.from('documents').delete().eq('id', id);
  revalidatePath('/dashboard'); revalidatePath('/dokument');
}

// --- EVENTS ---

export async function addEvent(orgId: string, formData: FormData) {
  await requireAdmin(orgId); // SÄKERHETSKOLL
  const supabase = await createClient();
  await supabase.from('events').insert({
    org_id: orgId,
    title: formData.get('title'),
    date: formData.get('date'),
    description: formData.get('description'),
  });
  revalidatePath('/dashboard'); revalidatePath('/');
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const { data: evt } = await supabase.from('events').select('org_id').eq('id', id).single();
  if(evt) await requireAdmin(evt.org_id); // SÄKERHETSKOLL

  await supabase.from('events').delete().eq('id', id);
  revalidatePath('/dashboard');
}

// --- BOARD ---

export async function addBoardMember(orgId: string, formData: FormData) {
  await requireAdmin(orgId); // SÄKERHETSKOLL
  const supabase = await createClient();
  await supabase.from('board_members').insert({
    org_id: orgId,
    name: formData.get('name'),
    role: formData.get('role'),
    email: formData.get('email'),
    phone: formData.get('phone'),
  });
  revalidatePath('/dashboard'); revalidatePath('/styrelsen');
}

export async function deleteBoardMember(id: string) {
  const supabase = await createClient();
  const { data: bm } = await supabase.from('board_members').select('org_id').eq('id', id).single();
  if(bm) await requireAdmin(bm.org_id); // SÄKERHETSKOLL

  await supabase.from('board_members').delete().eq('id', id);
  revalidatePath('/dashboard'); revalidatePath('/styrelsen');
}

// --- TEAM & INVITES ---

export async function inviteMember(orgId: string, formData: FormData) {
  await requireAdmin(orgId); // SÄKERHETSKOLL
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const { error } = await supabase.from('organization_members').insert({
    org_id: orgId,
    email: email.toLowerCase().trim(),
    role: 'admin'
  });
  if (error) {
    if (error.code === '23505') throw new Error("Personen är redan inbjuden.");
    throw error;
  }
  revalidatePath('/dashboard');
}

export async function removeMember(memberId: string) {
  const supabase = await createClient();
  const { data: member } = await supabase.from('organization_members').select('org_id, user_id, organizations(owner_id)').eq('id', memberId).single();
  if (!member) return;

  await requireAdmin(member.org_id); // SÄKERHETSKOLL

  const org: any = member.organizations;
  if (member.user_id === org.owner_id) throw new Error("Du kan inte ta bort ägaren av föreningen.");

  await supabase.from('organization_members').delete().eq('id', memberId);
  revalidatePath('/dashboard');
}

export async function claimInvites() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return;

  await supabase
    .from('organization_members')
    .update({ user_id: user.id })
    .eq('email', user.email.toLowerCase()) // Matchar lowercase
    .is('user_id', null);
}

export async function createCheckoutSession(interval: 'month' | 'year') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Logga in först" };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://app.fornet.se:3000';

  // 2. ENV VARS FÖR SÄKERHET
  const priceId = interval === 'year'
    ? process.env.STRIPE_PRICE_ID_YEAR
    : process.env.STRIPE_PRICE_ID_MONTH;

  if (!priceId) return { error: "Pris-ID saknas i systemet." };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],

      // HÄR ÄR MAGIN: 60 dagars gratis testperiod
      subscription_data: {
        trial_period_days: 60,
      },

      success_url: `${baseUrl}/dashboard/new?success=true`,
      cancel_url: `${baseUrl}/dashboard/new?canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
      },
    });

    if (!session.url) return { error: "Kunde inte skapa session" };
    return { url: session.url };

  } catch (error: any) {
    console.error("Stripe Error:", error);
    return { error: error.message };
  }
}

// --- BOKNINGSSYSTEM - RESURSER ---

export async function createResource(orgId: string, formData: FormData) {
  await requireAdmin(orgId); // SÄKERHETSKOLL
  const supabase = await createClient();
  const name = formData.get('name') as string;

  if (!name) return;

  await supabase.from('resources').insert({
    org_id: orgId,
    name,
    type: 'hourly', // Vi kör standard 'hourly' för MVP
    description: formData.get('description') as string
  });

  revalidatePath('/dashboard');
  revalidatePath('/boka');
}

export async function deleteResource(id: string) {
  const supabase = await createClient();
  const { data: r } = await supabase.from('resources').select('org_id').eq('id', id).single();
  if(r) await requireAdmin(r.org_id); // SÄKERHETSKOLL

  await supabase.from('resources').delete().eq('id', id);
  revalidatePath('/dashboard');
  revalidatePath('/boka');
}

// --- BOKNINGSSYSTEM - GÖRA BOKNING ---

export async function createBooking(resourceId: string, formData: FormData) {
  const supabase = await createClient();

  const date = formData.get('date') as string; // "2024-05-20"
  const startTime = formData.get('startTime') as string; // "10:00"
  const endTime = formData.get('endTime') as string; // "12:00"
  const name = formData.get('name') as string; 
  const contact = formData.get('contact') as string; // NYTT FÄLT

  if (!date || !startTime || !endTime || !name || !contact) {
    return { error: "Fyll i alla fält." };
  }

  // 3. KOMBINERA NAMN & KONTAKT (Spara DB-schema)
  // "Anders Andersson (Lgh 12)"
  const fullName = `${name} (${contact})`;

  // Skapa ISO-datumsträngar för databasen
  // OBS: Detta utgår från lokal tid, för MVP är det okej men tidszoner är krångligt.
  const startISO = `${date}T${startTime}:00`;
  const endISO = `${date}T${endTime}:00`;

  if (startISO >= endISO) {
    return { error: "Sluttid måste vara efter starttid." };
  }

  // 1. KOLLA KROCKAR (Viktigaste delen!)
  // Vi letar efter bokningar som överlappar med den önskade tiden
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('resource_id', resourceId)
    .or(`and(start_time.lte.${startISO}, end_time.gt.${startISO}), and(start_time.lt.${endISO}, end_time.gte.${endISO}), and(start_time.gte.${startISO}, end_time.lte.${endISO})`);

  if (conflicts && conflicts.length > 0) {
    return { error: "Tiden är redan bokad! 🚫" };
  }

  // 2. BOKA
  const { error } = await supabase.from('bookings').insert({
    resource_id: resourceId,
    user_name: fullName,
    start_time: startISO,
    end_time: endISO
  });

  if (error) {
    console.error(error);
    return { error: "Kunde inte boka." };
  }

  revalidatePath('/boka'); // Uppdatera publika sidan
  return { success: true };
}

export async function deleteBooking(bookingId: string) {
  const supabase = await createClient();
  // Här borde vi egentligen kolla om man ÄGER bokningen, men vi kör öppet för MVP
  // Eller om man är admin. För nuvarande tillåter vi "open delete" för enkelhet, men 
  // i en skarp version bör man kolla cookie eller IP.
  await supabase.from('bookings').delete().eq('id', bookingId);
  revalidatePath('/boka');
}

// --- INSTÄLLNINGAR (Lösenord, Swish, Karta) ---
export async function updateSettings(subdomain: string, formData: FormData) {
  const supabase = await createClient();
  const { data: org } = await supabase.from('organizations').select('id').eq('subdomain', subdomain).single();
  if (!org) return;

  await requireAdmin(org.id); // SÄKERHETSKOLL

  const updates: any = {};

  // Befintliga fält...
  if (formData.has('site_password')) updates.site_password = formData.get('site_password') || null;
  if (formData.has('swish_number')) updates.swish_number = formData.get('swish_number');
  if (formData.has('swish_message')) updates.swish_message = formData.get('swish_message');

  // NYA FÄLT:
  if (formData.has('broker_info')) updates.broker_info = formData.get('broker_info');
  if (formData.has('alert_message')) updates.alert_message = formData.get('alert_message') || null; // Tomt = Dölj
  if (formData.has('alert_level')) updates.alert_level = formData.get('alert_level');
  if (formData.has('facebook_url')) updates.facebook_url = formData.get('facebook_url');
  if (formData.has('instagram_url')) updates.instagram_url = formData.get('instagram_url');
  if (formData.has('header_text')) updates.header_text = formData.get('header_text');
  if (formData.has('subheader_text')) updates.subheader_text = formData.get('subheader_text');

  // ... (Bild-uppladdningen ligger kvar här) ...
  const mapFile = formData.get('map_image') as File;
  if (mapFile && mapFile.size > 0 && mapFile.name !== 'undefined') {
      const filename = `${org.id}/map-${Date.now()}`;
      const { error } = await supabase.storage.from('forum-media').upload(filename, mapFile, { upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('forum-media').getPublicUrl(filename);
        updates.map_image_url = publicUrl;
      }
  }

  const heroFile = formData.get('hero_image') as File;
  if (heroFile && heroFile.size > 0 && heroFile.name !== 'undefined') {
    const filename = `${org.id}/hero-${Date.now()}`;

    // Ladda upp till Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('forum-media')
      .upload(filename, heroFile, { upsert: true }); // upsert=true är bra för att skriva över

    if (uploadError) {
      console.error("Upload error:", uploadError);
    } else {
      // Hämta URL och lägg till i uppdateringen
      const { data: { publicUrl } } = supabase.storage
        .from('forum-media')
        .getPublicUrl(filename);

      updates.hero_image_url = publicUrl;
    }
  }

  await supabase.from('organizations').update(updates).eq('id', org.id);
  revalidatePath('/dashboard');
  revalidatePath('/');
}

// --- EGNA SIDOR ---
export async function createPage(orgId: string, formData: FormData) {
  await requireAdmin(orgId); // SÄKERHETSKOLL
  const supabase = await createClient();
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  // Skapa slug (t.ex. "Om Oss" -> "om-oss")
  const slug = title.toLowerCase().replace(/ /g, '-').replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9-]/g, '');

  await supabase.from('pages').insert({ org_id: orgId, title, slug, content });
  revalidatePath('/dashboard');
  revalidatePath('/');
}

export async function deletePage(id: string) {
  const supabase = await createClient();
  const { data: page } = await supabase.from('pages').select('org_id').eq('id', id).single();
  if (page) await requireAdmin(page.org_id); // SÄKERHETSKOLL

  await supabase.from('pages').delete().eq('id', id);
  revalidatePath('/dashboard');
  revalidatePath('/');
}

export async function updatePage(pageId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: page } = await supabase.from('pages').select('org_id').eq('id', pageId).single();
  if (page) await requireAdmin(page.org_id); // SÄKERHETSKOLL

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  // Vi uppdaterar inte sluggen för att inte paja länkar som folk kanske sparat
  await supabase
    .from('pages')
    .update({ title, content })
    .eq('id', pageId);

  revalidatePath('/dashboard');
  revalidatePath('/'); // Uppdatera menyn om titeln ändrades
}

// --- FORMULÄR (Publikt) ---
export async function submitForm(orgId: string, type: string, formData: FormData) {
  const supabase = await createClient();

  // Konvertera FormData till JSON
  const data: Record<string, any> = {};
  formData.forEach((value, key) => data[key] = value);

  // 4. TA BORT PERSONNUMMER FRÅN DATA OM DET INTE FYLLTS I (Städa)
  if (!data.personal_number) delete data.personal_number;

  await supabase.from('form_submissions').insert({
    org_id: orgId,
    type,
    data
  });

  return { success: true };
}

// --- LÅSET (Verifiera lösenord) ---
import { cookies } from 'next/headers'; // Behövs för att sätta "upplåst"-cookie

export async function verifySitePassword(subdomain: string, passwordAttempt: string) {
  const supabase = await createClient();
  const { data: org } = await supabase.from('organizations').select('site_password').eq('subdomain', subdomain).single();

  if (org && org.site_password === passwordAttempt) {
    // Sätt en cookie som säger "Jag får vara här"
    const cookieStore = await cookies();
    cookieStore.set(`access_${subdomain}`, 'true', { httpOnly: true, path: '/' });
    return { success: true };
  }

  return { error: "Fel lösenord" };
}

// --- SÖKFUNKTION ---
export async function searchSite(subdomain: string, query: string) {
  const supabase = await createClient();
  const { data: org } = await supabase.from('organizations').select('id').eq('subdomain', subdomain).single();

  if (!org) return [];

  const searchTerm = `%${query}%`; // % betyder "vadsomhelst" i SQL

  // 1. Sök i Inlägg
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, content, created_at')
    .eq('org_id', org.id)
    .ilike('title', searchTerm)
    .limit(3);

  // 2. Sök i Sidor
  const { data: pages } = await supabase
    .from('pages')
    .select('id, title, slug')
    .eq('org_id', org.id)
    .ilike('title', searchTerm)
    .limit(3);

  // 3. Sök i Dokument
  const { data: docs } = await supabase
    .from('documents')
    .select('id, title, file_url')
    .eq('org_id', org.id)
    .ilike('title', searchTerm)
    .limit(3);

  // Slå ihop resultaten och märk upp dem
  return [
    ...(posts?.map(p => ({ type: 'post', title: p.title, url: `/p/${p.id}`, date: p.created_at })) || []),
    ...(pages?.map(p => ({ type: 'page', title: p.title, url: `/s/${p.slug}` })) || []),
    ...(docs?.map(d => ({ type: 'doc', title: d.title, url: d.file_url, external: true })) || [])
  ];
}

// --- SPONSORER ---
export async function addSponsor(orgId: string, formData: FormData) {
  await requireAdmin(orgId); // SÄKERHETSKOLL
  const supabase = await createClient();
  const name = formData.get('name') as string;
  let website_url = formData.get('website_url') as string;
  const file = formData.get('logo') as File;

  if (!file || !name) return;

  if (website_url && !website_url.startsWith('http')) {
    website_url = `https://${website_url}`;
  }

  // Ladda upp logga till 'forum-media'
  const filename = `${orgId}/sponsor-${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
  const { error: uploadError } = await supabase.storage.from('forum-media').upload(filename, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error("Kunde inte ladda upp bilden");
  }

  const { data: { publicUrl } } = supabase.storage.from('forum-media').getPublicUrl(filename);

  await supabase.from('sponsors').insert({
    org_id: orgId,
    name,
    website_url,
    logo_url: publicUrl
  });

  revalidatePath('/dashboard');
  revalidatePath('/');
}

export async function deleteSponsor(id: string) {
  const supabase = await createClient();
  const { data: s } = await supabase.from('sponsors').select('org_id').eq('id', id).single();
  if (s) await requireAdmin(s.org_id); // SÄKERHETSKOLL

  await supabase.from('sponsors').delete().eq('id', id);
  revalidatePath('/dashboard');
  revalidatePath('/');
}

// --- MEDLEMSANSÖKNINGAR ---

export async function approveMembershipApplication(submissionId: string, orgId: string, email: string) {
  const supabase = await createClient();
  
  await requireAdmin(orgId); // SÄKERHETSKOLL

  if (email) {
      // 2. Bjud in medlemmen (Görs som "Ove", så vi ser vem som bjöd in)
      const { error: inviteError } = await supabase.from('organization_members').insert({
        org_id: orgId,
        email: email.toLowerCase().trim(),
        role: 'member'
      });

      if (inviteError && inviteError.code !== '23505') { 
          console.error("Kunde inte skapa medlem:", inviteError);
      }
  }

  // 3. RADERA MED SUPER-KRAFT (Bypass RLS)
  // Vi skapar en tillfällig admin-klient bara för att radera
  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Städa bort ALLA ansökningar från denna mail (rensar dubbletter också)
  const { error: deleteError } = await supabaseAdmin
    .from('form_submissions')
    .delete()
    .eq('org_id', orgId)
    .eq('type', 'membership')
    .contains('data', { email: email });

  if (deleteError) {
      console.error("ADMIN DELETE ERROR:", deleteError);
  } else {
      console.log(`[Admin] Rensade ansökningar för ${email}`);
  }

  revalidatePath('/dashboard');
  revalidatePath('/', 'layout');
}

export async function rejectMembershipApplication(submissionId: string) {
  // Använd Super-Admin här också för att vara säker
  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  await supabaseAdmin.from('form_submissions').delete().eq('id', submissionId);
  
  revalidatePath('/dashboard');
  revalidatePath('/', 'layout');
}

export async function saveNewsletter(orgId: string, formData: FormData, idToUpdate?: string) {
  await requireAdmin(orgId); // SÄKERHETSKOLL
  const supabase = await createClient();
  const subject = formData.get('subject') as string;
  const content = formData.get('content') as string;

  if (!subject || !content) return { error: "Fyll i ämne och innehåll" };

  const data = { org_id: orgId, subject, content };

  if (idToUpdate) {
    await supabase.from('newsletters').update(data).eq('id', idToUpdate);
  } else {
    await supabase.from('newsletters').insert(data);
  }

  revalidatePath('/dashboard');
}

export async function deleteNewsletter(id: string) {
  const supabase = await createClient();
  const { data: n } = await supabase.from('newsletters').select('org_id').eq('id', id).single();
  if (n) await requireAdmin(n.org_id); // SÄKERHETSKOLL

  await supabase.from('newsletters').delete().eq('id', id);
  revalidatePath('/dashboard');
}

export async function sendNewsletter(id: string) {
  const supabase = await createClient();
  
  // 1. Hämta utskicket
  const { data: letter } = await supabase.from('newsletters').select('*').eq('id', id).single();
  if (!letter) return { error: "Hittade inte utskicket" };

  await requireAdmin(letter.org_id); // SÄKERHETSKOLL

  // 2. Hämta alla medlemmar (epost)
  const { data: members } = await supabase
    .from('organization_members')
    .select('email')
    .eq('org_id', letter.org_id);

  if (!members || members.length === 0) return { error: "Inga medlemmar att skicka till." };

  // 3. SIMULERA UTSKICK (Här kopplar vi på Resend/SendGrid senare)
  console.log(`🚀 SKICKAR NYHETSBREV: "${letter.subject}"`);
  console.log(`📨 MOTTAGARE (${members.length} st):`, members.map(m => m.email).join(', '));
  
  // 4. Uppdatera status till 'sent'
  await supabase.from('newsletters').update({ 
      status: 'sent', 
      sent_at: new Date().toISOString() 
  }).eq('id', id);

  revalidatePath('/dashboard');
  return { success: true, count: members.length };
}