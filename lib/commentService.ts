// lib/commentService.ts — เรียกใช้ก่อน save ลงฐานข้อมูล
import { prisma } from './prisma';
import { cleanRichText } from './sanitize';
import { ForbiddenError, NotFoundError, ValidationError } from './errors';
import { commentSchema, commentUpdateSchema, reactionSchema } from './schemas';
import { ZodError } from 'zod';

// ── POST: สร้าง Comment ใหม่ ──────────────────────────────────────────────────
// L3: sanitizeHtml() ทุกครั้งก่อนบันทึก
// L4: Zod validate ก่อน + authorId มาจาก session เท่านั้น
export async function createComment(raw: unknown, authorId: string) {
  let data: { postId: string; text: string };
  try {
    data = commentSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) throw new ValidationError(err.issues[0].message);
    throw err;
  }

  const safeText = cleanRichText(data.text); // L3: ตัด <script>, onerror= ทิ้งก่อนเก็บ

  return prisma.comment.create({
    data: { postId: data.postId, text: safeText, authorId },
  });
}

// ── GET: ดึง Comments ทั้งหมดของ post พร้อม reactions ─────────────────────────
export async function getCommentsByPost(postId: string) {
  return prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, email: true } },
      reactions: { select: { id: true, emoji: true, userId: true } },
    },
  });
}

// ── POST: กด / สลับ (Toggle) Reaction ให้กับ Comment ──────────────────────────
export async function toggleCommentReaction(commentId: string, raw: unknown, userId: string) {
  let data: { emoji: string };
  try {
    data = reactionSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) throw new ValidationError(err.issues[0].message);
    throw err;
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new NotFoundError(`ไม่พบ comment รหัส ${commentId}`);

  const existing = await prisma.commentReaction.findUnique({
    where: {
      commentId_userId_emoji: {
        commentId,
        userId,
        emoji: data.emoji,
      },
    },
  });

  if (existing) {
    await prisma.commentReaction.delete({
      where: { id: existing.id },
    });
    return { action: 'removed', emoji: data.emoji };
  } else {
    await prisma.commentReaction.create({
      data: {
        commentId,
        userId,
        emoji: data.emoji,
      },
    });
    return { action: 'added', emoji: data.emoji };
  }
}

// ── PATCH: แก้ไข Comment (เจ้าของเท่านั้น) ────────────────────────────────────
// L4: ตรวจ authorId === sessionUserId ก่อนอนุญาต — คนอื่นได้ 403
export async function editComment(id: string, raw: unknown, sessionUserId: string) {
  // ตรวจว่า comment มีอยู่จริง
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new NotFoundError(`ไม่พบ comment รหัส ${id}`);

  // L4: Authorization — เฉพาะเจ้าของเท่านั้น
  if (comment.authorId !== sessionUserId) {
    throw new ForbiddenError('คุณไม่มีสิทธิ์แก้ไข comment นี้');
  }

  // L4: Zod validate
  let data: { text: string };
  try {
    data = commentUpdateSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) throw new ValidationError(err.issues[0].message);
    throw err;
  }

  const safeText = cleanRichText(data.text); // L3: sanitize ก่อนบันทึกเสมอ

  return prisma.comment.update({
    where: { id },
    data: { text: safeText },
  });
}

// ── DELETE: ลบ Comment (เจ้าของเท่านั้น) ──────────────────────────────────────
// L4: ตรวจ authorId === sessionUserId ก่อนอนุญาต — คนอื่นได้ 403
export async function deleteComment(id: string, sessionUserId: string) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new NotFoundError(`ไม่พบ comment รหัส ${id}`);

  // L4: Authorization — เฉพาะเจ้าของเท่านั้น
  if (comment.authorId !== sessionUserId) {
    throw new ForbiddenError('คุณไม่มีสิทธิ์ลบ comment นี้');
  }

  await prisma.comment.delete({ where: { id } });
  return true;
}
