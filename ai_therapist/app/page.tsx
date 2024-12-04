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
    // Create a new dialogue for each page visit
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
  } catch (e) {
    console.error('Error creating dialogue:', e)
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
              <p>Error: Could not create a new dialogue. Please try again.</p>
              {error && <p>Details: {error.message}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

