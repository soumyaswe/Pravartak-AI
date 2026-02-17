"use server";

import { db } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { getModelWithFallback } from '@/lib/bedrock-client';

const model = getModelWithFallback();

export const generateAIInsights = async (industry) => {
  const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  return JSON.parse(cleanedText);
};

export async function getIndustryInsights() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get user's industry directly
    const userWithIndustry = await db.user.findUnique({
      where: { id: user.id },
      select: {
        industry: true,
      },
    });

    if (!userWithIndustry || !userWithIndustry.industry) {
      console.log("User has no industry set");
      return null; // Return null instead of throwing - user might not have completed profile
    }

    // Check if industry insight exists
    let industryInsight = await db.industryInsight.findUnique({
      where: {
        industry: userWithIndustry.industry,
      },
    });

    // If no insights exist, generate them
    if (!industryInsight) {
      console.log("Generating new industry insights for:", userWithIndustry.industry);
      
      try {
        const insights = await generateAIInsights(userWithIndustry.industry);

        industryInsight = await db.industryInsight.create({
          data: {
            industry: userWithIndustry.industry,
            ...insights,
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      } catch (aiError) {
        console.error("Error generating AI insights:", aiError);
        // Return null instead of throwing - page can handle missing insights
        return null;
      }
    }

    return industryInsight;
  } catch (error) {
    console.error("Error in getIndustryInsights:", error);
    // Return null instead of throwing to prevent page crash
    return null;
  }
}
