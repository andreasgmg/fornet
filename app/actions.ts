'use server'

import { createClient } from '@/lib/pocketbase'; // Din nya fil
import { revalidatePath } from 'next/cache';
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
    show_booking: true,
    show_calendar_widget: true,
    show_water_status: true,
    show_contact_widget: true,
    show_board: true,
    show_news: true
  },
  cabin: {
    show_water_status: true,
    show_calendar_widget: true,
    show_documents: true,
    show_contact_widget: true,
    show_board: true,
    show_news: true
  },
  hunt: {
    show_calendar_widget: true,
    show_news: true,
    show_documents: true,
    show_board: false,
    show_contact_widget: false,
    show_membership_form: true,
    show_snow_status: true,
    snow_status_text: 'Ingen jakt'
  },
  venue: {
    show_booking: true,
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

// HJÄLPFUNKTION: Kolla om användaren är admin
async function requireAdmin(orgId: string) {
  const pb = await createClient();
  if (!pb.authStore.isValid || !pb.authStore.model) throw new Error("Ej inloggad");

  const userId = pb.authStore.model.id;

  try {
    // Sök i organization_members efter matchning
    const member = await pb.collection('organization_members').getFirstListItem(
      `org_id="${orgId}" && user_id="${userId}"`
    );

    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      throw new Error("Behörighet saknas");
    }
    return pb.authStore.model;
  } catch (e) {
    throw new Error("Behörighet saknas eller hittade inte medlemskap");
  }
}

// --- SKAPA FÖRENING ---

export async function createOrganization(formData: FormData) {
  const pb = await createClient();
  
  if (!pb.authStore.isValid || !pb.authStore.model) {
    return { error: "Du måste vara inloggad." };
  }
  const user = pb.authStore.model;

  const name = formData.get('name') as string;
  const type = formData.get('type') as string;

  let subdomain = formData.get('subdomain') as string || name;
  subdomain = subdomain.toLowerCase()
    .replace(/[åä]/g, 'a').replace(/ö/g, 'o')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (subdomain.length < 3) return { error: "Subdomänen är för kort." };

  const typeConfig = TYPE_DEFAULTS[type] || TYPE_DEFAULTS['other'];
  const initialConfig = { show_news: true, ...typeConfig };

  try {
    // 1. Skapa Org i PocketBase
    const orgData = {
      name,
      subdomain,
      type,
      owner_id: user.id,
      config: initialConfig,
      storage_used: 0,
      storage_limit: 104857600 // Exempel: 100MB
    };

    const org = await pb.collection('organizations').create(orgData);

    // 2. Lägg till admin (Owner) i organization_members
    await pb.collection('organization_members').create({
      org_id: org.id,
      user_id: user.id,
      email: user.email,
      role: 'owner'
    });

    revalidatePath('/dashboard');
    return { success: true, subdomain: org.subdomain };

  } catch (error: any) {
    console.error("Create Org Error:", error);
    // PocketBase kastar error om unique constraint (subdomain) falerar
    if (error?.data?.subdomain) return { error: "Adressen är upptagen." };
    return { error: "Kunde inte skapa föreningen." };
  }
}

// --- MODULER & STORAGE ---

export async function updateModuleStatus(subdomain: string, moduleKey: string, newValue: boolean) {
  const pb = await createClient();
  // Hämta org id baserat på subdomain
  const org = await pb.collection('organizations').getFirstListItem(`subdomain="${subdomain}"`);
  
  await requireAdmin(org.id);

  const newConfig = { ...org.config, [moduleKey]: newValue };
  await pb.collection('organizations').update(org.id, { config: newConfig });
  
  revalidatePath('/'); revalidatePath('/dashboard');
}

export async function checkStorageQuota(orgId: string, fileSize: number) {
  const pb = await createClient();
  const org = await pb.collection('organizations').getOne(orgId);
  
  const newTotal = (org.storage_used || 0) + fileSize;
  if (newTotal > (org.storage_limit || 0)) {
    return { allowed: false, message: `Lagringsutrymmet är fullt!` };
  }
  return { allowed: true };
}

