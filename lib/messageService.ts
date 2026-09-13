import * as MessageModel from './messages';
import { NotFoundError, ValidationError, ForbiddenError } from './errors';
import { Prisma } from '@prisma/client';
import { messageSchema } from './schemas';
import { ZodError } from 'zod';

export async function createMessage(raw: unknown) {
  let data;
  try {
    data = messageSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) throw new ValidationError(err.issues[0].message);
    throw err;
  }
  return MessageModel.addMessage(data);
}


export async function getMessageById(id: string) {
  if (!id) {
    throw new ValidationError('กรุณาระบุ ID');
  }
  const message = await MessageModel.getMessageById(id);
  if (!message) {
    throw new NotFoundError(`ไม่พบข้อความรหัส ${id}`);
  }
  return message;
}

export async function editMessage(id: string, updates: unknown, sessionUserId: string) {
  const message = await getMessageById(id); // throw NotFoundError ถ้าไม่พบ (มีอยู่แล้วจาก Week 9)
  const authorId = (message as any).authorId;
  if (authorId && authorId !== sessionUserId) {
    throw new ForbiddenError('คุณไม่มีสิทธิ์แก้ไขข้อความนี้');
  }
  // validate ด้วย Zod แล้วค่อย update
  const parsed = messageSchema.partial().parse(updates);
  return MessageModel.updateMessage(id, parsed);
}

export async function removeMessage(id: string) {
  if (!id) {
    throw new ValidationError('กรุณาระบุ ID');
  }
  try {
    await MessageModel.deleteMessage(id);
    return true;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      throw new NotFoundError(`ไม่พบข้อความรหัส ${id}`);
    }
    throw err;
  }
}
// lib/messageService.ts
export async function listMessages(search?: string) {
  const all = await MessageModel.getMessages();
  if (!search) return all;
  return all.filter((m) =>
    m.name.includes(search) ||
    m.message.includes(search)
  );
}


