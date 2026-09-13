import { Role } from "@prisma/client";
import { requireRole, AuthorizationError } from "@/lib/auth";
import { getStudentsForViewer } from "@/lib/queries";
import { toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";

export async function GET() {
  try {
    const viewer = await requireRole(Role.ADMIN);
    const students = await getStudentsForViewer(viewer);
    const rows = [["Nome", "E-mail", "Telefone", "Professor", "Status", "Objetivo", "Treino", "Validade"], ...students.map(s => [s.membership.user.name, s.membership.user.email, s.phone, s.primaryTeacher?.user.name, s.status === "ACTIVE" ? "Ativo" : "Inativo", s.goal, s.workoutPlans[0]?.name, formatDate(s.workoutPlans[0]?.validUntil)])];
    return new Response(toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="alunos.csv"', "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error instanceof AuthorizationError) return Response.json({ error: "Acesso restrito à administração da academia." }, { status: 403 });
    throw error;
  }
}
