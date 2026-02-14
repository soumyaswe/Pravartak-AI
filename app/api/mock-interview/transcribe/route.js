import { NextResponse } from 'next/server';
import speech from '@google-cloud/speech';
import path from 'path';

// Initialize the Google Cloud Speech client
let client;
try {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    console.error('GOOGLE_APPLICATION_CREDENTIALS is not set');
  } else {
    client = new speech.SpeechClient({
      keyFilename: path.resolve(process.cwd(), credentialsPath)
    });
  }
} catch (error) {
  console.error('Failed to initialize Speech client:', error);
}

export async function POST(request) {
  try {
    // Check if client is initialized
    if (!client) {
      return NextResponse.json(
        { error: 'Speech-to-text service is not configured. Please set GOOGLE_APPLICATION_CREDENTIALS.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    console.log('Transcribing audio file:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // Convert audio blob to buffer
    const audioBytes = Buffer.from(await audioFile.arrayBuffer());

    // Configure the speech recognition request
    const audio = {
      content: audioBytes.toString('base64'),
    };

    const config = {
      encoding: 'WEBM_OPUS', // Match the MediaRecorder format
      sampleRateHertz: 48000, // WebM Opus default sample rate
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      model: 'default',
      useEnhanced: true,
    };

    const recognitionConfig = {
      audio,
      config,
    };

    console.log('Sending audio to Google Cloud Speech-to-Text API...');

    // Perform the speech recognition
    const [response] = await client.recognize(recognitionConfig);

    if (!response.results || response.results.length === 0) {
      console.log('No transcription results from Google Cloud Speech API');
      return NextResponse.json({
        transcript: '',
        confidence: 0,
        words: [],
        warning: 'No speech detected in the audio'
      });
    }

    // Extract transcription and metadata
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join(' ');

    const confidence = response.results.length > 0
      ? response.results[0].alternatives[0].confidence || 0
      : 0;

    // Extract word-level timing information
    const words = response.results
      .flatMap(result => result.alternatives[0].words || [])
      .map(wordInfo => ({
        word: wordInfo.word,
        startTime: wordInfo.startTime ? 
          parseFloat(wordInfo.startTime.seconds || 0) + (wordInfo.startTime.nanos || 0) / 1e9 : 0,
        endTime: wordInfo.endTime ? 
          parseFloat(wordInfo.endTime.seconds || 0) + (wordInfo.endTime.nanos || 0) / 1e9 : 0,
      }));

    // Calculate speech metrics
    const metrics = calculateSpeechMetrics(transcription, words);

    console.log('Transcription successful:', {
      length: transcription.length,
      confidence,
      wordCount: words.length
    });

    return NextResponse.json({
      transcript: transcription,
      confidence,
      words,
      metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in Google Cloud Speech-to-Text:', error);
    
    // Provide detailed error information
    const errorMessage = error.message || 'Unknown error occurred';
    const errorDetails = {
      error: 'Transcription failed',
      message: errorMessage,
      details: error.details || 'No additional details available'
    };

    return NextResponse.json(errorDetails, { status: 500 });
  }
}

// Calculate speech metrics from transcription and word timing
function calculateSpeechMetrics(transcript, words) {
  if (!transcript || words.length === 0) {
    return {
      wordCount: 0,
      wpm: 0,
      pauseCount: 0,
      fillerCount: 0,
      duration: 0
    };
  }

  // Calculate total duration
  const duration = words.length > 0 
    ? words[words.length - 1].endTime 
    : 0;

  // Calculate words per minute
  const wordCount = words.length;
  const wpm = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;

  // Detect pauses (gaps > 0.5 seconds between words)
  let pauseCount = 0;
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].startTime - words[i - 1].endTime;
    if (gap > 0.5) {
      pauseCount++;
    }
  }

  // Detect filler words
  const fillerWords = ['um', 'uh', 'like', 'so', 'you know', 'actually', 'basically', 'literally', 'kind of', 'sort of'];
  const transcriptLower = transcript.toLowerCase();
  const fillerCount = fillerWords.reduce((count, filler) => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = transcriptLower.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);

  return {
    wordCount,
    wpm,
    pauseCount,
    fillerCount,
    duration: Math.round(duration)
  };
}
