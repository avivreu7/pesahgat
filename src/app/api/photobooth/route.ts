/**
 * Photo Booth API
 *
 * Requires:
 * 1. Supabase table:
 *    CREATE TABLE photobooth_photos (
 *      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *      family_name text NOT NULL,
 *      photo_url text NOT NULL,
 *      frame_id integer NOT NULL DEFAULT 0,
 *      created_at timestamptz DEFAULT now()
 *    );
 * 2. Storage bucket "photobooth" set to public
 * 3. SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, ensureBucket } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('photobooth_photos')
    .select('id, family_name, photo_url, frame_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const { family_name, frame_id, image_data } = await req.json() as {
    family_name: string; frame_id: number; image_data: string
  }

  if (!family_name?.trim() || !image_data) {
    return NextResponse.json({ error: 'נתונים חסרים' }, { status: 400 })
  }

  const base64   = image_data.replace(/^data:image\/\w+;base64,/, '')
  const buffer   = Buffer.from(base64, 'base64')
  const supabase = createAdminClient()
  await ensureBucket(supabase, 'photobooth')
  const path = `${Date.now()}_f${frame_id}.jpg`

  const { error: upErr } = await supabase.storage
    .from('photobooth')
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: false })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('photobooth').getPublicUrl(path)

  const { data, error: dbErr } = await supabase
    .from('photobooth_photos')
    .insert({ family_name: family_name.trim(), photo_url: publicUrl, frame_id })
    .select()
    .single()
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const params    = new URL(req.url).searchParams
  const id        = params.get('id')
  const photo_url = params.get('photo_url') ?? ''
  if (!id) return NextResponse.json({ error: 'id חסר' }, { status: 400 })

  const supabase = createAdminClient()

  try {
    const url   = new URL(photo_url)
    const parts = url.pathname.split('/photobooth/')
    if (parts[1]) await supabase.storage.from('photobooth').remove([parts[1]])
  } catch { /* ignore storage errors */ }

  const { error } = await supabase.from('photobooth_photos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
