import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";

const state = vi.hoisted(() => ({ viewer: null as unknown }));
vi.mock("@/lib/auth", () => {
  class AuthorizationError extends Error {}
  return { AuthorizationError, requireRole: async (...roles: string[]) => {
    const viewer = state.viewer as { role: string } | null;
    if (!viewer || (roles.length && !roles.includes(viewer.role))) throw new AuthorizationError("Acesso negado.");
    return viewer;
  }, getCurrentMembership: async () => state.viewer };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); }, unstable_rethrow: (e: unknown) => { if (e instanceof Error && e.message.startsWith("REDIRECT:")) throw e; } }));

import { prisma } from "@/lib/prisma";
import { createStudent, createTeacher, updateTeacher, updateStudent } from "@/app/actions/people";
import { createTemplate, assignTemplateToStudent, saveWorkoutPlan } from "@/app/actions/training";
import { startStudentWorkout, saveStudentWorkout } from "@/app/actions/sessions";
import { createAssessment } from "@/app/actions/assessments";
import { updateOrganization } from "@/app/actions/account";
import { createNutritionist, publishNutritionPlan } from "@/app/actions/nutrition";
import { createCommunityPost, commentCommunityPost, toggleCommunityLike, moderateCommunityPost } from "@/app/actions/community";
import { saveRunActivity } from "@/app/actions/running";
import { getStudentsForViewer } from "@/lib/queries";
import type { ActionResult } from "@/lib/action-result";

type Viewer = Prisma.MembershipGetPayload<{ include: { user: true; organization: true; studentProfile: true } }>;
const form = (values: Record<string, string | number>) => { const data=new FormData(); for (const [k,v] of Object.entries(values)) data.set(k,String(v)); return data; };
async function act(action: (data: FormData) => Promise<ActionResult | void>, values: Record<string,string|number>) {
  try { const result = await action(form(values)); expect(result?.error).toBeUndefined(); return result; }
  catch(error) { if (error instanceof Error && error.message.startsWith("REDIRECT:")) return; throw error; }
}
const include = { user: true, organization: true, studentProfile: true } as const;
let admin: Viewer, outsider: Viewer, teacher: Viewer, learner: Viewer;
let studentId: string, exerciseId: string;
const suffix = crypto.randomUUID().slice(0,8);
const payload = () => JSON.stringify({ days: [{ code: 'A', name: 'Corpo inteiro', exercises: [{ exerciseId, sets: 2, repsMin: 8, repsMax: 12, suggestedLoad: 20, restSeconds: 60, notes: 'Controle o movimento' }] }] });

beforeAll(async () => {
  for (const [index,name] of ['A','B'].entries()) {
    const org = await prisma.organization.create({ data:{ name:`Teste ${name}`, slug:`test-${suffix}-${name}` } });
    const user = await prisma.user.create({ data:{ name:`Admin ${name}`, email:`admin-${name}-${suffix}@example.com`, passwordHash:'not-used-by-mocked-auth' } });
    const m=await prisma.membership.create({ data:{ organizationId:org.id,userId:user.id,role:'ADMIN' },include });
    if(index===0)admin=m; else outsider=m;
  }
  state.viewer=admin;
  await act(createTeacher,{name:'Professor Teste',email:`teacher-${suffix}@example.com`,password:'TeacherTest123!'});
  teacher=(await prisma.membership.findFirstOrThrow({where:{organizationId:admin.organizationId,role:'PROFESSOR'},include}));
  await act(createStudent,{name:'Aluno Teste',email:`student-${suffix}@example.com`,password:'StudentTest123!',primaryTeacherId:teacher.id});
  learner=await prisma.membership.findFirstOrThrow({where:{organizationId:admin.organizationId,role:'STUDENT'},include});
  studentId=learner.studentProfile!.id;
  exerciseId=(await prisma.exercise.create({data:{organizationId:admin.organizationId,name:'Exercício teste',muscleGroup:'Pernas',unit:'REPS'}})).id;
});
afterAll(() => prisma.$disconnect());

