import { Role, StudentStatus, WorkoutPlanStatus, WorkoutSessionStatus } from "@prisma/client";

import { getAttentionItems, isPlanCurrent, type AttentionStudent } from "@/lib/attention";
import { AuthorizationError } from "@/lib/auth";
import { canAccessStudent, type Viewer } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const studentListInclude = {
  membership: { include: { user: true } },
  primaryTeacher: { include: { user: true } },
  workoutPlans: {
    where: { status: WorkoutPlanStatus.PUBLISHED },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { days: { orderBy: { sortOrder: "asc" as const } } },
  },
  sessions: {
    where: { status: WorkoutSessionStatus.COMPLETED },
    orderBy: { completedAt: "desc" as const },
    take: 1,
  },
};

export async function getStudentsForViewer(viewer: Viewer) {
  const where =
    viewer.role === Role.PROFESSOR
      ? { organizationId: viewer.organizationId, primaryTeacherId: viewer.id }
      : { organizationId: viewer.organizationId };

  return prisma.studentProfile.findMany({
    where,
    include: studentListInclude,
    orderBy: { membership: { user: { name: "asc" } } },
  });
}

export async function getDashboardData(organizationId: string) {
  const [students, teacherMemberships] = await Promise.all([
    prisma.studentProfile.findMany({
      where: { organizationId, status: StudentStatus.ACTIVE },
      include: studentListInclude,
    }),
    prisma.membership.findMany({
      where: { organizationId, role: Role.PROFESSOR },
      include: { user: true, assignedStudents: { where: { status: StudentStatus.ACTIVE } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const attentionStudents: AttentionStudent[] = students.map((student) => ({
    id: student.id,
    name: student.membership.user.name,
    firstEnrolledAt: student.firstEnrolledAt,
    plan: student.workoutPlans[0]
      ? { id: student.workoutPlans[0].id, validUntil: student.workoutPlans[0].validUntil }
      : null,
    lastCompletedAt: student.sessions[0]?.completedAt,
  }));
  const attention = getAttentionItems(attentionStudents);
  const now = new Date();
  const plans = students.flatMap((student) => student.workoutPlans);
  const plansWithNoCurrent = students.filter((student) => {
    const plan = student.workoutPlans[0];
    return !plan || !isPlanCurrent(plan.validUntil, now);
  });

  return {
    metrics: {
      activeStudents: students.length,
      teachers: teacherMemberships.length,
      withoutCurrentPlan: plansWithNoCurrent.length,
      expiredPlans: plans.filter((plan) => plan.validUntil && !isPlanCurrent(plan.validUntil, now)).length,
      expiringPlans: attention.filter((item) => item.reason === "EXPIRING_WORKOUT").length,
      inactiveStudents: attention.filter((item) => item.reason === "INACTIVE_STUDENT").length,
      newStudents: students.filter((student) => {
        const days = Math.floor((now.getTime() - student.firstEnrolledAt.getTime()) / 86_400_000);
        return days <= 14;
      }).length,
    },
    attention,
    teacherDistribution: teacherMemberships.map((teacher) => ({
      id: teacher.id,
      name: teacher.user.name,
      studentCount: teacher.assignedStudents.length,
    })),
  };
}

export async function getStudentDetail(studentId: string, viewer: Viewer) {
  const student = await prisma.studentProfile.findFirst({
    where: { id: studentId, organizationId: viewer.organizationId },
    include: {
      membership: { include: { user: true } },
      primaryTeacher: { include: { user: true } },
      workoutPlans: {
        orderBy: { createdAt: "desc" },
        include: {
          days: {
            orderBy: { sortOrder: "asc" },
            include: {
              exercises: {
                orderBy: { sortOrder: "asc" },
                include: { exercise: true },
              },
            },
          },
        },
      },
      sessions: {
        orderBy: { startedAt: "desc" },
        include: {
          exercises: {
            orderBy: { sortOrder: "asc" },
            include: { sets: { orderBy: { setNumber: "asc" } } },
          },
        },
      },
      assessments: {
        orderBy: { assessedAt: "desc" },
        include: { recordedBy: { include: { user: true } } },
      },
    },
  });

  if (!student || !canAccessStudent(viewer, student)) {
    throw new AuthorizationError("Aluno não encontrado ou indisponível para sua conta.");
  }

  return student;
}

export async function getTeachers(organizationId: string) {
  return prisma.membership.findMany({
    where: { organizationId, role: Role.PROFESSOR },
    include: {
      user: true,
      assignedStudents: {
        where: { status: StudentStatus.ACTIVE },
        select: { id: true },
      },
    },
    orderBy: { user: { name: "asc" } },
  });
}

export async function getExercises(organizationId: string) {
  return prisma.exercise.findMany({
    where: {
      OR: [{ isSystem: true }, { organizationId }],
    },
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  });
}

export async function getTemplates(organizationId: string) {
  return prisma.trainingTemplate.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { include: { user: true } },
      days: {
        orderBy: { sortOrder: "asc" },
        include: {
          exercises: {
            orderBy: { sortOrder: "asc" },
            include: { exercise: true },
          },
        },
      },
    },
  });
}

export async function getStudentWorkout(membershipId: string, organizationId: string) {
  const student = await prisma.studentProfile.findFirst({
    where: { membershipId, organizationId },
    include: {
      membership: { include: { user: true } },
      workoutPlans: {
        where: { status: WorkoutPlanStatus.PUBLISHED },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          days: {
            orderBy: { sortOrder: "asc" },
            include: {
              exercises: {
                orderBy: { sortOrder: "asc" },
                include: { exercise: true },
              },
            },
          },
        },
      },
      sessions: {
        where: { status: WorkoutSessionStatus.IN_PROGRESS },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!student) {
    throw new AuthorizationError("Perfil de aluno não encontrado.");
  }

  const plan = student.workoutPlans[0];

  return {
    student,
    plan: plan && isPlanCurrent(plan.validUntil) ? plan : null,
    incompleteSession: student.sessions[0] ?? null,
  };
}

export async function getSessionForStudent(
  sessionId: string,
  membershipId: string,
  organizationId: string,
) {
  const session = await prisma.workoutSession.findFirst({
    where: {
      id: sessionId,
      organizationId,
      student: { membershipId },
    },
    include: {
      student: { include: { membership: { include: { user: true } } } },
      exercises: {
        orderBy: { sortOrder: "asc" },
        include: { sets: { orderBy: { setNumber: "asc" } } },
      },
    },
  });

  if (!session) {
    throw new AuthorizationError("Sessão não encontrada.");
  }

  return session;
}

export async function getLastLoadsForExercises(
  studentId: string,
  organizationId: string,
  exerciseIds: string[],
) {
  if (exerciseIds.length === 0) return new Map<string, number>();

  const sessions = await prisma.workoutSession.findMany({
    where: {
      organizationId,
      studentId,
      status: WorkoutSessionStatus.COMPLETED,
      exercises: { some: { exerciseId: { in: exerciseIds } } },
    },
    orderBy: { completedAt: "desc" },
    include: {
      exercises: {
        where: { exerciseId: { in: exerciseIds } },
        include: { sets: { orderBy: { setNumber: "desc" } } },
      },
    },
  });

  const lastLoads = new Map<string, number>();

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      if (lastLoads.has(exercise.exerciseId)) continue;
      const load = exercise.sets.find((set) => set.load !== null)?.load;
      if (load !== undefined && load !== null) lastLoads.set(exercise.exerciseId, load);
    }
  }

  return lastLoads;
}