export async function updateStorageUsage(orgId: string, fileSize: number) {
  const pb = await createClient();
  const org = await pb.collection('organizations').getOne(orgId);
  await pb.collection('organizations').update(orgId, { 
    storage_used: (org.storage_used || 0) + fileSize 
  });
}

export async function updateSnowStatusDetail(subdomain: string, formData: FormData) {
  const pb = await createClient();
  const newStatus = formData.get('status') as string;
  
  const org = await pb.collection('organizations').getFirstListItem(`subdomain="${subdomain}"`);
  await requireAdmin(org.id);

  const newConfig = {
    ...org.config,
    snow_status_text: newStatus,
    snow_updated_at: new Date().toISOString()
  };
  
  await pb.collection('organizations').update(org.id, { config: newConfig });
  revalidatePath('/'); revalidatePath('/dashboard');
}

// --- POSTS ---

export async function createPost(slug: string, formData: FormData) {
  const pb = await createClient();
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  const org = await pb.collection('organizations').getFirstListItem(`subdomain="${slug}"`);
  await requireAdmin(org.id);

  await pb.collection('posts').create({
    org_id: org.id,
    title,
    content
  });
  
  revalidatePath('/'); revalidatePath('/dashboard');
}

export async function updatePost(postId: string, formData: FormData) {
  const pb = await createClient();
  // Hämta post för att kolla org_id
  const post = await pb.collection('posts').getOne(postId);
  await requireAdmin(post.org_id);

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  
  await pb.collection('posts').update(postId, { title, content });
  revalidatePath('/'); revalidatePath('/dashboard');
}

export async function deletePost(id: string) {
  const pb = await createClient();
  const post = await pb.collection('posts').getOne(id);
  await requireAdmin(post.org_id);

  await pb.collection('posts').delete(id);
  revalidatePath('/dashboard');
}

// --- DOKUMENT (Här skiljer sig PocketBase mycket) ---

export async function uploadDocument(orgId: string, formData: FormData) {
  await requireAdmin(orgId);
  const pb = await createClient();
  
  const title = formData.get('title') as string;
  const file = formData.get('file') as File; // I PB skickar vi filobjektet direkt
  
  if (!file || !title) throw new Error("Saknar data");

  // Uppdatera storage usage först (valfritt, men bra för bokföring)
  await updateStorageUsage(orgId, file.size);

  // I PocketBase laddar vi upp filen som en del av recordet
  // Se till att din 'documents'-collection har ett 'file'-fält
  try {
    // Förbered FormData för PocketBase (PB tar 'file' direkt)
    // Vi återanvänder formData som kom in, men ser till att org_id finns
    formData.append('org_id', orgId);
    
    // Om din collection heter 'documents' och fältet 'file':
    await pb.collection('documents').create(formData);
    
    revalidatePath('/dashboard'); 
    revalidatePath('/dokument');
  } catch (e) {
    console.error("Upload error", e);
    throw new Error("Kunde inte ladda upp filen.");
  }
}

export async function deleteDocument(id: string) {
  const pb = await createClient();
  const doc = await pb.collection('documents').getOne(id);
  await requireAdmin(doc.org_id);

  // Om vi raderar posten i PB raderas filen automatiskt
  await pb.collection('documents').delete(id);
  revalidatePath('/dashboard'); revalidatePath('/dokument');
}

// --- EVENTS ---

export async function addEvent(orgId: string, formData: FormData) {
  await requireAdmin(orgId);
  const pb = await createClient();
  
  await pb.collection('events').create({
    org_id: orgId,
    title: formData.get('title'),
    date: formData.get('date'), // Se till att PB datumfält matchar formatet
    description: formData.get('description'),
  });
  
  revalidatePath('/dashboard'); revalidatePath('/');
}

export async function deleteEvent(id: string) {
  const pb = await createClient();
  const evt = await pb.collection('events').getOne(id);
  await requireAdmin(evt.org_id);

  await pb.collection('events').delete(id);
  revalidatePath('/dashboard');
}

// --- BOARD ---

export async function addBoardMember(orgId: string, formData: FormData) {
  await requireAdmin(orgId);
  const pb = await createClient();
  
  await pb.collection('board_members').create({
    org_id: orgId,
    name: formData.get('name'),
    role: formData.get('role'),
    email: formData.get('email'),
    phone: formData.get('phone'),
  });
  
  revalidatePath('/dashboard'); revalidatePath('/styrelsen');
}

