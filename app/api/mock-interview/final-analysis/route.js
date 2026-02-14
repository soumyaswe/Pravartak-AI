import { getVertexAIModel, generateWithFallback } from '@/lib/vertex-ai';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { history, jobRole } = await request.json();

    if (!history || !Array.isArray(history) || history.length === 0) {
      return NextResponse.json(
        { error: 'Analysis history is required' },
        { status: 400 }
      );
    }

    // Model will be selected by generateWithFallback helper

    // Calculate averages and totals
    const avgWpm = history.reduce((sum, item) => sum + (item.wpm || 0), 0) / history.length;
    const totalPauses = history.reduce((sum, item) => sum + (item.pauseCount || 0), 0);
    const totalFillers = history.reduce((sum, item) => sum + (item.fillerCount || 0), 0);
    const avgContentScore = history.reduce((sum, item) => sum + (item.score || 0), 0) / history.length;
    const avgConfidence = history.reduce((sum, item) => sum + (item.confidence || 0), 0) / history.length;

    const summaryPrompt = `
      You are an expert career coach providing a final summary for a mock interview for a '${jobRole}' position.
      The candidate has answered ${history.length} questions. Here is their performance data:
      
      **Speech Delivery Metrics:**
      - Average Speaking Pace: ${avgWpm.toFixed(0)} WPM (Target: 130-150 WPM)
      - Total Pauses: ${totalPauses}
      - Total Filler Words: ${totalFillers}
      - Average Confidence: ${(avgConfidence * 100).toFixed(0)}%
      
      **Content Quality:**
      - Average Content Score: ${avgContentScore.toFixed(1)} out of 5
      
      **Individual Question Performance:**
      ${history.map((item, index) => `
      Question ${index + 1}:
      - Content Score: ${item.score || 0}/5
      - Speaking Pace: ${item.wpm || 0} WPM
      - Filler Words: ${item.fillerCount || 0}
      - Justification: ${item.justification || 'No feedback available'}
      `).join('\n')}

      Provide a comprehensive, encouraging, and actionable summary. Use Markdown formatting. 
      Structure your feedback into:
      
      ## 🎯 Overall Performance
      Brief overview of their performance
      
      ## 💪 Strengths
      What they did well (2-3 points)
      
      ## 📈 Areas for Improvement
      Specific areas to work on (2-3 points with actionable advice)
      
      ## 🎤 Speaking Delivery Tips
      Specific advice on pace, pauses, and filler words
      
      ## 💡 Final Encouragement
      Motivational closing with next steps
      
      Keep the tone professional yet encouraging. Be specific and actionable in your recommendations.
    `;

    const result = await generateWithFallback(summaryPrompt);
    // Vertex AI response format: result.response.candidates[0].content.parts[0].text
    const analysis = result.response.candidates[0].content.parts[0].text;

    return NextResponse.json({
      analysis,
      metrics: {
        avgWpm: Math.round(avgWpm),
        totalPauses,
        totalFillers,
        avgContentScore: Math.round(avgContentScore * 10) / 10,
        avgConfidence: Math.round(avgConfidence * 100),
        questionsAnswered: history.length
      }
    });

  } catch (error) {
    console.error('Error generating final analysis:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating the final analysis. Please try again.' },
      { status: 500 }
    );
  }
}