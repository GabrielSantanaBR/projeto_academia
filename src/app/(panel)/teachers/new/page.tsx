import { Role } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createTeacher } from "@/app/actions/people";
import { inputClassName, labelClassName, PageHeader } from "@/components/ui";
import { getCurrentMembership } from "@/lib/auth";

export const metadata = { title: "Novo professor" };

export default async function NewTeacherPage() {
  const membership = await getCurrentMembership();
  if (membership.role !== Role.ADMIN) redirect("/students");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href="/teachers" className="inline-flex items-center gap-2 text-sm font-semibold text-[#64707d] hover:text-[#c84411]">
        <ArrowLeft className="size-4" /> Voltar para professores
      </Link>
      <PageHeader title="Cadastrar professor" description="Crie o acesso e deixe o profissional pronto para receber alunos." />
      <form action={createTeacher} className="space-y-6 border border-[#dfe3e6] bg-white p-5 sm:p-7">
        <div>
          <label htmlFor="name" className={labelClassName}>Nome completo</label>
          <input id="name" name="name" required minLength={2} className={inputClassName} placeholder="Nome do professor" />
        </div>
        <div>
          <label htmlFor="email" className={labelClassName}>E-mail de acesso</label>
          <input id="email" name="email" type="email" required className={inputClassName} placeholder="professor@academia.com" />
        </div>
        <div>
          <label htmlFor="password" className={labelClassName}>Senha inicial</label>
          <input id="password" name="password" type="password" minLength={8} required className={inputClassName} placeholder="No mínimo 8 caracteres" />
        </div>
        <div className="flex justify-end border-t border-[#edf0f2] pt-5">
          <button type="submit" className="min-h-10 rounded-lg bg-[#e85d24] px-5 text-sm font-bold text-white hover:bg-[#c84411]">Criar professor</button>
        </div>
      </form>
    </div>
  );
}
