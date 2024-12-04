import { NextRequest, NextResponse } from 'next/server'
import Together from 'together-ai'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY })

export async function POST(req: NextRequest) {
  const { dialogueId, message, systemPrompt } = await req.json()
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // Fetch previous messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('role, content')
      .eq('dialogue_id', dialogueId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      throw error
    }

    const allMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
      { role: 'user', content: message },
    ]

    const stream = await together.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
      messages: allMessages,
      stream: true,
    })

    // Save user message
    const { error: insertError } = await supabase.from('messages').insert({
      dialogue_id: dialogueId,
      role: 'user',
      content: message,
    })

    if (insertError) {
      console.error('Error inserting user message:', insertError)
      throw insertError
    }

    let aiResponse = ''
    for await (const chunk of stream) {
      aiResponse += chunk.choices[0]?.delta?.content || ''
    }

    // Save AI response
    const { error: aiInsertError } = await supabase.from('messages').insert({
      dialogue_id: dialogueId,
      role: 'assistant',
      content: aiResponse,
    })

    if (aiInsertError) {
      console.error('Error inserting AI response:', aiInsertError)
      throw aiInsertError
    }

    return new NextResponse(aiResponse)
  } catch (error) {
    console.error('Error:', error)
    return new NextResponse('An error occurred', { status: 500 })
  }
}

