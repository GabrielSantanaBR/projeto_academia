import { Role, StudentStatus } from "@prisma/client";
import { Plus } from "lucide-react";

import { ButtonLink, PageHeader } from "@/components/ui";
import { StudentDirectory, type StudentDirectoryItem } from "@/components/student-directory";
import { getAttentionItems, isPlanCurrent, type AttentionStudent } from "@/lib/attention";
import { getCurrentMembership } from "@/lib/auth";
import { getStudentsForViewer } from "@/lib/queries";

export const metadata = { title: "Alunos" };

export default async function StudentsPage() {
  const membership = await getCurrentMembership();
  const students = await getStudentsForViewer(membership);
  const attentionByStudent = new Map(
    getAttentionItems(
      students
        .filter((student) => student.status === StudentStatus.ACTIVE)
        .map<AttentionStudent>((student) => ({
          id: student.id,
          name: student.membership.user.name,
          firstEnrolledAt: student.firstEnrolledAt,
          plan: student.workoutPlans[0]
            ? { id: student.workoutPlans[0].id, validUntil: student.workoutPlans[0].validUntil }
            : null,
          lastCompletedAt: student.sessions[0]?.completedAt,
        })),
    ).map((item) => [item.studentId, item.description]),
  );

  const items: StudentDirectoryItem[] = students.map((student) => {
    const plan = student.workoutPlans[0];
    return {
      id: student.id,
      name: student.membership.user.name,
      teacherName: student.primaryTeacher?.user.name ?? null,
      status: student.status,
      planName: plan?.name ?? null,
      validUntil: plan?.validUntil?.toISOString() ?? null,
      lastActivity: student.sessions[0]?.completedAt?.toISOString() ?? null,
      planState: !plan ? "none" : isPlanCurrent(plan.validUntil) ? "current" : "expired",
      attention: attentionByStudent.get(student.id) ?? null,
    };
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={membership.role === Role.ADMIN ? "Gestão da academia" : "Minha carteira"}
        title="Alunos"
        description={
          membership.role === Role.ADMIN
            ? "Visualize a situação de cada aluno, responsável, treino e última atividade."
            : "Acompanhe os alunos que estão sob sua responsabilidade."
        }
        action={
          membership.role === Role.ADMIN ? (
            <ButtonLink href="/students/new">
              <Plus className="size-4" /> Novo aluno
            </ButtonLink>
          ) : undefined
        }
      />
      <StudentDirectory students={items} />
    </div>
  );
}
