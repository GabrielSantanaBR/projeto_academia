CREATE TABLE "ExerciseFeedback" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "studentId" TEXT NOT NULL,
  "exerciseName" TEXT NOT NULL, "videoUrl" TEXT NOT NULL, "comment" TEXT, "coachReply" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExerciseFeedback_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ExerciseFeedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ExerciseFeedback_organizationId_studentId_createdAt_idx" ON "ExerciseFeedback"("organizationId", "studentId", "createdAt");
CREATE TABLE "OutdoorRun" (
  "id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "studentId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL, "finishedAt" TIMESTAMP(3) NOT NULL, "distanceMeters" INTEGER NOT NULL, "route" JSONB NOT NULL,
  CONSTRAINT "OutdoorRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OutdoorRun_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "OutdoorRun_organizationId_studentId_startedAt_idx" ON "OutdoorRun"("organizationId", "studentId", "startedAt");
