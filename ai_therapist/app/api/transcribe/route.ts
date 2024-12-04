import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  if (!req.body) {
    return new NextResponse('No audio file provided', { status: 400 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return new NextResponse('No audio file provided', { status: 400 });
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());

    const transcription = await openai.audio.transcriptions.create({
      file: new File([buffer], 'audio.webm', { type: 'audio/webm' }),
      model: "whisper-1",
      response_format: "text",
    });

    return NextResponse.json({ text: transcription });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return new NextResponse('An error occurred during transcription', { status: 500 });
  }
}

