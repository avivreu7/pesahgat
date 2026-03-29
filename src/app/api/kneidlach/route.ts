/**
 * Kneidlach Makers API
 *
 * Requires this table in Supabase (run once in SQL editor):
 *
 * CREATE TABLE kneidlach_makers (
 *   id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
 *   maker_name  text    UNIQUE NOT NULL,
 *   count       integer NOT NULL DEFAULT 0,
 *   created_at  timestamptz DEFAULT now()
 * );
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export interface Maker { maker_name: string; count: number }

async function getMakers() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('kneidlach_makers')
    .select('maker_name, count')
    .order('count', { ascending: false })
  return (data ?? []) as Maker[]
}

export async function GET() {
  const makers = await getMakers()
  const total  = makers.reduce((s, m) => s + m.count, 0)
  return NextResponse.json({ makers, total })
}

export async function POST(req: Request) {
  const { name } = await req.json() as { name: string }
  if (!name?.trim()) return NextResponse.json({ error: 'שם חסר' }, { status: 400 })

  const supabase  = await createClient()
  const makerName = name.trim()

  const { data: existing } = await supabase
    .from('kneidlach_makers')
    .select('id, count')
    .eq('maker_name', makerName)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('kneidlach_makers')
      .update({ count: existing.count + 1 })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('kneidlach_makers')
      .insert({ maker_name: makerName, count: 1 })
  }

  const makers = await getMakers()
  const total  = makers.reduce((s, m) => s + m.count, 0)
  return NextResponse.json({ makers, total })
}
