"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-server";

/**
 * Simple profile completion calculation
 * This is a backup function in case the comprehensive one fails
 */
export async function getSimpleProfileCompletion() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return { completionPercentage: 0 };
    }

    // Simple checks without complex queries
    let completed = 0;
    const total = 10;

    // Basic info
    if (user.name && user.email) completed++;
    if (user.imageUrl) completed++;
    if (user.phone) completed++;
    if (user.location) completed++;
    if (user.bio && user.bio.length >= 50) completed++;
    if (user.industry) completed++;
    if (user.experience != null) completed++;
    if (user.skills && user.skills.length >= 3) completed++;
    if (user.linkedIn) completed++;
    if (user.portfolio) completed++;

    const completionPercentage = Math.round((completed / total) * 100);

    console.log('Simple profile completion:', completionPercentage);

    return {
      completionPercentage,
      completedCount: completed,
      totalCount: total,
    };
  } catch (error) {
    console.error("Error in simple profile completion:", error);
    return {
      completionPercentage: 0,
      completedCount: 0,
      totalCount: 10,
    };
  }
}
