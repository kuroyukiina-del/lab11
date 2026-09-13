"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CommentItem {
  id: string;
  postId: string;
  text: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    email: string;
  };
  reactions?: {
    id: string;
    emoji: string;
    userId: string;
  }[];
}

const AVAILABLE_EMOJIS = ["👍", "❤️", "😂", "🎉", "🚀"];

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // สำหรับโหมดแก้ไข
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reactionLoading, setReactionLoading] = useState<string | null>(null);

  // โหลดความคิดเห็น
  async function loadComments() {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.comments)) {
        setComments(data.comments);
        if (data.currentUserId) {
          setCurrentUserId(data.currentUserId);
        }
      }
    } catch {
      setError("ไม่สามารถโหลดความคิดเห็นได้");
    } finally {
      setLoading(false);
    }
  }

  // กดแสดงความรู้สึก (Toggle Reaction)
  async function handleToggleReaction(commentId: string, emoji: string) {
    const loadingKey = `${commentId}-${emoji}`;
    setReactionLoading(loadingKey);
    setError(null);

    try {
      const res = await fetch(`/api/comments/${commentId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("กรุณาเข้าสู่ระบบก่อนกดแสดงความรู้สึก");
        }
        throw new Error(data.error || "ไม่สามารถแสดงความรู้สึกได้");
      }

      await loadComments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReactionLoading(null);
    }
  }

  useEffect(() => {
    loadComments();
  }, [postId]);

  // ส่งความคิดเห็นใหม่ (POST)
  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, text: newText }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น");
        }
        throw new Error(data.error || "ไม่สามารถเพิ่มความคิดเห็นได้");
      }

      setNewText("");
      setSuccess("แสดงความคิดเห็นสำเร็จ (ผ่าน L3 Sanitize & L4 Validation เรียบร้อยแล้ว)");
      await loadComments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // แก้ไขความคิดเห็น (PATCH) — ตรวจสอบ L4 Authorization
  async function handleUpdateComment(commentId: string) {
    if (!editText.trim()) return;

    setActionLoading(commentId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("⛔ 403 Forbidden: คุณไม่มีสิทธิ์แก้ไขความคิดเห็นของผู้อื่น (Ownership Protected)");
        }
        throw new Error(data.error || "ไม่สามารถแก้ไขความคิดเห็นได้");
      }

      setEditingId(null);
      setSuccess("แก้ไขความคิดเห็นสำเร็จ!");
      await loadComments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  // ลบความคิดเห็น (DELETE) — ตรวจสอบ L4 Authorization
  async function handleDeleteComment(commentId: string) {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบความคิดเห็นนี้?")) return;

    setActionLoading(commentId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("⛔ 403 Forbidden: คุณไม่มีสิทธิ์ลบความคิดเห็นของผู้อื่น (Ownership Protected)");
        }
        throw new Error(data.error || "ไม่สามารถลบความคิดเห็นได้");
      }

      setSuccess("ลบความคิดเห็นสำเร็จ!");
      await loadComments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <section className="mt-12 border-t border-gray-200 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          ความคิดเห็น ({comments.length})
        </h2>
        <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-1 rounded-full">
          L3 XSS Sanitize + L4 Ownership
        </span>
      </div>

      {/* กล่องแจ้งเตือน */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-start justify-between">
          <span>{error}</span>
          {error.includes("เข้าสู่ระบบ") && (
            <Link
              href="/login"
              className="ml-3 font-semibold text-blue-600 underline hover:text-blue-800 shrink-0"
            >
              ไปหน้า Login →
            </Link>
          )}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          {success}
        </div>
      )}

      {/* ฟอร์มเพิ่มความคิดเห็นใหม่ */}
      <form onSubmit={handleAddComment} className="mb-8">
        <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <label htmlFor="commentText" className="block text-sm font-medium text-gray-700 mb-2">
            เขียนความคิดเห็น (รองรับแท็ก <b>&lt;b&gt;</b>, <i>&lt;i&gt;</i>, &lt;a&gt;)
          </label>
          <textarea
            id="commentText"
            rows={3}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="พิมพ์ความคิดเห็นของคุณที่นี่... (ระบบจะตัด <script> อัตโนมัติด้วย sanitize-html)"
            className="w-full resize-none border-0 p-0 text-sm text-gray-900 focus:ring-0 focus:outline-none"
            required
          />
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-xs text-gray-400">
              * ต้อง Login ก่อนแสดงความคิดเห็น
            </span>
            <button
              type="submit"
              disabled={submitting || !newText.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {submitting ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
            </button>
          </div>
        </div>
      </form>

      {/* รายการความคิดเห็น */}
      {loading ? (
        <p className="text-center text-sm text-gray-500 py-6">กำลังโหลดความคิดเห็น...</p>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
          ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็นได้เลย!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs">
                    {(comment.author?.email || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">
                      {comment.author?.email || "ผู้ใช้งาน"}
                    </span>
                    <span className="block text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleString("th-TH")}
                    </span>
                  </div>
                </div>

                {/* ปุ่มจัดการความคิดเห็น */}
                <div className="flex items-center space-x-2">
                  {editingId !== comment.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditText(comment.text);
                          setError(null);
                          setSuccess(null);
                        }}
                        disabled={actionLoading === comment.id}
                        className="rounded px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={actionLoading === comment.id}
                        className="rounded px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {actionLoading === comment.id ? "กำลังลบ..." : "ลบ"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </div>

              {/* เนื้อหาความคิดเห็น (รองรับโหมดแก้ไข) */}
              {editingId === comment.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={2}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateComment(comment.id)}
                      disabled={actionLoading === comment.id || !editText.trim()}
                      className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {actionLoading === comment.id ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="mt-2 text-sm text-gray-800 leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: comment.text }}
                />
              )}

              {/* แถบ Reaction แสดงความรู้สึก (Emoji) */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-gray-400 mr-1">ความรู้สึก:</span>
                {AVAILABLE_EMOJIS.map((emoji) => {
                  const reactionsForEmoji = (comment.reactions || []).filter(
                    (r) => r.emoji === emoji
                  );
                  const count = reactionsForEmoji.length;
                  const isReacted = currentUserId
                    ? reactionsForEmoji.some((r) => r.userId === currentUserId)
                    : false;
                  const isLoading = reactionLoading === `${comment.id}-${emoji}`;

                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleToggleReaction(comment.id, emoji)}
                      disabled={isLoading}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${isReacted
                          ? "bg-blue-50 border-blue-400 text-blue-700 shadow-sm scale-105"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300"
                        } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
                      title={
                        isReacted
                          ? `คลิกเพื่อยกเลิก ${emoji}`
                          : `คลิกเพื่อส่ง ${emoji}`
                      }
                    >
                      <span className="text-sm">{emoji}</span>
                      {count > 0 && (
                        <span
                          className={`font-semibold ${isReacted ? "text-blue-700" : "text-gray-600"
                            }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
