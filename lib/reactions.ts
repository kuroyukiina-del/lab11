// lib/reactions.ts — Model Layer (เข้าถึงข้อมูล Prisma โดยตรง)
import { prisma } from './prisma';

export async function findReaction(commentId: string, userId: string, emoji: string) {
  return prisma.commentReaction.findUnique({
    where: {
      commentId_userId_emoji: {
        commentId,
        userId,
        emoji,
      },
    },
  });
}

export async function addReaction(commentId: string, userId: string, emoji: string) {
  return prisma.commentReaction.create({
    data: {
      commentId,
      userId,
      emoji,
    },
  });
}

export async function deleteReaction(id: string) {
  return prisma.commentReaction.delete({
    where: { id },
  });
}

export async function getReactionsByComment(commentId: string) {
  return prisma.commentReaction.findMany({
    where: { commentId },
    select: { id: true, emoji: true, userId: true },
  });
}
