/**
 * News Ticker API
 *
 * Requires this table in Supabase:
 * CREATE TABLE news_ticker (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   text text NOT NULL,
 *   active boolean NOT NULL DEFAULT true,
 *   created_at timestamptz DEFAULT now()
 * );
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('news_ticker')
    .select('id, text')
    .eq('active', true)
    .order('created_at', { ascending: true })
  return NextResponse.json(data ?? [])
}
