-- CreateEnum
CREATE TYPE "ExerciseUnit" AS ENUM ('REPS', 'SECONDS');

-- AlterEnum
ALTER TYPE "WorkoutSessionStatus" ADD VALUE 'ABANDONED';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "city" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "primaryColor" TEXT NOT NULL DEFAULT '#c84411';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "unit" "ExerciseUnit" NOT NULL DEFAULT 'REPS';

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "WorkoutSessionExercise" ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "restSeconds" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "suggestedLoad" DOUBLE PRECISION,
ADD COLUMN     "unit" "ExerciseUnit" NOT NULL DEFAULT 'REPS';

-- CreateTable
CREATE TABLE "LoginThrottle" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginThrottle_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "LoginThrottle_expiresAt_idx" ON "LoginThrottle"("expiresAt");

-- Fail safely on inconsistent legacy data; never delete or silently merge sessions.
CREATE UNIQUE INDEX "WorkoutPlan_one_published_per_student" ON "WorkoutPlan"("studentId") WHERE status = 'PUBLISHED';
CREATE UNIQUE INDEX "WorkoutSession_one_in_progress_per_student" ON "WorkoutSession"("studentId") WHERE status = 'IN_PROGRESS';

-- Preserve the prescription for existing sessions.
UPDATE "WorkoutSessionExercise" se SET "restSeconds" = we."restSeconds", "suggestedLoad" = we."suggestedLoad", "notes" = we.notes
FROM "WorkoutExercise" we WHERE se."workoutExerciseId" = we.id;
UPDATE "WorkoutSessionExercise" se SET instructions = e.instructions, unit = e.unit
FROM "Exercise" e WHERE se."exerciseId" = e.id;
