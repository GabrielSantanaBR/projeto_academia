import { ActionForm } from "@/components/action-form";
import { addNutritionNote } from "@/app/actions/member-features";
import { PageHeader, inputClassName, labelClassName } from "@/components/ui";

export function NutritionBoard({ studentId, name, notes }: { studentId: string; name: string; notes: { id: string; body: string; createdAt: Date; author: string }[] }) {
  return <div className="mx-auto max-w-3xl space-y-7"><PageHeader eyebrow="Acompanhamento" title={`Nutrição · ${name}`} description="Registre dúvidas, hábitos e orientações. O histórico fica disponível para aluno e equipe da academia." />
    <ActionForm action={addNutritionNote} className="space-y-4 border border-[#dfe3e6] bg-white p-5 sm:p-7"><input type="hidden" name="studentId" value={studentId} /><label className={labelClassName}>Novo registro<textarea name="body" required minLength={2} maxLength={2000} rows={4} className={inputClassName} placeholder="Escreva uma dúvida ou orientação..." /></label><button className="primary-button">Publicar registro</button></ActionForm>
    <section className="space-y-3" aria-label="Histórico de nutrição">{notes.length === 0 && <p className="text-sm text-[#64707d]">Ainda não há registros.</p>}{notes.map(note => <article key={note.id} className="border-l-4 border-[var(--accent)] bg-white p-5"><div className="flex flex-wrap justify-between gap-2 text-sm"><strong>{note.author}</strong><time className="text-[#64707d]">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(note.createdAt)}</time></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{note.body}</p></article>)}</section>
    <p className="text-xs leading-5 text-[#64707d]">Este espaço organiza a comunicação. Prescrições alimentares exigem acompanhamento de profissional habilitado.</p>
  </div>;
}