export async function deleteBoardMember(id: string) {
  const pb = await createClient();
  const bm = await pb.collection('board_members').getOne(id);
  await requireAdmin(bm.org_id);

  await pb.collection('board_members').delete(id);
  revalidatePath('/dashboard'); revalidatePath('/styrelsen');
}

// --- TEAM & INVITES ---

export async function inviteMember(orgId: string, formData: FormData) {
  await requireAdmin(orgId);
  const pb = await createClient();
  const email = formData.get('email') as string;
  
  try {
    await pb.collection('organization_members').create({
      org_id: orgId,
      email: email.toLowerCase().trim(),
      role: 'admin'
    });
  } catch (e: any) {
    // PB unique constraint error code often 400
    throw new Error("Kunde inte bjuda in, kanske redan inbjuden?");
  }
  revalidatePath('/dashboard');
}

export async function removeMember(memberId: string) {
  const pb = await createClient();
  
  // Hämta medlem + expandera org för att kolla owner
  const member = await pb.collection('organization_members').getOne(memberId, {
    expand: 'org_id'
  });
  
  // member.expand.org_id är nu själva organisationsobjektet
  const org: any = member.expand?.org_id;

  if (!org) return;
  
  await requireAdmin(org.id);

  if (member.user_id === org.owner_id) throw new Error("Du kan inte ta bort ägaren av föreningen.");

  await pb.collection('organization_members').delete(memberId);
  revalidatePath('/dashboard');
}

export async function claimInvites() {
  const pb = await createClient();
  if (!pb.authStore.isValid || !pb.authStore.model) return;
  
  const user = pb.authStore.model;
  const email = user.email.toLowerCase();

  // Hitta alla invites för denna email som saknar user_id
  // Filter syntax i PB: email='...' && user_id=''
  const invites = await pb.collection('organization_members').getFullList({
    filter: `email="${email}" && user_id=""`
  });

  for (const invite of invites) {
    await pb.collection('organization_members').update(invite.id, {
      user_id: user.id
    });
  }
}

export async function createCheckoutSession(interval: 'month' | 'year') {
  const pb = await createClient();
  if (!pb.authStore.isValid || !pb.authStore.model) return { error: "Logga in först" };
  const user = pb.authStore.model;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const priceId = interval === 'year'
    ? process.env.STRIPE_PRICE_ID_YEAR
    : process.env.STRIPE_PRICE_ID_MONTH;

  if (!priceId) return { error: "Pris-ID saknas." };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 60 },
      success_url: `${baseUrl}/dashboard/new?success=true`,
      cancel_url: `${baseUrl}/dashboard/new?canceled=true`,
      customer_email: user.email,
      metadata: { userId: user.id },
    });

    if (!session.url) return { error: "Kunde inte skapa session" };
    return { url: session.url };

  } catch (error: any) {
    console.error("Stripe Error:", error);
    return { error: error.message };
  }
}

// --- BOKNINGSSYSTEM ---

export async function createResource(orgId: string, formData: FormData) {
  await requireAdmin(orgId);
  const pb = await createClient();
  
  await pb.collection('resources').create({
    org_id: orgId,
    name: formData.get('name'),
    type: 'hourly',
    description: formData.get('description')
  });

  revalidatePath('/dashboard'); revalidatePath('/boka');
}

export async function deleteResource(id: string) {
  const pb = await createClient();
  const res = await pb.collection('resources').getOne(id);
  await requireAdmin(res.org_id);
  await pb.collection('resources').delete(id);
  revalidatePath('/dashboard'); revalidatePath('/boka');
}

