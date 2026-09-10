import { ChevronRight, Plus } from "lucide-react";

import { Badge, ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { getCurrentMembership } from "@/lib/auth";
import { getTemplates } from "@/lib/queries";

export const metadata = { title: "Templates" };

export default async function TemplatesPage() {
  const membership = await getCurrentMembership();
  const templates = await getTemplates(membership.organizationId);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Biblioteca de treino"
        title="Templates"
        description="Modelos reutilizáveis. Ao atribuir um template a um aluno, o treino é copiado e pode ser personalizado sem alterar o original."
        action={<ButtonLink href="/templates/new"><Plus className="size-4" /> Novo template</ButtonLink>}
      />
      {templates.length === 0 ? (
        <EmptyState title="Nenhum template criado" description="Crie o primeiro modelo para acelerar a prescrição dos professores." action={<ButtonLink href="/templates/new">Criar template</ButtonLink>} />
      ) : (
        <section className="divide-y divide-[#dfe3e6] border border-[#dfe3e6] bg-white">
          {templates.map((template) => (
            <details key={template.id} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 hover:bg-[#fffaf5] sm:px-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-[#161b22]">{template.name}</h2>
                    <Badge tone={template.active ? "success" : "neutral"}>{template.active ? "Ativo" : "Arquivado"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[#64707d]">{template.description ?? "Sem descrição"}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.09em] text-[#8a959d]">{template.days.length} dias · criado por {template.createdBy.user.name}</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-[#8a959d] transition group-open:rotate-90" />
              </summary>
              <div className="border-t border-[#edf0f2] bg-[#fafafa] px-5 py-5 sm:px-6">
                <div className="grid gap-4 lg:grid-cols-3">
                  {template.days.map((day) => (
                    <div key={day.id} className="border border-[#dfe3e6] bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#e85d24]">Treino {day.code}</p>
                      <h3 className="mt-1 font-bold text-[#27313a]">{day.name}</h3>
                      <ul className="mt-4 space-y-2 text-sm text-[#64707d]">
                        {day.exercises.map((exercise) => <li key={exercise.id}>{exercise.exercise.name} · {exercise.sets}×{exercise.repsMin}–{exercise.repsMax}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
