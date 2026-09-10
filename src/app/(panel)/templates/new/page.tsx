import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { TemplateBuilder } from "@/components/template-builder";
import { PageHeader } from "@/components/ui";
import { getCurrentMembership } from "@/lib/auth";
import { getExercises } from "@/lib/queries";

export const metadata = { title: "Novo template" };

export default async function NewTemplatePage() {
  const membership = await getCurrentMembership();
  const exercises = await getExercises(membership.organizationId);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Link href="/templates" className="inline-flex items-center gap-2 text-sm font-semibold text-[#64707d] hover:text-[#c84411]">
        <ArrowLeft className="size-4" /> Voltar para templates
      </Link>
      <PageHeader title="Montar template" description="Organize dias, exercícios, séries, repetições, carga sugerida e descanso. O template nunca é alterado ao personalizar o treino de um aluno." />
      <TemplateBuilder exercises={exercises.map((exercise) => ({ id: exercise.id, name: exercise.name, muscleGroup: exercise.muscleGroup }))} />
    </div>
  );
}
