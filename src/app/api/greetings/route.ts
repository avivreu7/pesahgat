import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('greetings')
    .select('id, family_name, message, gif_url, created_at')
    .order('created_at', { ascending: false })
    .limit(80)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const family_name = (body.family_name ?? '').trim().slice(0, 60)
  const message     = (body.message     ?? '').trim().slice(0, 400)
  const gif_url     = (body.gif_url     ?? '').trim().slice(0, 500)

  if (!family_name || !message) {
    return NextResponse.json({ error: 'שם משפחה והודעה נדרשים' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('greetings')
    .insert({ family_name, message, gif_url: gif_url || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
