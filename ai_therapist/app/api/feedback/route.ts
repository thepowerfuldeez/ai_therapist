import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { dialogueId, helpful, feeling } = await req.json()
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const { error } = await supabase
      .from('feedback')
      .insert({ dialogue_id: dialogueId, helpful, feeling })

    if (error) throw error

    return new NextResponse('Feedback submitted successfully')
  } catch (error) {
    console.error('Error:', error)
    return new NextResponse('An error occurred', { status: 500 })
  }
}

