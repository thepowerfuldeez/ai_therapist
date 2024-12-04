'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface FeedbackProps {
  dialogueId: string;
  onFeedbackSubmitted: () => void;
}

type FeedbackValue = 'yes' | 'no' | null;
type FeelingValue = 'better' | 'same' | 'worse' | null;

export default function Feedback({ dialogueId, onFeedbackSubmitted }: FeedbackProps) {
  const [helpful, setHelpful] = useState<FeedbackValue>(null)
  const [feeling, setFeeling] = useState<FeelingValue>(null)

  const handleSubmit = async () => {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dialogueId, helpful, feeling }),
    })

    if (response.ok) {
      onFeedbackSubmitted()
    }
  }

  return (
    <Card className="w-[350px] mx-auto mt-10">
      <CardHeader>
        <CardTitle>How was your experience?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label>Was this conversation helpful?</Label>
          <RadioGroup value={helpful || undefined} onValueChange={value => setHelpful(value as FeedbackValue)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="helpful-yes" />
              <Label htmlFor="helpful-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="helpful-no" />
              <Label htmlFor="helpful-no">No</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="mb-4">
          <Label>How do you feel after this conversation?</Label>
          <RadioGroup value={feeling || undefined} onValueChange={value => setFeeling(value as FeelingValue)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="better" id="feeling-better" />
              <Label htmlFor="feeling-better">Better</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="same" id="feeling-same" />
              <Label htmlFor="feeling-same">The Same</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="worse" id="feeling-worse" />
              <Label htmlFor="feeling-worse">Worse</Label>
            </div>
          </RadioGroup>
        </div>
        <Button onClick={handleSubmit} className="w-full">Submit Feedback</Button>
      </CardContent>
    </Card>
  )
}