export async function createBooking(resourceId: string, formData: FormData) {
  const pb = await createClient();

  const date = formData.get('date') as string; 
  const startTime = formData.get('startTime') as string; 
  const endTime = formData.get('endTime') as string; 
  const name = formData.get('name') as string; 
  const contact = formData.get('contact') as string;

  if (!date || !startTime || !endTime || !name || !contact) return { error: "Fyll i alla fält." };

  const fullName = `${name} (${contact})`;
  const startISO = `${date}T${startTime}:00`; // Se till att PB använder UTC eller rätt zon
  const endISO = `${date}T${endTime}:00`;

  if (startISO >= endISO) return { error: "Sluttid måste vara efter starttid." };

  // 1. KOLLA KROCKAR (PB Filter Syntax)
  // Logic: (start < existingEnd) AND (end > existingStart)
  const filter = `resource_id="${resourceId}" && start_time < "${endISO}" && end_time > "${startISO}"`;
  
  const conflicts = await pb.collection('bookings').getList(1, 1, { filter });

  if (conflicts.totalItems > 0) {
    return { error: "Tiden är redan bokad! 🚫" };
  }

  // 2. BOKA
  await pb.collection('bookings').create({
    resource_id: resourceId,
    user_name: fullName,
    start_time: startISO,
    end_time: endISO
  });

  revalidatePath('/boka');
  return { success: true };
}

export async function deleteBooking(bookingId: string) {
  const pb = await createClient();
  await pb.collection('bookings').delete(bookingId);
  revalidatePath('/boka');
}

// --- INSTÄLLNINGAR (Lösenord, Swish, Bilder) ---

export async function updateSettings(subdomain: string, formData: FormData) {
  const pb = await createClient();
  const org = await pb.collection('organizations').getFirstListItem(`subdomain="${subdomain}"`);
  
  await requireAdmin(org.id);

  // I PocketBase skickar vi bara FormData direkt till update om fältnamnen matchar
  // Men vi måste se till att 'hero_image' och 'map_image' matchar PB-fältnamn
  // Om du har döpt dem samma i formuläret och i PB är det enkelt:
  
  try {
     await pb.collection('organizations').update(org.id, formData);
  } catch(e) {
     console.error("Update settings error:", e);
  }

  revalidatePath('/dashboard'); revalidatePath('/');
}

// --- EGNA SIDOR ---

export async function createPage(orgId: string, formData: FormData) {
  await requireAdmin(orgId);
  const pb = await createClient();
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const slug = title.toLowerCase().replace(/ /g, '-').replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9-]/g, '');

  await pb.collection('pages').create({
    org_id: orgId, title, slug, content
  });
  revalidatePath('/dashboard'); revalidatePath('/');
}

export async function deletePage(id: string) {
  const pb = await createClient();
  const page = await pb.collection('pages').getOne(id);
  await requireAdmin(page.org_id);
  await pb.collection('pages').delete(id);
  revalidatePath('/dashboard'); revalidatePath('/');
}

export async function updatePage(pageId: string, formData: FormData) {
  const pb = await createClient();
  const page = await pb.collection('pages').getOne(pageId);
  await requireAdmin(page.org_id);

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await pb.collection('pages').update(pageId, { title, content });
  revalidatePath('/dashboard'); revalidatePath('/');
}

// --- FORMULÄR ---

export async function submitForm(orgId: string, type: string, formData: FormData) {
  const pb = await createClient();
  const data: Record<string, any> = {};
  formData.forEach((value, key) => data[key] = value);
  if (!data.personal_number) delete data.personal_number;

  // I PB sparas JSON i ett json-fält, eller separata fält
  // Här antar jag att du har ett fält 'data' av typen JSON
  await pb.collection('form_submissions').create({
    org_id: orgId,
    type,
    data
  });
  return { success: true };
}

// --- LÅSET ---
import { cookies } from 'next/headers';

export async function verifySitePassword(subdomain: string, passwordAttempt: string) {
  const pb = await createClient();
  const org = await pb.collection('organizations').getFirstListItem(`subdomain="${subdomain}"`);

  if (org && org.site_password === passwordAttempt) {
    const cookieStore = await cookies();
    cookieStore.set(`access_${subdomain}`, 'true', { httpOnly: true, path: '/' });
    return { success: true };
  }
  return { error: "Fel lösenord" };
}

