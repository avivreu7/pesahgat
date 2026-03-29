/**
 * Food Yad-2 API
 *
 * Requires:
 * 1. Supabase table:
 *    CREATE TABLE food_items (
 *      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *      title text NOT NULL,
 *      description text NOT NULL DEFAULT '',
 *      image_url text,
 *      offered_by text NOT NULL,
 *      is_available boolean NOT NULL DEFAULT true,
 *      created_at timestamptz DEFAULT now()
 *    );
 * 2. Storage bucket "food-images" set to public
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('food_items')
    .select('id, title, description, image_url, offered_by, is_available, created_at')
    .order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const { title, description, offered_by, image_data } = await req.json() as {
    title: string; description: string; offered_by: string; image_data?: string
  }

  if (!title?.trim() || !offered_by?.trim()) {
    return NextResponse.json({ error: 'נתונים חסרים' }, { status: 400 })
  }

  const supabase = await createClient()
  let image_url: string | null = null

  if (image_data) {
    const base64 = image_data.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64, 'base64')
    const path   = `${Date.now()}.jpg`
    const { error: upErr } = await supabase.storage
      .from('food-images')
      .upload(path, buffer, { contentType: 'image/jpeg', upsert: false })
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('food-images').getPublicUrl(path)
      image_url = publicUrl
    }
  }

  const { data, error } = await supabase
    .from('food_items')
    .insert({ title: title.trim(), description: (description ?? '').trim(), offered_by: offered_by.trim(), image_url })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const { id } = Object.fromEntries(new URL(req.url).searchParams)
  if (!id) return NextResponse.json({ error: 'id חסר' }, { status: 400 })

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('food_items')
    .select('is_available')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase
    .from('food_items')
    .update({ is_available: !existing?.is_available })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { id } = Object.fromEntries(new URL(req.url).searchParams)
  if (!id) return NextResponse.json({ error: 'id חסר' }, { status: 400 })
  const supabase = await createClient()
  const { error } = await supabase.from('food_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
