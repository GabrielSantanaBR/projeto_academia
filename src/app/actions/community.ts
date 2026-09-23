"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, AuthorizationError } from "@/lib/auth";
import { InputError } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { safeAction } from "@/lib/safe-action";
import { formValues } from "@/lib/validation";

const message = z.object({ body: z.string().trim().min(3).max(700) });
const postInput = z.object({ postId: z.string().min(1) });

export async function createCommunityPost(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole();
    const input = message.parse(formValues(data));
    const latest = await prisma.communityPost.findFirst({ where: { organizationId: viewer.organizationId, authorId: viewer.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
    if (latest && Date.now() - latest.createdAt.getTime() < 30_000) throw new InputError("Aguarde alguns segundos antes de publicar novamente.");
    await prisma.communityPost.create({ data: { organizationId: viewer.organizationId, authorId: viewer.id, body: input.body } });
    revalidatePath("/community");
    return { success: "Publicação compartilhada com a sua academia." };
  });
}

export async function commentCommunityPost(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole();
    const input = message.extend({ postId: z.string().min(1) }).parse(formValues(data));
    const post = await prisma.communityPost.findFirst({ where: { id: input.postId, organizationId: viewer.organizationId, hidden: false }, select: { id: true } });
    if (!post) throw new AuthorizationError("Esta publicação não está disponível.");
    const latest = await prisma.communityComment.findFirst({ where: { organizationId: viewer.organizationId, authorId: viewer.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
    if (latest && Date.now() - latest.createdAt.getTime() < 10_000) throw new InputError("Aguarde alguns segundos antes de comentar novamente.");
    await prisma.communityComment.create({ data: { organizationId: viewer.organizationId, postId: post.id, authorId: viewer.id, body: input.body } });
    revalidatePath("/community");
    return { success: "Comentário publicado." };
  });
}

export async function toggleCommunityLike(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole();
    const { postId } = postInput.parse(formValues(data));
    const post = await prisma.communityPost.findFirst({ where: { id: postId, organizationId: viewer.organizationId, hidden: false }, select: { id: true } });
    if (!post) throw new AuthorizationError();
    const removed = await prisma.communityLike.deleteMany({ where: { organizationId: viewer.organizationId, postId, memberId: viewer.id } });
    if (!removed.count) await prisma.communityLike.create({ data: { organizationId: viewer.organizationId, postId, memberId: viewer.id } });
    revalidatePath("/community");
    return { success: removed.count ? "Curtida removida." : "Publicação curtida." };
  });
}

export async function moderateCommunityPost(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole();
    const input = postInput.extend({ hidden: z.enum(["true", "false"]) }).parse(formValues(data));
    const post = await prisma.communityPost.findFirst({ where: { id: input.postId, organizationId: viewer.organizationId } });
    if (!post || (viewer.role !== Role.ADMIN && post.authorId !== viewer.id) || (input.hidden === "false" && viewer.role !== Role.ADMIN)) throw new AuthorizationError();
    await prisma.communityPost.updateMany({ where: { id: post.id, organizationId: viewer.organizationId }, data: { hidden: input.hidden === "true" } });
    revalidatePath("/community");
    return { success: input.hidden === "true" ? "Publicação ocultada." : "Publicação restaurada." };
  });
}

export async function moderateCommunityComment(data: FormData) {
  return safeAction(async () => {
    const viewer = await requireRole();
    const input = z.object({ commentId: z.string().min(1) }).parse(formValues(data));
    const comment = await prisma.communityComment.findFirst({ where: { id: input.commentId, organizationId: viewer.organizationId, post: { organizationId: viewer.organizationId, hidden: false } }, select: { authorId: true } });
    if (!comment || (comment.authorId !== viewer.id && viewer.role !== Role.ADMIN)) throw new AuthorizationError();
    await prisma.communityComment.updateMany({ where: { id: input.commentId, organizationId: viewer.organizationId }, data: { hidden: true } });
    revalidatePath("/community");
    return { success: "Comentário ocultado." };
  });
}
