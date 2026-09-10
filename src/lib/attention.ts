export type AttentionReason =
  | "NEW_WITHOUT_WORKOUT"
  | "WITHOUT_WORKOUT"
  | "EXPIRED_WORKOUT"
  | "EXPIRING_WORKOUT"
  | "INACTIVE_STUDENT";

export type AttentionStudent = {
  id: string;
  name: string;
  firstEnrolledAt: Date;
  plan?: {
    id: string;
    validUntil: Date | null;
  } | null;
  lastCompletedAt?: Date | null;
};

export type AttentionItem = {
  studentId: string;
  studentName: string;
  reason: AttentionReason;
  description: string;
  priority: number;
};

type AttentionOptions = {
  now?: Date;
  inactiveAfterDays?: number;
  newStudentDays?: number;
  expiringWithinDays?: number;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const differenceInDays = (from: Date, to: Date) =>
  Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);

export function getAttentionItems(
  students: AttentionStudent[],
  options: AttentionOptions = {},
) {
  const now = options.now ?? new Date();
  const inactiveAfterDays = options.inactiveAfterDays ?? 10;
  const newStudentDays = options.newStudentDays ?? 14;
  const expiringWithinDays = options.expiringWithinDays ?? 7;

  return students
    .flatMap<AttentionItem>((student) => {
      const daysSinceEnrollment = differenceInDays(student.firstEnrolledAt, now);

      if (!student.plan) {
        return [
          {
            studentId: student.id,
            studentName: student.name,
            reason:
              daysSinceEnrollment <= newStudentDays
                ? "NEW_WITHOUT_WORKOUT"
                : "WITHOUT_WORKOUT",
            description:
              daysSinceEnrollment <= newStudentDays
                ? "Novo aluno sem treino"
                : "Sem treino ativo",
            priority: 1,
          },
        ];
      }

      if (student.plan.validUntil && startOfDay(student.plan.validUntil) < startOfDay(now)) {
        return [
          {
            studentId: student.id,
            studentName: student.name,
            reason: "EXPIRED_WORKOUT",
            description: "Treino vencido",
            priority: 1,
          },
        ];
      }

      if (
        student.plan.validUntil &&
        differenceInDays(now, student.plan.validUntil) <= expiringWithinDays
      ) {
        const daysLeft = Math.max(0, differenceInDays(now, student.plan.validUntil));
        return [
          {
            studentId: student.id,
            studentName: student.name,
            reason: "EXPIRING_WORKOUT",
            description: daysLeft === 0 ? "Treino vence hoje" : `Treino vence em ${daysLeft} dia${daysLeft === 1 ? "" : "s"}`,
            priority: 2,
          },
        ];
      }

      if (!student.lastCompletedAt) {
        return [
          {
            studentId: student.id,
            studentName: student.name,
            reason: "INACTIVE_STUDENT",
            description: "Sem treino registrado",
            priority: 3,
          },
        ];
      }

      const inactiveDays = differenceInDays(student.lastCompletedAt, now);

      if (inactiveDays >= inactiveAfterDays) {
        return [
          {
            studentId: student.id,
            studentName: student.name,
            reason: "INACTIVE_STUDENT",
            description: `Sem atividade há ${inactiveDays} dias`,
            priority: 3,
          },
        ];
      }

      return [];
    })
    .sort(
      (first, second) =>
        first.priority - second.priority || first.studentName.localeCompare(second.studentName, "pt-BR"),
    );
}

export function isPlanCurrent(validUntil: Date | null, now = new Date()) {
  return !validUntil || startOfDay(validUntil) >= startOfDay(now);
}
