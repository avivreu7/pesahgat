'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/* ── Israel timezone helper ─────────────────────────── */
// datetime-local inputs return 'YYYY-MM-DDTHH:MM' without timezone.
// Passover is always in April → Israel is on IDT = UTC+3.
function toIsraelISO(datetimeLocal: string): string {
  const s = datetimeLocal.trim()
  if (s.includes('+') || s.includes('Z')) return s        // already has TZ
  const base = s.length === 16 ? `${s}:00` : s           // ensure seconds
  return `${base}+03:00`                                  // append Israel IDT
}

/* ── Settings ────────────────────────────────────────── */
export async function saveSettingsAction(formData: FormData) {
  const main_video_url   = (formData.get('main_video_url') as string).trim()
  const main_video_title = ((formData.get('main_video_title') as string) ?? '').trim()
  const raw_start_time   = (formData.get('start_time') as string).trim()
  const start_time       = toIsraelISO(raw_start_time)

  const supabase = await createClient()

  // Core fields — always exist
  const { error } = await supabase
    .from('settings')
    .upsert({ id: 1, main_video_url, start_time }, { onConflict: 'id' })
  if (error) throw new Error(error.message)

  // main_video_title — column may not exist yet; ignore if it fails
  if (main_video_title) {
    await supabase
      .from('settings')
      .update({ main_video_title } as never)
      .eq('id', 1)
      .then(() => null) // swallow error if column missing
  }

  revalidatePath('/admin')
  revalidatePath('/')
}

/* ── Set time directly (for emergency use) ──────────── */
export async function setStartTimeAction(isoTime: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('settings')
    .upsert({ id: 1, start_time: isoTime }, { onConflict: 'id' })
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
}

/* ── Admin bypass: force video to play immediately ── */
export async function forceVideoNowAction() {
  const supabase = await createClient()
  // Set start_time to 2 minutes ago — countdown reaches 0 immediately
  const past = new Date(Date.now() - 120_000).toISOString()
  const { error } = await supabase
    .from('settings')
    .upsert({ id: 1, start_time: past }, { onConflict: 'id' })
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
}

