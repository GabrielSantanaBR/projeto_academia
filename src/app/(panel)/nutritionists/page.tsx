import { Role } from "@prisma/client";
import { createNutritionist, setNutritionistAccess } from "@/app/actions/nutrition";
import { ActionForm } from "@/components/action-form";
import { ResetAccessForm } from "@/components/reset-access-form";
import { PageHeader, EmptyState, inputClassName, labelClassName } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Nutricionistas" };
export default async function NutritionistsPage() {
  const viewer = await requireRole(Role.ADMIN);
  const professionals = await prisma.membership.findMany({ where: { organizationId: viewer.organizationId, role: Role.NUTRITIONIST }, include: { user: true, _count: { select: { assignedNutritionStudents: { where: { status: "ACTIVE" } } } } }, orderBy: { user: { name: "asc" } } });
  return <div className="space-y-8"><PageHeader eyebrow="Equipe especializada" title="Nutricionistas" description="Cadastre profissionais e vincule alunos em Editar cadastro. Cada orientação é particular ao profissional responsável e ao aluno." />
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)]">
      <section className="space-y-3"><h2 className="text-lg font-bold">Equipe · {professionals.length}</h2>{!professionals.length ? <EmptyState title="Sem nutricionistas" description="Crie o primeiro acesso profissional ao lado." /> : professionals.map(person => <article key={person.id} className="border-l-4 border-[var(--accent)] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{person.user.name}</h3><p className="text-sm text-[#64707d]">{person.user.email}</p><p className="mt-2 text-sm">{person._count.assignedNutritionStudents} alunos ativos vinculados</p></div><span className="text-xs font-semibold text-[#64707d]">{person.active ? "Ativo" : "Desativado"}</span></div><ActionForm action={setNutritionistAccess} className="mt-4 flex flex-wrap items-center gap-2"><input type="hidden" name="membershipId" value={person.id} /><input type="hidden" name="active" value={String(!person.active)} /><button className="secondary-button">{person.active ? "Desativar" : "Reativar"} acesso</button></ActionForm><details className="mt-3"><summary className="text-sm font-semibold text-[#465568]">Redefinir senha</summary><div className="mt-3"><ResetAccessForm membershipId={person.id} /></div></details></article>)}</section>
      <ActionForm action={createNutritionist} className="h-fit space-y-4 border border-[#dfe3e6] bg-white p-6"><h2 className="text-lg font-bold">Novo profissional</h2><p className="text-sm text-[#64707d]">O primeiro acesso exige trocar a senha temporária.</p><label className={labelClassName}>Nome completo<input name="name" required minLength={2} maxLength={120} className={inputClassName} /></label><label className={labelClassName}>E-mail de acesso<input name="email" type="email" required className={inputClassName} /></label><label className={labelClassName}>Senha inicial<input name="password" type="password" minLength={10} maxLength={72} required className={inputClassName} /></label><button className="primary-button">Cadastrar nutricionista</button></ActionForm>
    </div>
  </div>;
}
