import { Role } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TemplateBuilder } from "@/components/template-builder";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getExercises } from "@/lib/queries";

export const metadata = { title: "Editar modelo" };
export default async function EditTemplate({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
  const { id } = await params;
  const template = await prisma.trainingTemplate.findFirst({ where: { id, organizationId: viewer.organizationId,
    ...(viewer.role === Role.PROFESSOR ? { createdByMembershipId: viewer.id } : {}) },
    include: { days: { orderBy: { sortOrder: "asc" }, include: { exercises: { orderBy: { sortOrder: "asc" } } } } } });
  if (!template) notFound();
  const exercises = await getExercises(viewer.organizationId);
  return <div className="space-y-7"><Link href="/templates" className="text-sm font-bold text-[#64707d]">← Modelos de treino</Link><PageHeader title="Editar modelo" description="As alterações valem para novas atribuições. Os treinos já publicados permanecem independentes." /><TemplateBuilder exercises={exercises} recordId={id} initial={{ name: template.name, description: template.description, updatedAt: template.updatedAt.toISOString(), days: template.days }} /></div>;
}
