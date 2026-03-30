/**
 * POST → returns a Supabase Storage signed upload URL
 * Body: { filename: string, content_type: string }
 * The client uploads directly to Supabase (bypasses Next.js 4.5MB body limit).
 */
import { NextResponse } from 'next/server'
import { createAdminClient, ensureBucket } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { filename, content_type } = await req.json() as { filename: string; content_type: string }
  if (!filename) return NextResponse.json({ error: 'filename חסר' }, { status: 400 })

  const supabase = createAdminClient()
  await ensureBucket(supabase, 'promo-videos')

  const path = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const { data, error } = await supabase.storage
    .from('promo-videos')
    .createSignedUploadUrl(path)

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'שגיאה ביצירת URL' }, { status: 500 })
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path,
    token: data.token,
  })
}
