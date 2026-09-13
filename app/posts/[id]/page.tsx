// app/posts/[id]/page.tsx — Dynamic Metadata พร้อม TypeScript
import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import CommentSection from "@/components/CommentSection";

interface Post {
  id: number;
  title: string;
  body: string;
}

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params;
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`,
  );
  const post = await res.json();
  return {
    title: post.title,
    description: (post.body ?? "").slice(0, 160),
  };
}

// ✨ TypeScript: params มีtype { id: string }
export default async function PostDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    return (
      <main className="p-12">
        <h1 className="text-red-500">ไม่พบบทความ #{id}</h1>
      </main>
    );
  }
  const post: Post = await res.json();
  return (
    <main className="p-12 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/posts"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition"
        >
          ← ย้อนกลับไปบทความทั้งหมด
        </Link>
      </div>

      <p className="text-gray-400 text-sm mb-2">บทความ #{id}</p>
      <h1 className="text-3xl font-bold text-blue-900 mb-4">{post.title}</h1>
      <p className="text-gray-700 leading-relaxed">{post.body}</p>

      {/* ส่วนที่ 2: Comment Section (L3 Sanitize + L4 Authorization) */}
      <CommentSection postId={id} />
    </main>
  );
}

