import { Role } from "@prisma/client";
import { createSubscriptionPlan, assignSubscription } from "@/app/actions/member-features";
import { ActionForm } from "@/components/action-form";
import { PageHeader, inputClassName, labelClassName } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Planos e assinaturas" };
export default async function Subscriptions() {
  const viewer = await requireRole(Role.ADMIN);
  const [plans, students] = await Promise.all([
    prisma.subscriptionPlan.findMany({ where: { organizationId: viewer.organizationId }, orderBy: { name: "asc" } }),
    prisma.studentProfile.findMany({ where: { organizationId: viewer.organizationId, status: "ACTIVE" }, include: { membership: { include: { user: true } }, subscription: { include: { plan: true } } }, orderBy: { membership: { user: { name: "asc" } } } }),
  ]);
  return <div className="space-y-8"><PageHeader eyebrow="Gestão comercial" title="Planos e assinaturas" description="Cadastre valores e períodos; atribua um plano a cada aluno. Cobranças e pagamentos são controlados fora desta tela." />
    <div className="grid gap-6 lg:grid-cols-2"><ActionForm action={createSubscriptionPlan} className="space-y-4 border border-[#dfe3e6] bg-white p-6"><h2 className="text-lg font-bold">Novo plano</h2><label className={labelClassName}>Nome<input name="name" required minLength={2} maxLength={80} className={inputClassName} /></label><label className={labelClassName}>Preço (R$)<input name="price" type="number" required min={0} max={100000} step="0.01" className={inputClassName} /></label><label className={labelClassName}>Duração em dias<input name="durationDays" type="number" required min={1} max={730} defaultValue={30} className={inputClassName} /></label><button className="primary-button">Criar plano</button></ActionForm>
    <ActionForm action={assignSubscription} className="space-y-4 border border-[#dfe3e6] bg-white p-6"><h2 className="text-lg font-bold">Atribuir assinatura</h2><label className={labelClassName}>Aluno<select name="studentId" required className={inputClassName}><option value="">Selecione</option>{students.map(s => <option key={s.id} value={s.id}>{s.membership.user.name}</option>)}</select></label><label className={labelClassName}>Plano<select name="planId" required className={inputClassName}><option value="">Selecione</option>{plans.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.name} · R$ {(p.priceCents / 100).toFixed(2)} / {p.durationDays} dias</option>)}</select></label><label className={labelClassName}>Início<input name="startsAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClassName} /></label><button className="primary-button" disabled={!plans.length || !students.length}>Salvar assinatura</button></ActionForm></div>
    <section><h2 className="mb-4 text-lg font-bold">Alunos e vigência</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{students.map(s => <article key={s.id} className="border border-[#dfe3e6] bg-white p-5"><strong>{s.membership.user.name}</strong><p className="mt-2 text-sm text-[#64707d]">{s.subscription ? `${s.subscription.plan.name} · até ${new Intl.DateTimeFormat("pt-BR").format(s.subscription.expiresAt)}` : "Sem plano atribuído"}</p></article>)}</div></section>
  </div>;
}
