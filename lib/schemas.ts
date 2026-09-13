// lib/schemas.ts
import { z } from 'zod';

export const messageSchema = z.object({
  name: z.string().min(2, 'ชื่อสั้นเกินไป').max(100),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  message: z.string().min(5, 'ข้อความสั้นเกินไป').max(1000),
});

// L4: Zod schema สำหรับ Change Password — บังคับ newPassword อย่างน้อย 8 ตัวอักษร
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านเดิม'),
  newPassword: z
    .string()
    .min(8, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร')
    .max(128, 'รหัสผ่านยาวเกินไป'),
});

// L4: Zod schema สำหรับ Comment
export const commentSchema = z.object({
  postId: z.string().min(1, 'กรุณาระบุ postId'),
  text: z.string().min(1, 'ข้อความห้ามว่าง').max(2000, 'ข้อความยาวเกินไป'),
});

export const commentUpdateSchema = z.object({
  text: z.string().min(1, 'ข้อความห้ามว่าง').max(2000, 'ข้อความยาวเกินไป'),
});

// L4: Zod schema สำหรับ Comment Reaction (เช่น 👍, ❤️, 😂, 🎉, 🚀)
export const reactionSchema = z.object({
  emoji: z.string().min(1, 'กรุณาระบุอีโมจิ').max(10, 'อีโมจิยาวเกินไป'),
});
