import { Role } from "@prisma/client";
import { replyExerciseVideo } from "@/app/actions/member-features";
import { ActionForm } from "@/components/action-form";
import { PageHeader, inputClassName } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export default async function Feedback() {
 const viewer = await requireRole(Role.ADMIN, Role.PROFESSOR);
 const items = await prisma.exerciseFeedback.findMany({ where: { organizationId: viewer.organizationId }, include: { student: { include: { membership: { include: { user: true } } } } }, orderBy: { createdAt: "desc" }, take: 100 });
 return <div className="space-y-6"><PageHeader title="Avaliar execução" description="Vídeos enviados pelos alunos para orientação da equipe." />{items.map(item => <article key={item.id} className="space-y-3 border-l-4 border-[var(--accent)] bg-white p-5"><h2 className="font-bold">{item.student.membership.user.name} · {item.exerciseName}</h2><a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] underline">Abrir vídeo ↗</a><p className="whitespace-pre-wrap text-sm">{item.comment}</p><ActionForm action={replyExerciseVideo} className="space-y-3"><input type="hidden" name="feedbackId" value={item.id} /><textarea name="coachReply" aria-label={`Avaliação de ${item.exerciseName}`} defaultValue={item.coachReply ?? ""} required maxLength={1000} className={inputClassName} /><button className="secondary-button">Salvar orientação</button></ActionForm></article>)}</div>;
}
