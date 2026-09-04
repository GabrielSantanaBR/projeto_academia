import { Role } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateStudent } from "@/app/actions/people";
import { PageHeader, inputClassName, labelClassName } from "@/components/ui";
import { getCurrentMembership } from "@/lib/auth";
import { formatDate, toDateInputValue } from "@/lib/format";
import { getStudentDetail, getTeachers } from "@/lib/queries";

type PageProps = { params: Promise<{ id: string }> };

export const metadata = { title: "Editar aluno" };

export default async function EditStudentPage({ params }: PageProps) {
  const { id } = await params;
  const membership = await getCurrentMembership();
  let student: Awaited<ReturnType<typeof getStudentDetail>>;

  try {
    student = await getStudentDetail(id, membership);
  } catch {
    notFound();
  }

  const teachers = membership.role === Role.ADMIN ? await getTeachers(membership.organizationId) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link href={`/students/${student.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#64707d] hover:text-[#c84411]">
        <ArrowLeft className="size-4" /> Voltar para o perfil
      </Link>
      <PageHeader title="Editar aluno" description="Atualize dados de acompanhamento. Professores não podem trocar a associação de responsável." />
      <form action={updateStudent} className="space-y-7 border border-[#dfe3e6] bg-white p-5 sm:p-7">
        <input type="hidden" name="studentId" value={student.id} />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><label htmlFor="name" className={labelClassName}>Nome completo</label><input id="name" name="name" required defaultValue={student.membership.user.name} className={inputClassName} /></div>
          <div><label htmlFor="birthDate" className={labelClassName}>Data de nascimento</label><input id="birthDate" name="birthDate" type="date" defaultValue={toDateInputValue(student.birthDate)} className={inputClassName} /></div>
          <div><label htmlFor="status" className={labelClassName}>Status<select id="status" name="status" defaultValue={student.status} className={inputClassName}><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></select></label></div>
          <div className="sm:col-span-2">
            {membership.role === Role.ADMIN ? (
              <label htmlFor="primaryTeacherId" className={labelClassName}>Professor responsável<select id="primaryTeacherId" name="primaryTeacherId" defaultValue={student.primaryTeacherId ?? ""} className={inputClassName}>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.user.name}</option>)}</select></label>
            ) : (
              <div className="rounded-lg border border-[#dfe3e6] bg-[#fafafa] px-4 py-3"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8a959d]">Professor responsável</p><p className="mt-1 font-semibold text-[#27313a]">{student.primaryTeacher?.user.name ?? "Sem responsável"}</p></div>
            )}
          </div>
          <div className="sm:col-span-2"><label htmlFor="goal" className={labelClassName}>Objetivo<input id="goal" name="goal" defaultValue={student.goal ?? ""} className={inputClassName} /></label></div>
          <div className="sm:col-span-2"><label htmlFor="notes" className={labelClassName}>Observações<textarea id="notes" name="notes" rows={5} defaultValue={student.notes ?? ""} className={inputClassName} /></label></div>
        </div>
        <div className="flex items-center justify-between border-t border-[#edf0f2] pt-5"><div className="text-sm text-[#64707d]">Cadastro desde {formatDate(student.firstEnrolledAt)}</div><button type="submit" className="min-h-10 rounded-lg bg-[#e85d24] px-5 text-sm font-bold text-white hover:bg-[#c84411]">Salvar alterações</button></div>
      </form>
    </div>
  );
}
