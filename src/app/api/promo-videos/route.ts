/**
 * Promo Videos — MP4 file upload
 * POST multipart/form-data: { title, video: File } → upload to promo-videos bucket
 */
import { NextResponse } from 'next/server'
import { createAdminClient, ensureBucket } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file     = formData.get('video') as File | null
  const title    = ((formData.get('title') as string) ?? '').trim()

  if (!file || file.size === 0) return NextResponse.json({ error: 'קובץ חסר' }, { status: 400 })

  const supabase = createAdminClient()
  await ensureBucket(supabase, 'promo-videos')

  const ext  = file.name.split('.').pop() ?? 'mp4'
  const path = `${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: upErr } = await supabase.storage
    .from('promo-videos')
    .upload(path, buffer, { contentType: file.type || 'video/mp4', upsert: false })

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('promo-videos').getPublicUrl(path)

  const { data, error: dbErr } = await supabase
    .from('promo_videos')
    .insert({ title: title || file.name, video_url: publicUrl })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data)
}
