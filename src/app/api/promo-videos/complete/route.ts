/**
 * POST → after client uploads directly to Supabase Storage,
 * call this to get the public URL and save to DB.
 * Body: { path: string, title?: string }
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { path, title } = await req.json() as { path: string; title?: string }
  if (!path) return NextResponse.json({ error: 'path חסר' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: { publicUrl } } = supabase.storage.from('promo-videos').getPublicUrl(path)

  const { data, error } = await supabase
    .from('promo_videos')
    .insert({ title: (title ?? '').trim(), video_url: publicUrl })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
