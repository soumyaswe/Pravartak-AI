"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { getModelWithFallback } from "@/lib/bedrock-client";

const model = getModelWithFallback();

export async function generateQuiz() {
  const user = await getAuthenticatedUser();

  const userWithDetails = await db.user.findUnique({
    where: { cognitoUserId: user.cognitoUserId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!userWithDetails) throw new Error("User not found");

  const prompt = `
    Generate 10 technical interview questions for a ${
      userWithDetails.industry
    } professional${
    userWithDetails.skills?.length ? ` with expertise in ${userWithDetails.skills.join(", ")}` : ""
  }.
    
    Each question should be multiple choice with 4 options.
    
    Return the response in this JSON format only, no additional text:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const quiz = JSON.parse(cleanedText);

    return quiz.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

export async function saveQuizResult(questions, answers, score) {
  const user = await getAuthenticatedUser();

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  // Get wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  // Only generate improvement tips if there are wrong answers
  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;

    try {
      const tipResult = await model.generateContent(improvementPrompt);

      improvementTip = tipResult.response.text().trim();
      console.log(improvementTip);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
      // Continue without improvement tip if generation fails
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });

    // Create activity record
    try {
      await db.userActivity.create({
        data: {
          userId: user.id,
          activityType: "SKILL_ASSESSED",
          description: `Completed practice quiz with score ${score.toFixed(1)}%`,
          metadata: {
            assessmentId: assessment.id,
            score: score,
            category: "Technical",
          },
        },
      });
    } catch (activityError) {
      console.error("Error creating activity record:", activityError);
      // Don't fail the assessment creation if activity logging fails
    }

    revalidatePath("/dashboard");
    revalidatePath("/interview");

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    // If it's a database connection error, return empty array instead of throwing
    // This allows the page to render and show an error message
    if (error.message?.includes("DATABASE_URL") || error.message?.includes("database") || error.message?.includes("Environment variable not found")) {
      console.warn("Database connection issue - returning empty assessments array");
      return [];
    }
    // For auth errors, throw so the page can handle redirect
    if (error.message?.includes("not authenticated") || error.message?.includes("Authentication required")) {
      throw error;
    }
    // For other errors, return empty array
    return [];
  }
}
