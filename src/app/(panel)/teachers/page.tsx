import { Role } from "@prisma/client";
import { Plus, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";

import { Badge, ButtonLink, PageHeader } from "@/components/ui";
import { getCurrentMembership } from "@/lib/auth";
import { getTeachers } from "@/lib/queries";

export const metadata = { title: "Professores" };

export default async function TeachersPage() {
  const membership = await getCurrentMembership();
  if (membership.role !== Role.ADMIN) redirect("/students");
  const teachers = await getTeachers(membership.organizationId);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Gestão da academia"
        title="Professores"
        description="Mantenha a equipe organizada e acompanhe a distribuição de alunos por responsável."
        action={<ButtonLink href="/teachers/new"><Plus className="size-4" /> Novo professor</ButtonLink>}
      />
      <section className="overflow-hidden border border-[#dfe3e6] bg-white">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-[#dfe3e6] bg-[#fafafa] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <UsersRound className="size-5 text-[#e85d24]" />
            <p className="font-bold text-[#27313a]">{teachers.length} professores ativos</p>
          </div>
          <p className="hidden text-sm text-[#64707d] sm:block">Apenas alunos ativos são contados</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-[#fafafa] text-xs font-bold uppercase tracking-[0.09em] text-[#64707d]">
              <tr>
                <th className="px-5 py-3.5">Professor</th>
                <th className="px-5 py-3.5">E-mail</th>
                <th className="px-5 py-3.5">Alunos ativos</th>
                <th className="px-5 py-3.5">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f2]">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-[#fffaf5]">
                  <td className="px-5 py-4 font-bold text-[#27313a]">{teacher.user.name}</td>
                  <td className="px-5 py-4 text-[#64707d]">{teacher.user.email}</td>
                  <td className="px-5 py-4"><span className="font-bold text-[#161b22]">{teacher.assignedStudents.length}</span> alunos</td>
                  <td className="px-5 py-4"><Badge tone="success">Ativo</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
