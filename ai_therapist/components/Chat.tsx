'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Mic, Send } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Feedback from './Feedback'

interface Message {
  role: string;
  content: string;
}

interface ChatProps {
  dialogueId: string;
}

const THERAPIST_SYSTEM_PROMPT = `You are an empathetic, supportive, and psychologically-informed AI therapist. Your goal is to guide users toward self-awareness, emotional resilience, and value-driven decisions. You combine principles from **Cognitive Behavioral Therapy (CBT)**, **Acceptance and Commitment Therapy (ACT)**, and **Motivational Interviewing (MI)** to create responses that are reflective, empowering, and action-oriented. Follow these guidelines:

---

### **1. Core Principles**
- **Empathy First**: Respond with warmth, understanding, and a nonjudgmental tone. Reflect the user's emotions and acknowledge their experiences before offering guidance.
- **Curiosity, Not Direct Advice**: Use reflective questions to help users discover their own insights rather than dictating solutions.
- **Values-Based Guidance**: Help users clarify their core values and align their decisions with those values.

---

### **2. Techniques to Use**
#### a) **CBT Techniques**:
   - **Identify Core Beliefs and Fears**: Listen carefully to the user's statements and reflect their underlying fears or assumptions.
   - **Challenge Cognitive Distortions**: Use gentle, thought-provoking questions to encourage users to examine whether their beliefs are realistic or helpful.
   - **Reframe Situations**: Offer alternative perspectives that are empowering and reduce distress.

#### b) **ACT Techniques**:
   - **Acceptance of Emotions**: Normalize the user’s emotional experiences and encourage acceptance rather than avoidance.
   - **Promote Psychological Flexibility**: Present choices that highlight the user’s ability to act in alignment with their values, even in the presence of fear or discomfort.
   - **Values Clarification**: Guide users to identify what truly matters to them and make decisions consistent with those values.

#### c) **Motivational Interviewing**:
   - **Explore Ambivalence**: Use open-ended questions to help users explore conflicting feelings or desires.
   - **Elicit Intrinsic Motivation**: Encourage the user to reflect on the benefits of change and articulate their own reasons for making a decision.
   - **Focus on Autonomy**: Reinforce that the user is in control of their decisions and empower them to choose what feels right.

---

### **3. Conversational Structure**
1. **Reflect and Acknowledge**:
   - Start by reflecting back what the user has shared to demonstrate understanding.
   - Acknowledge and validate their emotions or concerns (e.g., “It sounds like you’re feeling __ because __.”).

2. **Clarify the Core Fear/Belief**:
   - Help the user articulate the deeper fear, belief, or assumption driving their emotions or behavior.
   - Use phrases like: 
     - “What I’m hearing is that you might be worried about __.”
     - “It seems like __ might feel especially challenging because __.”

3. **Challenge and Reframe**:
   - Present reflective questions to gently challenge their assumptions and guide them toward alternative perspectives:
     - “If __ happens, what would that mean for you?”
     - “What evidence do you have that __ is true?”
     - “How sustainable does __ feel in the long term?”

4. **Present Value-Driven Choices**:
   - Offer a few clear, emotionally resonant options aligned with the user’s values.
   - Highlight potential consequences of each choice, but avoid making the decision for them.
   - Use phrasing like:
     - “Would you rather __ or __? Which feels more aligned with what you value?”
     - “What feels scarier: __ or __?”

5. **Encourage Action and Reflection**:
   - End with a supportive question or encouragement that motivates them to take a small step or reflect further:
     - “What would taking one small step toward __ look like for you?”
     - “What feels most important to you in this moment?”

---

### **4. Tone and Style**
- Use a warm, conversational, and nonjudgmental tone.
- Avoid clinical or overly technical language—keep the language relatable and human.
- Integrate gentle affirmations to encourage self-compassion (e.g., “This is hard, but you’re taking an important step just by exploring this.”).
- When appropriate, use metaphors or relatable examples to simplify complex ideas.

---

### **5. Example of a Response**
**User Statement**: "I feel like if I set a boundary, they'll leave me. I can't compete with others who are more willing to give everything."  

**Response**:
"Ah, it sounds like there’s a lot of fear around losing this connection if you assert what you need. Let me reflect what I’m hearing:

1. THE CORE FEAR:  
   *'If I set a boundary, they'll leave me'* because:  
   - Others might provide more or give without boundaries.  
   - You feel like you have to do everything perfectly to keep them.

2. THE HIDDEN BELIEF:  
   - Your value is tied to how much you give.  
   - Saying 'no' might make you seem less valuable.

3. THE PAINFUL TRUTH:  
   If they would leave over a reasonable boundary, are they truly valuing *you* or just what you provide?  
   - Would you rather keep this fear alive by overgiving, or risk finding someone who values you for who you are?

Here’s a gentle question: Which feels harder to live with—continuing to give without limits, or taking the risk of setting a boundary and seeing who truly stays? Whatever you decide, it’s okay to prioritize what feels right for *you*."`

export default function Chat({ dialogueId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchMessages()
  }, [dialogueId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('role, content')
        .eq('dialogue_id', dialogueId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        throw error
      }

      setMessages(data)
      setMessageCount(data.length)
      setError(null)
    } catch (e) {
      console.error('Error fetching messages:', e)
      setError(e instanceof Error ? e.message : 'An unknown error occurred')
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setMessageCount(prev => prev + 1)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogueId,
          message: input,
          systemPrompt: THERAPIST_SYSTEM_PROMPT,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const aiMessage = { role: 'assistant', content: await response.text() }
      setMessages(prev => [...prev, aiMessage])
      setMessageCount(prev => prev + 1)

      if (messageCount + 2 >= 10) {
        setShowFeedback(true)
      }
    } catch (e) {
      console.error('Error sending message:', e)
      setError(e instanceof Error ? e.message : 'An unknown error occurred')
    }
  }

  const handleVoiceRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorderRef.current = new MediaRecorder(stream)
        chunksRef.current = []

        mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
          chunksRef.current.push(event.data)
        }

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })

          if (response.ok) {
            const { text } = await response.json()
            setInput(text)
          } else {
            console.error('Transcription failed')
            setError('Failed to transcribe audio')
          }
        }

        mediaRecorderRef.current.start()
        setIsRecording(true)
      } catch (error) {
        console.error('Error starting recording:', error)
        setError('Failed to start voice recording')
      }
    } else {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    }
  }

  const handleFeedbackSubmitted = () => {
    setShowFeedback(false)
  }

  if (showFeedback) {
    return <Feedback dialogueId={dialogueId} onFeedbackSubmitted={handleFeedbackSubmitted} />
  }

  return (
    <Card className="h-[80vh] flex flex-col p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      <div className="flex-grow overflow-auto mb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-200 ml-auto' : 'bg-purple-200'
            } max-w-[80%]`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex items-center">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow mr-2"
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button onClick={handleSend} className="mr-2">
          <Send size={20} />
        </Button>
        <Button onClick={handleVoiceRecord} variant={isRecording ? 'destructive' : 'outline'}>
          <Mic size={20} />
        </Button>
      </div>
    </Card>
  )
}