/* ── Promo videos ────────────────────────────────────── */
export async function addPromoAction(formData: FormData) {
  const video_url = (formData.get('video_url') as string).trim()
  const title = (formData.get('title') as string).trim()

  const supabase = await createClient()
  const { error } = await supabase.from('promo_videos').insert({ video_url, title })
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function deletePromoAction(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()
  const { error } = await supabase.from('promo_videos').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function updatePromoAction(formData: FormData) {
  const id = formData.get('id') as string
  const video_url = (formData.get('video_url') as string).trim()
  const title = (formData.get('title') as string).trim()

  const supabase = await createClient()
  const { error } = await supabase.from('promo_videos').update({ video_url, title }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
}

/* ── News ticker ─────────────────────────────────────── */
export async function addTickerAction(formData: FormData) {
  const text = (formData.get('text') as string).trim()
  const supabase = await createClient()
  const { error } = await supabase.from('news_ticker').insert({ text })
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function deleteTickerAction(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()
  const { error } = await supabase.from('news_ticker').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function toggleTickerAction(formData: FormData) {
  const id     = formData.get('id') as string
  const active = formData.get('active') === 'true'
  const supabase = await createClient()
  const { error } = await supabase.from('news_ticker').update({ active }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

/* ── Promo images ────────────────────────────────────── */
/**
 * Requires in Supabase:
 * 1. Table:   CREATE TABLE promo_images (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, title text NOT NULL DEFAULT '', image_url text NOT NULL, created_at timestamptz DEFAULT now());
 * 2. Storage: bucket named "promo-images" set to public
 * 3. Storage policy: allow INSERT for the service_role (or anon if preferred)
 */
export async function uploadPromoImageAction(formData: FormData) {
  const file  = formData.get('image') as File
  const title = ((formData.get('title') as string) ?? '').trim()

  if (!file || file.size === 0) throw new Error('קובץ חסר')

  const supabase = await createClient()
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `${Date.now()}.${ext}`

  const { error: upErr } = await supabase.storage
    .from('promo-images')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (upErr) throw new Error(upErr.message)

  const { data: { publicUrl } } = supabase.storage
    .from('promo-images')
    .getPublicUrl(path)

  const { error: dbErr } = await supabase
    .from('promo_images')
    .insert({ title, image_url: publicUrl })
  if (dbErr) throw new Error(dbErr.message)

  revalidatePath('/admin')
  revalidatePath('/')
}

export async function deletePromoImageAction(formData: FormData) {
  const id        = formData.get('id') as string
  const imageUrl  = formData.get('image_url') as string

  const supabase = await createClient()

  // Extract storage path from URL and remove from bucket
  try {
    const url  = new URL(imageUrl)
    const parts = url.pathname.split('/promo-images/')
    if (parts[1]) {
      await supabase.storage.from('promo-images').remove([parts[1]])
    }
  } catch { /* ignore storage errors — delete DB row regardless */ }

  const { error } = await supabase.from('promo_images').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/')
}

/* ── Reset actions ───────────────────────────────────── */
export async function resetGreetingsAction() {
  const supabase = await createClient()
  // Delete all rows — neq on a non-null column covers everything
  const { error } = await supabase
    .from('greetings')
    .delete()
    .not('id', 'is', null)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin')
}

export async function resetCounterAction(name: string) {
  const supabase = await createClient()

  if (name === 'kneidlach') {
    // Kneidlach now lives in kneidlach_makers — wipe all rows
    const { error } = await supabase
      .from('kneidlach_makers')
      .delete()
      .not('id', 'is', null)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('counters')
      .update({ total_count: 0 })
      .eq('name', name)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/afikoman')
}

export async function resetAllDataAction() {
  await resetGreetingsAction()
  await resetCounterAction('kneidlach')
  await resetCounterAction('afikoman')
}

/* ── Reset photobooth ────────────────────────────────── */
export async function resetPhotoboothAction() {
  const supabase = createAdminClient()
  const { data: photos } = await supabase.from('photobooth_photos').select('photo_url').not('id', 'is', null)
  if (photos?.length) {
    const paths = photos.map(p => {
      try { return new URL(p.photo_url).pathname.split('/photobooth/')[1] } catch { return null }
    }).filter(Boolean) as string[]
    if (paths.length) await supabase.storage.from('photobooth').remove(paths)
  }
  const { error } = await supabase.from('photobooth_photos').delete().not('id', 'is', null)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/photobooth')
}

/* ── Reset quilt ──────────────────────────────────────── */
export async function resetQuiltAction() {
  const supabase = createAdminClient()
  const { data: drawings } = await supabase.from('quilt_drawings').select('image_url').not('id', 'is', null)
  if (drawings?.length) {
    const paths = drawings.map(d => {
      try { return new URL(d.image_url).pathname.split('/quilt-drawings/')[1] } catch { return null }
    }).filter(Boolean) as string[]
    if (paths.length) await supabase.storage.from('quilt-drawings').remove(paths)
  }
  const { error } = await supabase.from('quilt_drawings').delete().not('id', 'is', null)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/quilt')
}

/* ── Reset food ───────────────────────────────────────── */
export async function resetFoodAction() {
  const supabase = createAdminClient()
  const { error } = await supabase.from('food_items').delete().not('id', 'is', null)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/food')
}

/* ── Reset Elijah memory ─────────────────────────────── */
export async function resetElijahMemoryAction() {
  const supabase = createAdminClient()
  const { error } = await supabase.from('elijah_memory').delete().not('id', 'is', null)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

/* ── Site lock mode ───────────────────────────────────── */
export async function setSiteLockAction(locked: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('settings')
    .upsert({ id: 1, site_locked: locked }, { onConflict: 'id' })
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin')
}
