/**
 * Family Quilt API
 *
 * Requires:
 * 1. Supabase table:
 *    CREATE TABLE quilt_drawings (
 *      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *      family_name text NOT NULL,
 *      image_url text NOT NULL,
 *      created_at timestamptz DEFAULT now()
 *    );
 * 2. Storage bucket "quilt-drawings" set to public
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, ensureBucket } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('quilt_drawings')
    .select('id, family_name, image_url, created_at')
    .order('created_at', { ascending: true })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const { family_name, image_data } = await req.json() as {
    family_name: string; image_data: string
  }

  if (!family_name?.trim() || !image_data) {
    return NextResponse.json({ error: 'נתונים חסרים' }, { status: 400 })
  }

  const base64 = image_data.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64, 'base64')

  const supabase = createAdminClient()
  await ensureBucket(supabase, 'quilt-drawings')
  const path = `${Date.now()}_${family_name.trim().replace(/\s/g, '_')}.jpg`

  const { error: upErr } = await supabase.storage
    .from('quilt-drawings')
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: false })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('quilt-drawings').getPublicUrl(path)

  const { data, error: dbErr } = await supabase
    .from('quilt_drawings')
    .insert({ family_name: family_name.trim(), image_url: publicUrl })
    .select()
    .single()
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json(data)
}