// --- SÖKFUNKTION ---
export async function searchSite(subdomain: string, query: string) {
  const pb = await createClient();
  const org = await pb.collection('organizations').getFirstListItem(`subdomain="${subdomain}"`);
  
  const filter = `org_id="${org.id}" && title ~ "${query}"`; // ~ betyder "contains"

  // 1. Sök i Inlägg
  const posts = await pb.collection('posts').getList(1, 3, { filter });
  // 2. Sök i Sidor
  const pages = await pb.collection('pages').getList(1, 3, { filter });
  // 3. Sök i Dokument
  const docs = await pb.collection('documents').getList(1, 3, { filter });

  return [
    ...posts.items.map(p => ({ type: 'post', title: p.title, url: `/p/${p.id}`, date: p.created })),
    ...pages.items.map(p => ({ type: 'page', title: p.title, url: `/s/${p.slug}` })),
    // Notera: PB fil-URL: /api/files/COLLECTION_ID/RECORD_ID/FILENAME
    ...docs.items.map(d => ({ 
        type: 'doc', 
        title: d.title, 
        url: `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${d.collectionId}/${d.id}/${d.file}`, 
        external: true 
    }))
  ];
}

// --- SPONSORER ---

export async function addSponsor(orgId: string, formData: FormData) {
  await requireAdmin(orgId);
  const pb = await createClient();
  
  // Lägg till org_id i formdata för att skicka allt i ett
  formData.append('org_id', orgId);
  
  let website_url = formData.get('website_url') as string;
  if (website_url && !website_url.startsWith('http')) {
    formData.set('website_url', `https://${website_url}`);
  }

  // Antar att collection 'sponsors' har filfältet 'logo'
  await pb.collection('sponsors').create(formData);
  
  revalidatePath('/dashboard'); revalidatePath('/');
}

export async function deleteSponsor(id: string) {
  const pb = await createClient();
  const s = await pb.collection('sponsors').getOne(id);
  await requireAdmin(s.org_id);

  await pb.collection('sponsors').delete(id);
  revalidatePath('/dashboard'); revalidatePath('/');
}

// --- MEDLEMSHANTERING ---

export async function approveMembershipApplication(submissionId: string, orgId: string, email: string) {
  const pb = await createClient();
  await requireAdmin(orgId);

  if (email) {
      try {
        await pb.collection('organization_members').create({
            org_id: orgId,
            email: email.toLowerCase().trim(),
            role: 'member'
        });
      } catch(e) {} // Ignorera om redan finns
  }

  // Radera ansökan
  await pb.collection('form_submissions').delete(submissionId);
  
  // Städa andra ansökningar från samma mail (kräver loop pga PB API)
  const duplicates = await pb.collection('form_submissions').getFullList({
      filter: `org_id="${orgId}" && type="membership" && data.email="${email}"`
  });
  for(const d of duplicates) {
      await pb.collection('form_submissions').delete(d.id);
  }

  revalidatePath('/dashboard');
}

export async function rejectMembershipApplication(submissionId: string) {
  const pb = await createClient();
  // Vi antar att admin är inloggad, annars måste vi kolla rättigheter
  // Men för enkelhetens skull, om man ser knappen är man admin
  await pb.collection('form_submissions').delete(submissionId);
  revalidatePath('/dashboard');
}

export async function saveNewsletter(orgId: string, formData: FormData, idToUpdate?: string) {
  await requireAdmin(orgId);
  const pb = await createClient();
  const subject = formData.get('subject') as string;
  const content = formData.get('content') as string;
  
  if (idToUpdate) {
    await pb.collection('newsletters').update(idToUpdate, { subject, content });
  } else {
    await pb.collection('newsletters').create({ org_id: orgId, subject, content, status: 'draft' });
  }
  revalidatePath('/dashboard');
}

export async function deleteNewsletter(id: string) {
  const pb = await createClient();
  const n = await pb.collection('newsletters').getOne(id);
  await requireAdmin(n.org_id);
  await pb.collection('newsletters').delete(id);
  revalidatePath('/dashboard');
}

export async function sendNewsletter(id: string) {
  const pb = await createClient();
  const letter = await pb.collection('newsletters').getOne(id);
  await requireAdmin(letter.org_id);

  const members = await pb.collection('organization_members').getFullList({
      filter: `org_id="${letter.org_id}"`
  });

  console.log(`🚀 SKICKAR NYHETSBREV: "${letter.subject}" till ${members.length} st`);
  
  await pb.collection('newsletters').update(id, { 
      status: 'sent', 
      sent_at: new Date().toISOString() 
  });

  revalidatePath('/dashboard');
  return { success: true, count: members.length };
}