// app/api/comments/[id]/reactions/route.ts
import { cookies } from 'next/headers';
import { toggleCommentReaction } from '@/lib/commentService';
import { withErrorHandling } from '@/lib/withErrorHandling';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/comments/:id/reactions
// L4: อ่าน sessionUserId จาก cookie — บังคับล็อกอินก่อนแสดงความรู้สึก
export const POST = withErrorHandling(async (request: Request, { params }: RouteContext) => {
  const { id } = await params;

  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get('session')?.value;

  if (!sessionUserId) {
    return Response.json({ error: 'กรุณาเข้าสู่ระบบก่อนกดแสดงความรู้สึก' }, { status: 401 });
  }

  const body = await request.json();
  const result = await toggleCommentReaction(id, body, sessionUserId);
  return Response.json({ ok: true, ...result });
});
