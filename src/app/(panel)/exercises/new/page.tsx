import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { createExercise } from "@/app/actions/catalog";
import { inputClassName, labelClassName, PageHeader } from "@/components/ui";

export const metadata = { title: "Novo exercício" };

export default function NewExercisePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href="/exercises" className="inline-flex items-center gap-2 text-sm font-semibold text-[#64707d] hover:text-[#c84411]">
        <ArrowLeft className="size-4" /> Voltar para exercícios
      </Link>
      <PageHeader title="Adicionar exercício" description="Este exercício ficará disponível somente para a sua academia." />
      <form action={createExercise} className="space-y-6 border border-[#dfe3e6] bg-white p-5 sm:p-7">
        <div>
          <label htmlFor="name" className={labelClassName}>Nome</label>
          <input id="name" name="name" required className={inputClassName} placeholder="Ex.: Remada cavalinho" />
        </div>
        <div>
          <label htmlFor="muscleGroup" className={labelClassName}>Grupo muscular</label>
          <input id="muscleGroup" name="muscleGroup" required className={inputClassName} placeholder="Ex.: Costas" />
        </div>
        <div>
          <label htmlFor="description" className={labelClassName}>Descrição</label>
          <textarea id="description" name="description" rows={3} className={inputClassName} placeholder="Quando este exercício faz sentido no treino." />
        </div>
        <div>
          <label htmlFor="instructions" className={labelClassName}>Instruções</label>
          <textarea id="instructions" name="instructions" rows={4} className={inputClassName} placeholder="Pontos técnicos importantes." />
        </div>
        <div>
          <label htmlFor="notes" className={labelClassName}>Observações internas</label>
          <textarea id="notes" name="notes" rows={3} className={inputClassName} />
        </div>
        <div className="flex justify-end border-t border-[#edf0f2] pt-5">
          <button type="submit" className="min-h-10 rounded-lg bg-[#e85d24] px-5 text-sm font-bold text-white hover:bg-[#c84411]">Adicionar exercício</button>
        </div>
      </form>
    </div>
  );
}
