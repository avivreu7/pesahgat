/**
 * Promo Images API
 * POST { title, image_data: base64 } → upload to promo-images bucket → insert DB row
 * DELETE ?id=&image_url= → remove from storage + DB
 *
 * Requires:
 *  - Table: promo_images (id uuid PK, title text, image_url text, created_at timestamptz)
 *  - Supabase Storage bucket "promo-images" (public)
 *  - SUPABASE_SERVICE_ROLE_KEY in .env.local  (or disable RLS on promo_images table)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, ensureBucket } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('promo_images')
    .select('id, title, image_url')
    .order('created_at', { ascending: true })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const { title, image_data } = await req.json() as { title?: string; image_data: string }

  if (!image_data) return NextResponse.json({ error: 'image_data חסר' }, { status: 400 })

  const supabase = createAdminClient()
  await ensureBucket(supabase, 'promo-images')
  const base64   = image_data.replace(/^data:image\/\w+;base64,/, '')
  const buffer   = Buffer.from(base64, 'base64')
  const path     = `${Date.now()}.jpg`

  const { error: upErr } = await supabase.storage
    .from('promo-images')
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: false })

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('promo-images').getPublicUrl(path)

  const { data, error: dbErr } = await supabase
    .from('promo_images')
    .insert({ title: (title ?? '').trim(), image_url: publicUrl })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const { id, image_url } = Object.fromEntries(new URL(req.url).searchParams)
  if (!id) return NextResponse.json({ error: 'id חסר' }, { status: 400 })

  const supabase = createAdminClient()

  if (image_url) {
    try {
      const url   = new URL(image_url)
      const parts = url.pathname.split('/promo-images/')
      if (parts[1]) await supabase.storage.from('promo-images').remove([parts[1]])
    } catch { /* ignore storage errors */ }
  }

  const { error } = await supabase.from('promo_images').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
