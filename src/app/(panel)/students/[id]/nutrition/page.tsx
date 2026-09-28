import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NutritionBoard } from "@/components/nutrition-board";

export const metadata = { title: "Acompanhamento nutricional" };
export default async function StudentNutrition({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
  const { id } = await params;
  const student = await prisma.studentProfile.findFirst({ where: { id, organizationId: viewer.organizationId }, include: { membership: { include: { user: true } } } });
  if (!student) notFound();
  const notes = await prisma.nutritionNote.findMany({ where: { organizationId: viewer.organizationId, studentId: id }, orderBy: { createdAt: "desc" }, take: 100 });
  const authors = await prisma.membership.findMany({ where: { id: { in: notes.map(n => n.authorId) }, organizationId: viewer.organizationId }, include: { user: { select: { name: true } } } });
  const names = new Map(authors.map(a => [a.id, a.user.name]));
  return <NutritionBoard studentId={id} name={student.membership.user.name} notes={notes.map(n => ({ id: n.id, body: n.body, createdAt: n.createdAt, author: names.get(n.authorId) ?? "Equipe" }))} />;
}
