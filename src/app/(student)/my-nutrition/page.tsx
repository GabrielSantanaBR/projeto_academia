import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NutritionBoard } from "@/components/nutrition-board";

export const metadata = { title: "Nutrição" };
export default async function MyNutrition() {
  const viewer = await requireRole(Role.STUDENT);
  const student = await prisma.studentProfile.findFirstOrThrow({ where: { membershipId: viewer.id, organizationId: viewer.organizationId }, include: { subscription: { include: { plan: true } } } });
  const notes = await prisma.nutritionNote.findMany({ where: { organizationId: viewer.organizationId, studentId: student.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const authors = await prisma.membership.findMany({ where: { id: { in: notes.map(n => n.authorId) }, organizationId: viewer.organizationId }, include: { user: { select: { name: true } } } });
  const names = new Map(authors.map(a => [a.id, a.user.name]));
  return <div className="space-y-5"><div className="border border-[#dfe3e6] bg-white p-5"><h2 className="font-bold">Minha assinatura</h2><p className="mt-2 text-sm">{student.subscription ? `${student.subscription.plan.name} · validade até ${new Intl.DateTimeFormat("pt-BR").format(student.subscription.expiresAt)}` : "Nenhum plano cadastrado."}</p></div><NutritionBoard studentId={student.id} name={viewer.user.name} notes={notes.map(n => ({ id: n.id, body: n.body, createdAt: n.createdAt, author: names.get(n.authorId) ?? "Equipe" }))} /></div>;
}
