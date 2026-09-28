import { Role } from "@prisma/client";
import { submitExerciseVideo } from "@/app/actions/member-features";
import { ActionForm } from "@/components/action-form";
import { PageHeader, inputClassName, labelClassName } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export default async function MyFeedback() {
 const viewer = await requireRole(Role.STUDENT);
 const items = await prisma.exerciseFeedback.findMany({ where: { organizationId: viewer.organizationId, studentId: viewer.studentProfile!.id }, orderBy: { createdAt: "desc" }, take: 50 });
 return <div className="space-y-6"><PageHeader title="Vídeos e correções" description="Compartilhe um link privado HTTPS para o vídeo de uma série. O professor poderá responder aqui." /><ActionForm action={submitExerciseVideo} className="space-y-4 bg-white p-5"><label className={labelClassName}>Exercício<input name="exerciseName" required maxLength={120} className={inputClassName} /></label><label className={labelClassName}>Link do vídeo (HTTPS)<input name="videoUrl" type="url" required maxLength={500} className={inputClassName} /></label><label className={labelClassName}>O que deseja avaliar?<textarea name="comment" maxLength={1000} className={inputClassName} /></label><button className="primary-button">Enviar para avaliação</button><p className="text-xs text-[#64707d]">Configure o compartilhamento no serviço onde hospedou o vídeo. Quem tiver o link poderá acessá-lo conforme as regras desse serviço.</p></ActionForm><section className="space-y-3">{items.map(item => <article key={item.id} className="border-l-4 border-[var(--accent)] bg-white p-5"><strong>{item.exerciseName}</strong><p className="text-sm text-[#64707d]">{new Intl.DateTimeFormat("pt-BR").format(item.createdAt)}</p><a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[var(--accent)] underline">Ver vídeo ↗</a><p className="mt-2 whitespace-pre-wrap text-sm">{item.comment}</p><p className="mt-3 text-sm"><strong>Professor:</strong> {item.coachReply ?? "Aguardando avaliação"}</p></article>)}</section></div>;
}
