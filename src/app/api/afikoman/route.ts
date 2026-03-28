import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const NAME = 'afikoman'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('counters')
    .select('total_count')
    .eq('name', NAME)
    .maybeSingle()
  return NextResponse.json({ count: data?.total_count ?? 0 })
}

export async function POST() {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('counters')
    .select('id, total_count')
    .eq('name', NAME)
    .maybeSingle()

  let newCount: number
  if (existing) {
    newCount = existing.total_count + 1
    await supabase.from('counters').update({ total_count: newCount }).eq('id', existing.id)
  } else {
    newCount = 1
    await supabase.from('counters').insert({ name: NAME, total_count: 1 })
  }
  return NextResponse.json({ count: newCount })
}
