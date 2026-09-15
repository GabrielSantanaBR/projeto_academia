import { ActionForm } from "@/components/action-form";
import { Role } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createStudent } from "@/app/actions/people";
import { inputClassName, labelClassName, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getTeachers } from "@/lib/queries";

export const metadata = { title: "Novo aluno" };

export default async function NewStudentPage() {
  const membership = await requireRole(Role.ADMIN, Role.PROFESSOR);
  if (membership.role !== Role.ADMIN) redirect("/students");
  const teachers = await getTeachers(membership.organizationId);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/students" className="inline-flex items-center gap-2 text-sm font-semibold text-[#64707d] hover:text-[var(--accent)]">
          <ArrowLeft className="size-4" /> Voltar para alunos
        </Link>
      </div>
      <PageHeader title="Cadastrar aluno" description="A conta criada já poderá acessar a área do aluno com a senha definida abaixo." />
      {teachers.length === 0 && <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Cadastre um professor antes de criar alunos. <Link href="/teachers/new" className="underline">Cadastrar professor</Link></p>}
      <ActionForm action={createStudent} className="space-y-7 border border-[#dfe3e6] bg-white p-5 sm:p-7">
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
            <input id="password" name="password" required type="password" minLength={10} maxLength={72} className={inputClassName} placeholder="No mínimo 10 caracteres" />
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
          <label className={labelClassName}>Telefone<input name="phone" type="tel" maxLength={25} className={inputClassName} /></label>
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
          <button type="submit" className="min-h-10 rounded-lg bg-[var(--accent)] px-5 text-sm font-bold text-white hover:bg-[#c84411]">Criar aluno</button>
        </div>
      </ActionForm>
    </div>
  );
}
