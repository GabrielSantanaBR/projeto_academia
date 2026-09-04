import { Role } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createStudent } from "@/app/actions/people";
import { inputClassName, labelClassName, PageHeader } from "@/components/ui";
import { getCurrentMembership } from "@/lib/auth";
import { getTeachers } from "@/lib/queries";

export const metadata = { title: "Novo aluno" };

export default async function NewStudentPage() {
  const membership = await getCurrentMembership();
  if (membership.role !== Role.ADMIN) redirect("/students");
  const teachers = await getTeachers(membership.organizationId);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/students" className="inline-flex items-center gap-2 text-sm font-semibold text-[#64707d] hover:text-[#c84411]">
          <ArrowLeft className="size-4" /> Voltar para alunos
        </Link>
      </div>
      <PageHeader title="Cadastrar aluno" description="A conta criada já poderá acessar a área do aluno com a senha definida abaixo." />
      <form action={createStudent} className="space-y-7 border border-[#dfe3e6] bg-white p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className={labelClassName}>Nome completo</label>
            <input id="name" name="name" required minLength={2} className={inputClassName} placeholder="Nome do aluno" />
          </div>
          <div>
            <label htmlFor="email" className={labelClassName}>E-mail de acesso</label>
            <input id="email" name="email" required type="email" className={inputClassName} placeholder="aluno@email.com" />
          </div>
          <div>
            <label htmlFor="password" className={labelClassName}>Senha inicial</label>
            <input id="password" name="password" required type="password" minLength={8} className={inputClassName} placeholder="No mínimo 8 caracteres" />
          </div>
          <div>
            <label htmlFor="primaryTeacherId" className={labelClassName}>Professor responsável</label>
            <select id="primaryTeacherId" name="primaryTeacherId" required className={inputClassName}>
              <option value="">Selecione um professor</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.user.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="birthDate" className={labelClassName}>Data de nascimento</label>
            <input id="birthDate" name="birthDate" type="date" className={inputClassName} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="goal" className={labelClassName}>Objetivo</label>
            <input id="goal" name="goal" className={inputClassName} placeholder="Ex.: hipertrofia, condicionamento, emagrecimento" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="notes" className={labelClassName}>Observações</label>
            <textarea id="notes" name="notes" rows={4} className={inputClassName} placeholder="Informações úteis para o professor." />
          </div>
        </div>
        <div className="flex justify-end border-t border-[#edf0f2] pt-5">
          <button type="submit" className="min-h-10 rounded-lg bg-[#e85d24] px-5 text-sm font-bold text-white hover:bg-[#c84411]">Criar aluno</button>
        </div>
      </form>
    </div>
  );
}
