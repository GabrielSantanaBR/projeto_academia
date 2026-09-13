import { Role } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkoutLogger } from "@/components/workout-logger";
import { PageHeader } from "@/components/ui";
import { requireRole, AuthorizationError } from "@/lib/auth";
import { getLastLoadsForExercises, getSessionForStudent } from "@/lib/queries";

export const metadata = { title: "Registrar treino" };
export default async function WorkoutSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireRole(Role.STUDENT);
  const session = await getSessionForStudent(id, viewer.id, viewer.organizationId).catch(error => { if (error instanceof AuthorizationError) notFound(); throw error; });
  if (session.status !== "IN_PROGRESS") redirect("/my-history");
  const lastLoads = await getLastLoadsForExercises(session.studentId, viewer.organizationId, session.exercises.map(e => e.exerciseId));
  return <div className="space-y-6"><Link href="/my-workout" className="text-sm font-semibold text-[#64707d]">← Meu treino</Link><PageHeader eyebrow="Treino em andamento" title={session.dayName} description="Preencha o que realizou, marque as séries feitas e salve seu progresso." /><WorkoutLogger sessionId={session.id} initialVersion={session.version} lastLoads={Object.fromEntries(lastLoads)} exercises={session.exercises.map(e => ({ id: e.id, exerciseId: e.exerciseId, exerciseName: e.exerciseName, targetRepsMin: e.targetRepsMin, targetRepsMax: e.targetRepsMax, unit: e.unit, restSeconds: e.restSeconds, suggestedLoad: e.suggestedLoad, instructions: e.instructions, notes: e.notes, sets: e.sets.map(s => ({ id: s.id, setNumber: s.setNumber, load: s.load, reps: s.reps, done: Boolean(s.completedAt) })) }))} /></div>;
}
