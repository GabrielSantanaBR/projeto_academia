import { resetMemberPassword } from "@/app/actions/account";
import { ActionForm } from "@/components/action-form";
import { inputClassName, labelClassName } from "@/components/ui";

export function ResetAccessForm({ membershipId }: { membershipId: string }) {
  return <details className="rounded-xl border border-[#dfe3e6] bg-white p-5"><summary className="cursor-pointer font-bold">Redefinir acesso</summary><ActionForm action={resetMemberPassword} className="mt-5 space-y-4">
    <input type="hidden" name="membershipId" value={membershipId} />
    <p className="text-sm leading-6 text-[#64707d]">Defina uma senha temporária e entregue-a ao titular por um canal privado. Ele precisará escolher uma nova senha ao entrar. As sessões anteriores serão encerradas.</p>
    <label className={labelClassName}>Sua senha de administrador<input name="currentPassword" type="password" required autoComplete="current-password" maxLength={200} className={inputClassName} /></label>
    <label className={labelClassName}>Senha temporária do titular<input name="password" type="password" required minLength={10} maxLength={72} autoComplete="new-password" className={inputClassName} /></label>
    <button className="secondary-button">Definir senha temporária</button>
  </ActionForm></details>;
}
