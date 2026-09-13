import { Prisma } from "@prisma/client";
import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { AuthorizationError } from "@/lib/auth";
import { InputError, type ActionResult } from "@/lib/action-result";

const fieldNames: Record<string, string> = {
  name: "nome", email: "e-mail", password: "senha", birthDate: "nascimento",
  primaryTeacherId: "professor", validUntil: "validade", assessedAt: "data",
  weight: "peso", height: "altura", waist: "cintura", phone: "telefone",
  currentPassword: "senha atual", newPassword: "nova senha", payload: "treino",
};

export async function safeAction(work: () => Promise<ActionResult | void>): Promise<ActionResult> {
  try {
    return (await work()) ?? { success: "Alterações salvas." };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthorizationError || error instanceof InputError) return { error: error.message };
    if (error instanceof ZodError) {
      const field = String(error.issues[0]?.path[0] ?? "");
      return { error: `Confira ${fieldNames[field] ? `o campo ${fieldNames[field]}` : "os campos informados"} e os limites indicados antes de salvar.` };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return { error: "Já existe um cadastro com esse e-mail, nome ou código. Confira os dados." };
      if (error.code === "P2025") return { error: "Este registro mudou. Atualize a página e tente novamente." };
    }
    // Never log form values, credentials, personal measurements or database queries.
    console.error("[action] Falha inesperada", error instanceof Error ? error.name : "UnknownError");
    return { error: "Não foi possível salvar agora. Seus campos continuam disponíveis; tente novamente." };
  }
}
