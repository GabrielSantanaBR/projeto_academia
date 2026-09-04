import { Plus } from "lucide-react";

import { Badge, ButtonLink, PageHeader } from "@/components/ui";
import { getCurrentMembership } from "@/lib/auth";
import { getExercises } from "@/lib/queries";

export const metadata = { title: "Exercícios" };

export default async function ExercisesPage() {
  const membership = await getCurrentMembership();
  const exercises = await getExercises(membership.organizationId);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Biblioteca de treino"
        title="Exercícios"
        description="Use os exercícios globais ou crie itens próprios da sua academia para montar templates e treinos."
        action={<ButtonLink href="/exercises/new"><Plus className="size-4" /> Novo exercício</ButtonLink>}
      />
      <section className="overflow-hidden border border-[#dfe3e6] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-[#fafafa] text-xs font-bold uppercase tracking-[0.09em] text-[#64707d]">
              <tr>
                <th className="px-5 py-3.5">Exercício</th>
                <th className="px-5 py-3.5">Grupo muscular</th>
                <th className="px-5 py-3.5">Instrução</th>
                <th className="px-5 py-3.5">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f2]">
              {exercises.map((exercise) => (
                <tr key={exercise.id} className="hover:bg-[#fffaf5]">
                  <td className="px-5 py-4 font-bold text-[#27313a]">{exercise.name}</td>
                  <td className="px-5 py-4 text-[#56616c]">{exercise.muscleGroup}</td>
                  <td className="max-w-md px-5 py-4 text-[#64707d]">{exercise.instructions ?? exercise.description ?? "—"}</td>
                  <td className="px-5 py-4"><Badge tone={exercise.isSystem ? "neutral" : "accent"}>{exercise.isSystem ? "Global" : "Da academia"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
