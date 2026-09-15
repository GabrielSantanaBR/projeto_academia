import { Role } from "@prisma/client";
import { Plus } from "lucide-react";
import { updateTeacher } from "@/app/actions/people";
import { ActionForm } from "@/components/action-form";
import { ResetAccessForm } from "@/components/reset-access-form";
import { Badge, ButtonLink, PageHeader, EmptyState, inputClassName, labelClassName } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Professores" };
export default async function TeachersPage() {
  const viewer = await requireRole(Role.ADMIN);
  const teachers = await prisma.membership.findMany({ where: { organizationId: viewer.organizationId, role: Role.PROFESSOR }, include: { user: true, _count: { select: { assignedStudents: { where: { status: 'ACTIVE' } } } } }, orderBy: { user: { name: 'asc' } } });
  return <div className="space-y-7"><PageHeader eyebrow="Equipe da academia" title="Professores" description={`${teachers.filter(t => t.active).length} professores ativos. Organize a carteira e os acessos da equipe.`} action={<ButtonLink href="/teachers/new"><Plus className="size-4" /> Novo professor</ButtonLink>} />
    {!teachers.length ? <EmptyState title="Monte sua equipe" description="Cadastre o primeiro professor para começar a organizar os alunos." action={<ButtonLink href="/teachers/new">Cadastrar professor</ButtonLink>} /> : <section className="divide-y divide-[#dfe3e6] overflow-hidden rounded-xl border border-[#dfe3e6] bg-white">{teachers.map(teacher => <details key={teacher.id} className="group"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 p-5 sm:p-6"><div className="flex min-w-0 items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#edf0f2] font-bold text-[#55606b]">{teacher.user.name.split(' ').map(n => n[0]).slice(0,2).join('')}</span><div className="min-w-0"><h2 className="font-bold">{teacher.user.name}</h2><p className="break-all text-sm text-[#64707d]">{teacher.user.email}</p></div></div><div className="flex items-center gap-4"><span className="text-sm text-[#64707d]">{teacher._count.assignedStudents} alunos</span><Badge tone={teacher.active ? 'success' : 'neutral'}>{teacher.active ? 'Ativo' : 'Desativado'}</Badge><span className="text-sm font-semibold text-[var(--accent)]">Gerenciar</span></div></summary><div className="grid gap-5 border-t border-[#edf0f2] bg-[#fafafa] p-5 lg:grid-cols-2 sm:p-6"><ActionForm action={updateTeacher} className="space-y-4 rounded-xl border border-[#dfe3e6] bg-white p-5"><input type="hidden" name="membershipId" value={teacher.id} /><label className={labelClassName}>Nome<input name="name" required minLength={2} maxLength={120} defaultValue={teacher.user.name} className={inputClassName} /></label><label className={labelClassName}>Acesso<select name="active" defaultValue={String(teacher.active)} className={inputClassName}><option value="true">Ativo</option><option value="false">Desativado</option></select></label><p className="text-sm text-[#64707d]">Antes de desativar, transfira os alunos ativos pelo cadastro de cada aluno.</p><button className="primary-button">Salvar professor</button></ActionForm><ResetAccessForm membershipId={teacher.id} /></div></details>)}</section>}
  </div>;
}
