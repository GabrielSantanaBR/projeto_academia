import Link from "next/link";
import { redirect } from "next/navigation";
import { changePassword } from "@/app/actions/account";
import { ActionForm } from "@/components/action-form";
import { PageHeader, inputClassName, labelClassName } from "@/components/ui";
import { UserMenu } from "@/components/user-menu";
import { getCurrentMembership, AuthorizationError } from "@/lib/auth";

export const metadata = { title: "Minha conta" };
export default async function AccountPage() {
  const m = await getCurrentMembership({ allowTemporaryPassword: true }).catch(error => { if (error instanceof AuthorizationError) redirect("/login"); throw error; });
  return <main className="mx-auto max-w-xl space-y-7 px-5 py-10">
    <div className="flex items-center justify-between"><Link href="/" className="text-sm font-bold text-[var(--accent)]">← Voltar</Link><UserMenu name={m.user.name} role={m.organization.name} /></div>
    <PageHeader title="Minha conta" description={`${m.user.name} · ${m.user.email}`} />
    {m.user.mustChangePassword && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Sua senha é temporária. Defina uma nova senha pessoal para continuar.</p>}
    <ActionForm action={changePassword} className="space-y-5 rounded-xl border border-[#dfe3e6] bg-white p-6">
      <h2 className="text-lg font-bold">Alterar senha</h2>
      <label className={labelClassName}>Senha atual<input name="currentPassword" type="password" autoComplete="current-password" required maxLength={200} className={inputClassName} /></label>
      <label className={labelClassName}>Nova senha<input name="newPassword" type="password" autoComplete="new-password" minLength={10} maxLength={72} required className={inputClassName} /></label>
      <p className="text-sm text-[#64707d]">Use de 10 a 72 caracteres. Uma frase longa ajuda a proteger seu acesso.</p>
      <label className={labelClassName}>Confirme a nova senha<input name="confirmPassword" type="password" autoComplete="new-password" minLength={10} maxLength={72} required className={inputClassName} /></label>
      <button className="primary-button w-full">Salvar senha e entrar novamente</button>
    </ActionForm>
  </main>;
}
