import { db } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("Running migration to remove foreign key constraint...");
    
    // First, check if the constraint exists
    const constraints = await db.$queryRaw`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'User' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%industry%';
    `;
    
    console.log("Found constraints:", constraints);
    
    // Drop the foreign key constraint
    try {
      await db.$executeRaw`ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_industry_fkey";`;
      console.log("Attempted to drop User_industry_fkey");
    } catch (e) {
      console.log("First attempt failed:", e.message);
    }
    
    // Also try without the IF EXISTS clause (PostgreSQL might need this)
    try {
      await db.$executeRaw`ALTER TABLE "User" DROP CONSTRAINT "User_industry_fkey" CASCADE;`;
      console.log("Dropped constraint with CASCADE");
    } catch (e) {
      console.log("CASCADE attempt:", e.message);
    }
    
    // Verify it's gone
    const remainingConstraints = await db.$queryRaw`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'User' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%industry%';
    `;
    
    console.log("Remaining constraints:", remainingConstraints);
    
    return Response.json({ 
      success: true, 
      message: "Migration completed",
      beforeConstraints: constraints,
      afterConstraints: remainingConstraints
    });
  } catch (error) {
    console.error("Migration error:", error);
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
