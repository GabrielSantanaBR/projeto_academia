ALTER TABLE "Exercise" ADD COLUMN "videoUrl" TEXT;
ALTER TABLE "WorkoutSessionExercise" ADD COLUMN "videoUrl" TEXT;
CREATE TABLE "SubscriptionPlan" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL, "durationDays" INTEGER NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "SubscriptionPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SubscriptionPlan_organizationId_name_key" ON "SubscriptionPlan"("organizationId", "name");
CREATE TABLE "StudentSubscription" (
  "id" TEXT NOT NULL PRIMARY KEY, "studentId" TEXT NOT NULL, "planId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentSubscription_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StudentSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StudentSubscription_studentId_key" ON "StudentSubscription"("studentId");
CREATE TABLE "NutritionNote" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "studentId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL, "body" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NutritionNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NutritionNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "NutritionNote_organizationId_studentId_createdAt_idx" ON "NutritionNote"("organizationId", "studentId", "createdAt");
