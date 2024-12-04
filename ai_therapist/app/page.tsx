import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Chat from '@/components/Chat'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default async function Home() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  let dialogueId = null;
  let error: Error | null = null;

  try {
    // First, try to fetch the most recent dialogue
    const { data: dialogues, error: fetchError } = await supabase
      .from('dialogues')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('Error fetching dialogues:', fetchError)
      throw fetchError
    }

    if (dialogues && dialogues.length > 0) {
      dialogueId = dialogues[0].id;
    } else {
      // If no dialogue exists, create a new one
      const { data: newDialogue, error: insertError } = await supabase
        .from('dialogues')
        .insert({})
        .select()

      if (insertError) {
        console.error('Error creating new dialogue:', insertError)
        throw insertError
      }

      if (newDialogue && newDialogue.length > 0) {
        dialogueId = newDialogue[0].id;
      } else {
        throw new Error('Failed to create new dialogue')
      }
    }
  } catch (e) {
    console.error('Error creating or fetching dialogue:', e)
    error = e instanceof Error ? e : new Error('An unknown error occurred')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-purple-700">AI Therapist</CardTitle>
          <CardDescription className="text-center text-lg mt-2">
            A safe space to talk and reflect. How are you feeling today?
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dialogueId ? (
            <Chat dialogueId={dialogueId} />
          ) : (
            <div>
              <p>Error: Could not create or fetch a dialogue. Please try again.</p>
              {error && <p>Details: {error.message}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

