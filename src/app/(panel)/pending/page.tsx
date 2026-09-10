import { Role, StudentStatus } from "@prisma/client";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { getAttentionItems, type AttentionStudent } from "@/lib/attention";
import { getCurrentMembership } from "@/lib/auth";
import { getStudentsForViewer } from "@/lib/queries";

export const metadata = { title: "Pendências" };

export default async function PendingPage() {
  const membership = await getCurrentMembership();
  const students = await getStudentsForViewer(membership);
  const attention = getAttentionItems(
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
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={membership.role === Role.ADMIN ? "Operação" : "Acompanhamento"}
        title="Pendências"
        description="Lista automática baseada em treinos, validade, matrícula e atividade registrada. Não são tarefas manuais."
      />

      {attention.length === 0 ? (
        <EmptyState title="Tudo em dia" description="Nenhum aluno sob sua responsabilidade precisa de atenção agora." />
      ) : (
        <section className="overflow-hidden border border-[#dfe3e6] bg-white">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-[#dfe3e6] bg-[#fffaf5] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-[#e85d24]" />
              <p className="font-bold text-[#27313a]">{attention.length} sinais para acompanhar</p>
            </div>
            <p className="hidden text-sm text-[#64707d] sm:block">Atualizado ao abrir a tela</p>
          </div>
          <div className="divide-y divide-[#edf0f2]">
            {attention.map((item) => (
              <Link
                key={`${item.studentId}-${item.reason}`}
                href={`/students/${item.studentId}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 transition hover:bg-[#fffaf5] sm:px-6"
              >
                <div>
                  <p className="font-semibold text-[#161b22]">{item.studentName}</p>
                  <p className="mt-1 text-sm text-[#64707d]">{item.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={item.priority === 1 ? "danger" : item.priority === 2 ? "warning" : "neutral"}>
                    Prioridade {item.priority}
                  </Badge>
                  <ArrowRight className="size-4 text-[#9aa3aa]" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
