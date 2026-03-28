'use server'

import { createClient } from '@/lib/supabase/server'
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
  const main_video_url = (formData.get('main_video_url') as string).trim()
  const raw_start_time = (formData.get('start_time') as string).trim()
  const start_time     = toIsraelISO(raw_start_time)

  const supabase = await createClient()
  const { error } = await supabase
    .from('settings')
    .upsert({ id: 1, main_video_url, start_time }, { onConflict: 'id' })

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
  const { error } = await supabase
    .from('counters')
    .update({ total_count: 0 })
    .eq('name', name)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/afikoman')
}

export async function resetAllDataAction() {
  await resetGreetingsAction()
  await resetCounterAction('kneidlach')
  await resetCounterAction('afikoman')
}
