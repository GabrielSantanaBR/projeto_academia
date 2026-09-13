import { Role } from "@prisma/client";
import { updateOrganization } from "@/app/actions/account";
import { ActionForm } from "@/components/action-form";
import { ButtonLink, PageHeader, inputClassName, labelClassName } from "@/components/ui";
import { requireRole } from "@/lib/auth";

export const metadata = { title: "Minha academia" };
export default async function SettingsPage() {
  const viewer = await requireRole(Role.ADMIN);
  const org = viewer.organization;
  return <div className="max-w-4xl space-y-7"><PageHeader title="Minha academia" description="Personalize o painel e mantenha os dados da operação atualizados." />
    <ActionForm action={updateOrganization} className="space-y-6 rounded-xl border border-[#dfe3e6] bg-white p-5 sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2"><label className={labelClassName}>Nome da academia<input name="name" defaultValue={org.name} required minLength={3} maxLength={100} className={inputClassName} /></label><label className={labelClassName}>Cidade<input name="city" defaultValue={org.city ?? ''} maxLength={100} className={inputClassName} /></label><label className={labelClassName}>E-mail de contato<input name="contactEmail" type="email" defaultValue={org.contactEmail ?? ''} maxLength={160} className={inputClassName} /></label><label className={labelClassName}>Telefone<input name="phone" type="tel" defaultValue={org.phone ?? ''} maxLength={25} className={inputClassName} /></label></div>
      <fieldset><legend className={`${labelClassName} mb-3`}>Cor da academia</legend><div className="flex flex-wrap gap-3">{[['#c84411','Laranja'],['#047857','Verde'],['#1d4ed8','Azul'],['#7e22ce','Violeta']].map(([color, label]) => <label key={color} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#dfe3e6] px-3"><input type="radio" name="primaryColor" value={color} defaultChecked={org.primaryColor === color} /><span className="size-4 rounded-full" style={{ backgroundColor: color }} /><span className="text-sm">{label}</span></label>)}</div></fieldset>
      <button className="primary-button">Salvar configurações</button>
    </ActionForm>
    <section className="rounded-xl border border-[#dfe3e6] bg-white p-5 sm:p-7"><h2 className="font-bold">Dados e acessos</h2><p className="mt-2 text-sm leading-6 text-[#64707d]">Exporte o cadastro da sua academia para conferência. O arquivo contém dados pessoais: compartilhe apenas com a equipe autorizada.</p><div className="mt-5 flex flex-wrap gap-3"><a href="/api/exports/students" className="secondary-button">Exportar alunos em CSV</a><ButtonLink href="/teachers" variant="secondary">Gerenciar equipe</ButtonLink><ButtonLink href="/account" variant="secondary">Alterar minha senha</ButtonLink></div></section>
  </div>;
}
