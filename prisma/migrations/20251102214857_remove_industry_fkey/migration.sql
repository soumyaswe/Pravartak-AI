-- AlterTable
-- Remove the foreign key constraint from User.industry to IndustryInsight.industry
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_industry_fkey";

-- AlterTable
-- Remove the users relation from IndustryInsight (this is just metadata, no actual DB change needed)
-- The relation was removed from the schema