describe('real database operational flow', () => {
  it('creates, assigns, logs, resumes and revises a workout without losing history', async () => {
    state.viewer=admin;
    await act(createTemplate,{name:'Modelo teste',payload:payload()});
    const template=await prisma.trainingTemplate.findFirstOrThrow({where:{organizationId:admin.organizationId}});
    await act(assignTemplateToStudent,{studentId,templateId:template.id});
    const original=await prisma.workoutPlan.findFirstOrThrow({where:{studentId,status:'PUBLISHED'},include:{days:true}});
    state.viewer=learner;
    await act(startStudentWorkout,{workoutDayId:original.days[0].id});
    // A second request resumes the same session instead of creating a duplicate.
    await act(startStudentWorkout,{workoutDayId:original.days[0].id});
    expect(await prisma.workoutSession.count({where:{studentId,status:'IN_PROGRESS'}})).toBe(1);
    const session=await prisma.workoutSession.findFirstOrThrow({where:{studentId,status:'IN_PROGRESS'},include:{exercises:{include:{sets:true}}}});
    const set=session.exercises[0].sets[0];
    expect(set.load).toBeNull(); expect(set.reps).toBeNull();
    const values={sessionId:session.id,version:0,intent:'save',[`load-${set.id}`]:'20',[`reps-${set.id}`]:'10',[`done-${set.id}`]:'on'};
    const saved=await act(saveStudentWorkout,values);
    expect(saved?.version).toBe(1);
    expect((await prisma.workoutSet.findUniqueOrThrow({where:{id:set.id}})).reps).toBe(10);
    const stale=await saveStudentWorkout(form({...values,[`reps-${set.id}`]:'99'}));
    expect(stale.error).toContain('outra aba');
    expect((await prisma.workoutSet.findUniqueOrThrow({where:{id:set.id}})).reps).toBe(10);
    await act(saveStudentWorkout,{...values,version:1,intent:'finish'});
    expect((await prisma.workoutSession.findUniqueOrThrow({where:{id:session.id}})).status).toBe('COMPLETED');
    expect(await prisma.workoutSet.count({where:{sessionExercise:{sessionId:session.id},completedAt:{not:null}}})).toBe(1);
    state.viewer=teacher;
    await act(saveWorkoutPlan,{studentId,planId:original.id,name:'Ciclo revisado',payload:payload()});
    expect((await prisma.workoutPlan.findUniqueOrThrow({where:{id:original.id}})).status).toBe('ARCHIVED');
    expect((await prisma.workoutSession.findUniqueOrThrow({where:{id:session.id}})).workoutPlanId).toBe(original.id);
    expect(await prisma.workoutPlan.count({where:{studentId,status:'PUBLISHED'}})).toBe(1);
  });
  it('rejects tenant and role forgery at action boundaries', async () => {
    state.viewer=outsider;
    expect((await saveWorkoutPlan(form({studentId,name:'Invasão',payload:payload()}))).error).toBeTruthy();
    expect((await createAssessment(form({studentId,weight:'70'}))).error).toBeTruthy();
    state.viewer=learner;
    expect((await updateOrganization(form({name:'Alterado',contactEmail:'',primaryColor:'#047857'}))).error).toBeTruthy();
    expect((await getStudentsForViewer(learner)).map(s=>s.id)).toEqual([studentId]);
    expect((await prisma.organization.findUniqueOrThrow({where:{id:admin.organizationId}})).name).toBe('Teste A');
  });
  it('rejects blank and implausible assessments and records a valid one', async () => {
    state.viewer=teacher;
    expect((await createAssessment(form({studentId}))).error).toContain('pelo menos');
    expect((await createAssessment(form({studentId,height:'500'}))).error).toBeTruthy();
    await act(createAssessment,{studentId,weight:'72,5',height:'1.75',waist:'85'});
    expect((await prisma.physicalAssessment.findFirstOrThrow({where:{studentId}})).weight).toBe(72.5);
  });
  it('blocks deactivating a teacher who still owns active students', async () => {
    state.viewer=admin;
    expect((await updateTeacher(form({membershipId:teacher.id,name:teacher.user.name,active:'false'}))).error).toContain('Transfira');
    expect((await prisma.membership.findUniqueOrThrow({where:{id:teacher.id}})).active).toBe(true);
  });
  it('rejects invalid exercise references and duplicate day codes atomically', async () => {
    state.viewer=admin;
    const before=await prisma.workoutPlan.count({where:{studentId}});
    const foreign=await prisma.exercise.create({data:{organizationId:outsider.organizationId,name:'Privado B',muscleGroup:'Costas'}});
    expect((await saveWorkoutPlan(form({studentId,name:'Inválido',payload:payload().replace(exerciseId,foreign.id)}))).error).toBeTruthy();
    const parsed=JSON.parse(payload()); parsed.days.push(parsed.days[0]);
    expect((await saveWorkoutPlan(form({studentId,name:'Duplicado',payload:JSON.stringify(parsed)}))).error).toBeTruthy();
    expect(await prisma.workoutPlan.count({where:{studentId}})).toBe(before);
  });
  it('isolates the community by academy and supports posts, comments and moderation', async () => {
    state.viewer=learner;
    await act(createCommunityPost,{body:'Completei meu primeiro mês de treino!'});
    const post=await prisma.communityPost.findFirstOrThrow({where:{organizationId:admin.organizationId,authorId:learner.id}});
    await act(toggleCommunityLike,{postId:post.id});
    state.viewer=teacher;
    await act(commentCommunityPost,{postId:post.id,body:'Parabéns, continue assim!'});
    expect(await prisma.communityLike.count({where:{postId:post.id}})).toBe(1);
    expect(await prisma.communityComment.count({where:{postId:post.id}})).toBe(1);
    state.viewer=outsider;
    expect((await commentCommunityPost(form({postId:post.id,body:'Mensagem indevida'}))).error).toBeTruthy();
    expect((await toggleCommunityLike(form({postId:post.id}))).error).toBeTruthy();
    expect((await moderateCommunityPost(form({postId:post.id,hidden:'true'}))).error).toBeTruthy();
    state.viewer=admin;
    await act(moderateCommunityPost,{postId:post.id,hidden:'true'});
    expect((await prisma.communityPost.findUniqueOrThrow({where:{id:post.id}})).hidden).toBe(true);
    state.viewer=learner;
    expect((await commentCommunityPost(form({postId:post.id,body:'Nova mensagem'}))).error).toBeTruthy();
  });
  it('allows only the assigned nutritionist to publish a personal plan', async () => {
    state.viewer=admin;
    await act(createNutritionist,{name:'Nutricionista Teste',email:`nutrition-${suffix}@example.com`,password:'NutriTest123!'});
    const professional=await prisma.membership.findFirstOrThrow({where:{organizationId:admin.organizationId,role:'NUTRITIONIST'},include});
    await act(updateStudent,{studentId,name:'Aluno Teste',primaryTeacherId:teacher.id,nutritionistId:professional.id,status:'ACTIVE'});
    const fields={studentId,title:'Rotina individual',guidance:'Orientações desenvolvidas para este aluno.',meal1Title:'Café da manhã',meal1Details:'Refeição definida pelo profissional.'};
    state.viewer=teacher;
    expect((await publishNutritionPlan(form(fields))).error).toBeTruthy();
    state.viewer=outsider;
    expect((await publishNutritionPlan(form(fields))).error).toBeTruthy();
    state.viewer=professional;
    await act(publishNutritionPlan,fields);
    expect(await prisma.nutritionPlan.count({where:{organizationId:admin.organizationId,studentId,active:true}})).toBe(1);
    state.viewer=admin;
    await act(updateStudent,{studentId,name:'Aluno Teste',primaryTeacherId:teacher.id,nutritionistId:'',status:'ACTIVE'});
    expect(await prisma.nutritionPlan.count({where:{studentId,active:true}})).toBe(0);
    state.viewer=professional;
    expect((await publishNutritionPlan(form(fields))).error).toBeTruthy();
  });
  it('stores a run under its owner and rejects another role and forged distance', async () => {
    const now=Date.now();
    const points=JSON.stringify([{lat:-23.55,lng:-46.63,t:now-20_000,segment:0},{lat:-23.5495,lng:-46.63,t:now-8_000,segment:0}]);
    const data={startedAt:new Date(now-30_000).toISOString(),durationSeconds:25,points};
    state.viewer=teacher;
    expect((await saveRunActivity(form(data))).error).toBeTruthy();
    state.viewer=learner;
    await act(saveRunActivity,data);
    const activity=await prisma.runActivity.findFirstOrThrow({where:{organizationId:admin.organizationId,studentId}});
    expect(activity.distanceMeters).toBeGreaterThan(50);
    expect(await prisma.runActivity.count({where:{organizationId:outsider.organizationId}})).toBe(0);
    expect((await saveRunActivity(form({...data,points:'[]'}))).error).toBeTruthy();
  });
});
