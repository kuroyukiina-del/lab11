// app/api/comments/route.ts
import { cookies } from 'next/headers';
import { createComment, getCommentsByPost } from '@/lib/commentService';
import { withErrorHandling } from '@/lib/withErrorHandling';

export const dynamic = 'force-dynamic';

// GET /api/comments?postId=xxx
export const GET = withErrorHandling(async (request: Request) => {
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get('session')?.value ?? null;
  const postId = new URL(request.url).searchParams.get('postId') ?? '';
  const comments = await getCommentsByPost(postId);
  return Response.json({ comments, currentUserId });
});

// POST /api/comments
// L4: authorId อ่านจาก session cookie เท่านั้น — ไม่รับจาก body
export const POST = withErrorHandling(async (request: Request) => {
  const cookieStore = await cookies();
  const authorId = cookieStore.get('session')?.value;

  if (!authorId) {
    return Response.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  }

  const body = await request.json();
  const comment = await createComment(body, authorId);
  return Response.json({ ok: true, item: comment }, { status: 201 });
});
