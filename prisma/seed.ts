import { Role, StudentStatus, WorkoutPlanStatus, WorkoutSessionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";

type SeedStudent = Awaited<ReturnType<typeof prisma.studentProfile.create>>;
type SeedPlan = {
  id: string;
  days: Array<{
    id: string;
    code: string;
    name: string;
    exercises: Array<{
      id: string;
      exerciseId: string;
      sortOrder: number;
      sets: number;
      repsMin: number;
      repsMax: number;
      suggestedLoad: number | null;
      exercise: { name: string };
    }>;
  }>;
};

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

async function createUserWithMembership(input: {
  name: string;
  email: string;
  passwordHash: string;
  organizationId: string;
  role: Role;
}) {
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
    },
  });

  return prisma.membership.create({
    data: {
      organizationId: input.organizationId,
      userId: user.id,
      role: input.role,
    },
    include: { user: true },
  });
}

async function main() {
  await prisma.workoutSet.deleteMany();
  await prisma.workoutSessionExercise.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.workoutExercise.deleteMany();
  await prisma.workoutDay.deleteMany();
  await prisma.workoutPlan.deleteMany();
  await prisma.physicalAssessment.deleteMany();
  await prisma.templateExercise.deleteMany();
  await prisma.templateDay.deleteMany();
  await prisma.trainingTemplate.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const organization = await prisma.organization.create({
    data: {
      name: "Movimento Academia",
      slug: "movimento-academia",
    },
  });

  const passwordHash = await bcrypt.hash("Demo123!", 12);

  const admin = await createUserWithMembership({
    name: "Marina Costa",
    email: "admin@movimento.fit",
    passwordHash,
    organizationId: organization.id,
    role: Role.ADMIN,
  });

  const teacherInputs = [
    ["Rafael Alves", "rafael@movimento.fit"],
    ["Camila Rocha", "camila@movimento.fit"],
    ["Diego Martins", "diego@movimento.fit"],
    ["Bianca Lima", "bianca@movimento.fit"],
  ] as const;

  const teachers = await Promise.all(
    teacherInputs.map(([name, email]) =>
      createUserWithMembership({
        name,
        email,
        passwordHash,
        organizationId: organization.id,
        role: Role.PROFESSOR,
      }),
    ),
  );

  const studentNames = [
    "Gabriel Santana",
    "João Silva",
    "Maria Souza",
    "Carlos Santos",
    "Ana Oliveira",
    "Lucas Pereira",
    "Larissa Freitas",
    "Felipe Nunes",
    "Juliana Costa",
    "Pedro Henrique",
    "Mariana Lopes",
    "Thiago Ribeiro",
    "Beatriz Almeida",
    "Gustavo Azevedo",
    "Isabela Moura",
    "Vinícius Castro",
    "Letícia Ramos",
    "André Barbosa",
    "Paula Mendes",
    "Renato Cardoso",
    "Sofia Barros",
    "Caio Teixeira",
    "Bruna Farias",
    "Eduardo Pires",
    "Natália Gomes",
  ];

  const goals = [
    "Hipertrofia",
    "Emagrecimento",
    "Condicionamento físico",
    "Ganho de força",
  ];

  const students: SeedStudent[] = [];

  for (const [index, name] of studentNames.entries()) {
    const membership = await createUserWithMembership({
      name,
      email: index === 0 ? "aluno@movimento.fit" : `aluno${index + 1}@movimento.fit`,
      passwordHash,
      organizationId: organization.id,
      role: Role.STUDENT,
    });

    const student = await prisma.studentProfile.create({
      data: {
        organizationId: organization.id,
        membershipId: membership.id,
        primaryTeacherId: index === 0 ? teachers[0].id : teachers[index % teachers.length].id,
        birthDate: daysFromNow(-(22 + (index % 18)) * 365),
        goal: goals[index % goals.length],
        notes:
          index % 5 === 0
            ? "Prefere treinar no início da manhã."
            : undefined,
        status: index === 24 ? StudentStatus.INACTIVE : StudentStatus.ACTIVE,
        firstEnrolledAt: daysFromNow(-(8 + index * 3)),
      },
      include: {
        membership: { include: { user: true } },
        primaryTeacher: { include: { user: true } },
      },
    });

    students.push(student);
  }

  const exerciseInputs = [
    ["Supino reto", "Peitoral", "Empurre a barra com escápulas estabilizadas."],
    ["Supino inclinado com halteres", "Peitoral", "Mantenha os punhos neutros."],
    ["Crucifixo na máquina", "Peitoral", "Controle a fase de retorno."],
    ["Desenvolvimento com halteres", "Ombros", "Evite compensar com a lombar."],
    ["Elevação lateral", "Ombros", "Suba até a altura dos ombros."],
    ["Tríceps na polia", "Tríceps", "Mantenha os cotovelos junto ao corpo."],
    ["Puxada alta", "Costas", "Puxe em direção à parte alta do peito."],
    ["Remada baixa", "Costas", "Aproxime as escápulas no final."],
    ["Remada unilateral", "Costas", "Evite girar o tronco."],
    ["Rosca direta", "Bíceps", "Controle sem balançar o tronco."],
    ["Rosca martelo", "Bíceps", "Mantenha o cotovelo estável."],
    ["Agachamento livre", "Quadríceps / Glúteos", "Desça com controle e joelhos alinhados."],
    ["Leg press 45°", "Quadríceps", "Não retire a lombar do apoio."],
    ["Cadeira extensora", "Quadríceps", "Pausa curta no topo."],
    ["Mesa flexora", "Posterior de coxa", "Controle a extensão."],
    ["Levantamento terra romeno", "Posterior de coxa / Glúteos", "Mantenha a coluna neutra."],
    ["Panturrilha em pé", "Panturrilhas", "Use amplitude completa."],
    ["Prancha", "Core", "Mantenha quadris estáveis."],
    ["Abdominal na polia", "Core", "Flexione o tronco sem puxar o pescoço."],
  ] as const;

  const exercises = await Promise.all(
    exerciseInputs.map(([name, muscleGroup, instructions]) =>
      prisma.exercise.create({
        data: {
          name,
          muscleGroup,
          instructions,
          description: `Exercício de ${muscleGroup.toLowerCase()}.`,
          isSystem: true,
        },
      }),
    ),
  );

  const byExerciseName = new Map(exercises.map((exercise) => [exercise.name, exercise]));
  const exerciseId = (name: string) => {
    const exercise = byExerciseName.get(name);
    if (!exercise) throw new Error(`Exercício ausente no seed: ${name}`);
    return exercise.id;
  };

  const abcTemplate = await prisma.trainingTemplate.create({
    data: {
      organizationId: organization.id,
      createdByMembershipId: teachers[0].id,
      name: "Hipertrofia iniciante ABC",
      description: "Base para alunos iniciantes com foco em hipertrofia.",
      days: {
        create: [
          {
            code: "A",
            name: "Peito, ombro e tríceps",
            sortOrder: 1,
            exercises: {
              create: [
                ["Supino reto", 4, 8, 10, 70, 90],
                ["Supino inclinado com halteres", 3, 10, 12, 20, 75],
                ["Desenvolvimento com halteres", 3, 10, 12, 16, 75],
                ["Elevação lateral", 3, 12, 15, 8, 60],
                ["Tríceps na polia", 3, 10, 12, 25, 60],
              ].map(([name, sets, repsMin, repsMax, suggestedLoad, restSeconds], index) => ({
                exerciseId: exerciseId(name as string),
                sortOrder: index + 1,
                sets: sets as number,
                repsMin: repsMin as number,
                repsMax: repsMax as number,
                suggestedLoad: suggestedLoad as number,
                restSeconds: restSeconds as number,
              })),
            },
          },
          {
            code: "B",
            name: "Costas e bíceps",
            sortOrder: 2,
            exercises: {
              create: [
                ["Puxada alta", 4, 8, 10, 55, 90],
                ["Remada baixa", 3, 10, 12, 45, 75],
                ["Remada unilateral", 3, 10, 12, 22, 75],
                ["Rosca direta", 3, 10, 12, 18, 60],
                ["Rosca martelo", 3, 10, 12, 12, 60],
              ].map(([name, sets, repsMin, repsMax, suggestedLoad, restSeconds], index) => ({
                exerciseId: exerciseId(name as string),
                sortOrder: index + 1,
                sets: sets as number,
                repsMin: repsMin as number,
                repsMax: repsMax as number,
                suggestedLoad: suggestedLoad as number,
                restSeconds: restSeconds as number,
              })),
            },
          },
          {
            code: "C",
            name: "Pernas e core",
            sortOrder: 3,
            exercises: {
              create: [
                ["Agachamento livre", 4, 8, 10, 65, 120],
                ["Leg press 45°", 3, 10, 12, 140, 90],
                ["Mesa flexora", 3, 10, 12, 40, 75],
                ["Cadeira extensora", 3, 12, 15, 45, 60],
                ["Panturrilha em pé", 4, 12, 15, 45, 60],
                ["Prancha", 3, 30, 45, 0, 45],
              ].map(([name, sets, repsMin, repsMax, suggestedLoad, restSeconds], index) => ({
                exerciseId: exerciseId(name as string),
                sortOrder: index + 1,
                sets: sets as number,
                repsMin: repsMin as number,
                repsMax: repsMax as number,
                suggestedLoad: suggestedLoad as number,
                restSeconds: restSeconds as number,
              })),
            },
          },
        ],
      },
    },
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
  });

  await prisma.trainingTemplate.create({
    data: {
      organizationId: organization.id,
      createdByMembershipId: teachers[1].id,
      name: "Força essencial 2x",
      description: "Estrutura simples de corpo inteiro para duas sessões semanais.",
      days: {
        create: [
          {
            code: "A",
            name: "Corpo inteiro A",
            sortOrder: 1,
            exercises: {
              create: [
                ["Agachamento livre", 4, 5, 6, 75, 120],
                ["Supino reto", 4, 5, 6, 75, 120],
                ["Remada baixa", 4, 6, 8, 50, 90],
              ].map(([name, sets, repsMin, repsMax, suggestedLoad, restSeconds], index) => ({
                exerciseId: exerciseId(name as string),
                sortOrder: index + 1,
                sets: sets as number,
                repsMin: repsMin as number,
                repsMax: repsMax as number,
                suggestedLoad: suggestedLoad as number,
                restSeconds: restSeconds as number,
              })),
            },
          },
          {
            code: "B",
            name: "Corpo inteiro B",
            sortOrder: 2,
            exercises: {
              create: [
                ["Levantamento terra romeno", 4, 6, 8, 65, 120],
                ["Puxada alta", 4, 6, 8, 60, 90],
                ["Desenvolvimento com halteres", 3, 8, 10, 18, 75],
              ].map(([name, sets, repsMin, repsMax, suggestedLoad, restSeconds], index) => ({
                exerciseId: exerciseId(name as string),
                sortOrder: index + 1,
                sets: sets as number,
                repsMin: repsMin as number,
                repsMax: repsMax as number,
                suggestedLoad: suggestedLoad as number,
                restSeconds: restSeconds as number,
              })),
            },
          },
        ],
      },
    },
  });

  const plans = new Map<string, SeedPlan>();

  for (const [index, student] of students.entries()) {
    if (index === 1) continue;

    const validUntil =
      index === 2 ? daysFromNow(-3) : index === 3 ? daysFromNow(1) : daysFromNow(42 - index);

    const plan = await prisma.workoutPlan.create({
      data: {
        organizationId: organization.id,
        studentId: student.id,
        createdByMembershipId: student.primaryTeacherId ?? teachers[0].id,
        sourceTemplateId: abcTemplate.id,
        name: index === 2 ? "Hipertrofia ABC — revisão pendente" : "Hipertrofia ABC — ciclo atual",
        description: "Treino individual derivado do template de hipertrofia.",
        validFrom: daysFromNow(-28),
        validUntil,
        status: WorkoutPlanStatus.PUBLISHED,
        days: {
          create: abcTemplate.days.map((day) => ({
            organizationId: organization.id,
            code: day.code,
            name: day.name,
            sortOrder: day.sortOrder,
            exercises: {
              create: day.exercises.map((item) => ({
                organizationId: organization.id,
                exerciseId: item.exerciseId,
                sortOrder: item.sortOrder,
                sets: item.sets,
                repsMin: item.repsMin,
                repsMax: item.repsMax,
                suggestedLoad: item.suggestedLoad,
                restSeconds: item.restSeconds,
                notes: item.notes,
              })),
            },
          })),
        },
      },
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
    });

    plans.set(student.id, plan);
  }

  async function createCompletedSession(
    studentIndex: number,
    daysAgo: number,
    loadOffset = 0,
  ) {
    const student = students[studentIndex];
    const plan = plans.get(student.id);
    if (!plan) return;

    const day = plan.days[studentIndex % plan.days.length];
    const completedAt = daysFromNow(-daysAgo);
    completedAt.setHours(18, 10, 0, 0);

    await prisma.workoutSession.create({
      data: {
        organizationId: organization.id,
        studentId: student.id,
        workoutPlanId: plan.id,
        workoutDayId: day.id,
        dayName: `${day.code} · ${day.name}`,
        startedAt: new Date(completedAt.getTime() - 52 * 60 * 1000),
        completedAt,
        durationMinutes: 52,
        status: WorkoutSessionStatus.COMPLETED,
        exercises: {
          create: day.exercises.map((item) => ({
            workoutExerciseId: item.id,
            exerciseId: item.exerciseId,
            exerciseName: item.exercise.name,
            sortOrder: item.sortOrder,
            targetSets: item.sets,
            targetRepsMin: item.repsMin,
            targetRepsMax: item.repsMax,
            completedAt,
            sets: {
              create: Array.from({ length: item.sets }, (_, index) => ({
                setNumber: index + 1,
                load: item.suggestedLoad ? item.suggestedLoad + loadOffset : null,
                reps: Math.max(item.repsMin, item.repsMax - (index === item.sets - 1 ? 1 : 0)),
                completedAt,
              })),
            },
          })),
        },
      },
    });
  }

  await createCompletedSession(0, 1, 0);
  await createCompletedSession(0, 5, -2.5);
  await createCompletedSession(3, 12, -5);
  await createCompletedSession(4, 2, 2.5);
  await createCompletedSession(5, 4, 0);
  await createCompletedSession(6, 3, 0);
  await createCompletedSession(7, 8, -2.5);
  await createCompletedSession(8, 1, 2.5);
  await createCompletedSession(9, 6, 0);
  await createCompletedSession(10, 14, -5);
  await createCompletedSession(12, 2, 2.5);
  await createCompletedSession(14, 4, 0);
  await createCompletedSession(16, 1, 0);
  await createCompletedSession(18, 6, -2.5);
  await createCompletedSession(21, 3, 2.5);

  for (const [index, student] of students.slice(0, 14).entries()) {
    const teacherId = student.primaryTeacherId ?? teachers[0].id;
    const startingWeight = 87 - index * 0.7;

    await prisma.physicalAssessment.create({
      data: {
        organizationId: organization.id,
        studentId: student.id,
        recordedByMembershipId: teacherId,
        assessedAt: daysFromNow(-52),
        weight: startingWeight,
        height: 1.62 + (index % 6) * 0.04,
        waist: 96 - index * 0.5,
        hip: 104 - index * 0.2,
        arm: 32 + (index % 5),
        thigh: 54 + (index % 6),
        notes: "Avaliação inicial do ciclo.",
      },
    });

    await prisma.physicalAssessment.create({
      data: {
        organizationId: organization.id,
        studentId: student.id,
        recordedByMembershipId: teacherId,
        assessedAt: daysFromNow(-4),
        weight: startingWeight - (0.8 + (index % 3) * 0.2),
        height: 1.62 + (index % 6) * 0.04,
        waist: 93 - index * 0.5,
        hip: 102 - index * 0.2,
        arm: 32.5 + (index % 5),
        thigh: 54.5 + (index % 6),
        notes: "Boa adesão ao treino nas últimas semanas.",
      },
    });
  }

  console.log("Seed concluído para Movimento Academia.");
  console.log("Admin: admin@movimento.fit / Demo123!");
  console.log("Professor: rafael@movimento.fit / Demo123!");
  console.log("Aluno: aluno@movimento.fit / Demo123!");
  console.log(`Administrador criado: ${admin.user.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
