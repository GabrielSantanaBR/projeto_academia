import { Role } from "@prisma/client";
import { Plus } from "lucide-react";
import { ExerciseDirectory } from "@/components/exercise-directory";
import { ButtonLink, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getExercises } from "@/lib/queries";
export const metadata = { title: "Exercícios" };
export default async function ExercisesPage() {
 const viewer=await requireRole(Role.ADMIN,Role.PROFESSOR);
 const exercises=await getExercises(viewer.organizationId);
 return <div className="space-y-7"><PageHeader eyebrow="Biblioteca de treino" title="Exercícios" description="Consulte as instruções e personalize o catálogo da academia." action={<ButtonLink href="/exercises/new"><Plus className="size-4" /> Novo exercício</ButtonLink>} /><ExerciseDirectory exercises={exercises.map(e=>({id:e.id,name:e.name,muscleGroup:e.muscleGroup,unit:e.unit,instructions:e.instructions,description:e.description,notes:e.notes,isSystem:e.isSystem}))} /></div>;
}
