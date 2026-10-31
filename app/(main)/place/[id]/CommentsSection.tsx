//Users/apple/Documents/GitHub/testmateng1/app/(main)/place/[id]/CommentsSection.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "../PlaceDetail.module.css";
import { useRouter } from "next/navigation";

// ---------------------
// Types
// ---------------------
interface Comment {
  id: string;
  place_id?: string;
  parent_id?: string | null;
  content: string;
  media_url?: string;
  author?: string;
  customer_id?: string;
  created_at: string;
  replies?: Comment[];
}

// ---------------------
// Build Threaded Comments
// ---------------------
function buildThreadedComments(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment & { replies?: Comment[] }>();
  const roots: Comment[] = [];

  comments.forEach((comment) => {
    map.set(comment.id, { ...comment, replies: [] });
  });

  map.forEach((comment) => {
    if (comment.parent_id && map.has(comment.parent_id)) {
      map.get(comment.parent_id)!.replies!.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

// ---------------------
// Helper to get root parent id
// ---------------------
function getRootParentId(comment: Comment, map: Map<string, Comment>): string {
  let current = comment;
  while (current.parent_id && map.has(current.parent_id)) {
    current = map.get(current.parent_id)!;
  }
  return current.id;
}

// ---------------------
// Single Comment Component
// ---------------------
function CommentItem({
  comment,
  canDelete,
  onDelete,
  onReply,
  replyingTo,
  setReplyingTo,
  allCommentsMap,
  customerId,
}: {
  comment: Comment;
  canDelete: boolean;
  onDelete: (id: string) => void;
  onReply: (parentComment: Comment, replyContent: string) => Promise<void>;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  allCommentsMap: Map<string, Comment>;
  customerId: string | null;
}) {
  let mediaUrls: string[] = [];

  if (comment.media_url) {
    try {
      mediaUrls = JSON.parse(comment.media_url);
    } catch {
      mediaUrls = [comment.media_url];
    }
  }

  const [replyContent, setReplyContent] = useState("");

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim()) {
      await onReply(comment, replyContent.trim());
      setReplyContent("");
      setReplyingTo(null);
    }
  };

  return (
    <div className={styles.commentContainer} style={{ marginLeft: comment.parent_id ? 20 : 0 }}>
      <div
        className={styles.commentHeader}
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <div>
          <span>{comment.author || "Anonymous"}</span> -{" "}
          <span>{new Date(comment.created_at).toLocaleString()}</span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="text-blue-600 hover:text-blue-400 font-semibold"
            style={{ cursor: "pointer", background: "transparent", border: "none" }}
          >
            Reply
          </button>

          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-red-600 hover:text-red-400 font-bold"
              title="Delete Comment"
              style={{ cursor: "pointer", border: "none", background: "transparent" }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <p className={styles.commentText}>{comment.content}</p>

      {mediaUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {mediaUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt="Comment Media"
              className={styles.commentMediaSmall}
              onClick={() => window.open(url, "_blank")}
              style={{
                cursor: "pointer",
                maxWidth: "100px",
                maxHeight: "100px",
                borderRadius: "4px",
              }}
            />
          ))}
        </div>
      )}

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <form onSubmit={handleReplySubmit} className="mt-2">
          <textarea
            className="w-full p-2 rounded bg-gray-800 text-white mb-2"
            placeholder="Write your reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={3}
            required
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded"
          >
            Post Reply
          </button>
          <button
            type="button"
            className="ml-2 px-3 py-1 rounded border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400"
            onClick={() => setReplyingTo(null)}
          >
            Cancel
          </button>
        </form>
      )}

      {/* Render Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.commentThread}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              canDelete={reply.customer_id === customerId}
              onDelete={onDelete}
              onReply={onReply}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              allCommentsMap={allCommentsMap}
              customerId={customerId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------
// CommentsSection Component
// ---------------------
export function CommentsSection({ placeId }: { placeId: string }) {
  const router = useRouter();

  const [comments, setComments] = useState<Comment[]>([]);
  const [threadedComments, setThreadedComments] = useState<Comment[]>([]);

  const [newComment, setNewComment] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [userName, setUserName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [showMyComments, setShowMyComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // ---------------------
  // Fetch Comments
  // ---------------------
  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setComments(data);
      setThreadedComments(buildThreadedComments(data));
    }
  };

  useEffect(() => {
    fetchComments();
  }, [placeId]);

  // ---------------------
  // Fetch User Info (if logged in)
  // ---------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedCustomerId = localStorage.getItem("customer_id");

    if (token && storedCustomerId) {
      setIsLoggedIn(true);
      setCustomerId(storedCustomerId);

      fetch(`/api/user/getUser?customer_id=${storedCustomerId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.name) {
            setUserName(data.data.name);
          } else {
            setUserName("User");
          }
        })
        .catch(() => {
          setUserName("User");
        });
    }
  }, []);

  // ---------------------
  // Handle Submit New Comment (top-level)
  // ---------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;

    setLoading(true);
    let media_urls: string[] = [];

    try {
      for (const file of mediaFiles) {
        const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
        const { error } = await supabase.storage.from("comment_media").upload(fileName, file);

        if (!error) {
          const publicUrl = supabase.storage.from("comment_media").getPublicUrl(fileName).data.publicUrl;
          if (publicUrl) media_urls.push(publicUrl);
        }
      }

      const { error: insertError } = await supabase.from("comments").insert([
        {
          place_id: placeId,
          author: userName,
          content: newComment,
          media_url: media_urls.length > 0 ? JSON.stringify(media_urls) : null,
          parent_id: null,
          customer_id: customerId,
        },
      ]);

      if (!insertError) {
        setNewComment("");
        setMediaFiles([]);
        setSuccessMessage("Comment posted!");
        await fetchComments();
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
    }

    setLoading(false);
  };

  // ---------------------
  // Handle Reply Submission
  // ---------------------
  const handleReply = async (parentComment: Comment, replyContent: string) => {
    if (!isLoggedIn) return;

    setLoading(true);

    try {
      // Create map for lookup
      const map = new Map(comments.map((c) => [c.id, c]));
      // Get the root parent id for the reply
      const rootParentId = getRootParentId(parentComment, map);

      const { error } = await supabase.from("comments").insert([
        {
          place_id: placeId,
          author: userName,
          content: replyContent,
          media_url: null,
          parent_id: rootParentId,
          customer_id: customerId,
        },
      ]);

      if (!error) {
        setSuccessMessage("Reply posted!");
        await fetchComments();
      }
    } catch (err) {
      console.error("Error submitting reply:", err);
    }

    setLoading(false);
  };

  // ---------------------
  // Handle Delete Comment
  // ---------------------
  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("customer_id", customerId);

      if (!error) {
        setSuccessMessage("Comment deleted!");
        await fetchComments();
      } else {
        alert("Failed to delete comment.");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("An error occurred.");
    }
  };

  // ---------------------
  // Filter Comments for "My Comments"
  // ---------------------
  const filteredComments = showMyComments && customerId
    ? comments.filter((comment) => comment.customer_id === customerId)
    : comments;

  const displayedThreadedComments = buildThreadedComments(filteredComments);

  // ---------------------
  // Render
  // ---------------------
  return (
    <div className={styles.rightPane}>
      <h2 className="text-xl font-semibold mb-4">Comments</h2>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-600 rounded text-white flex justify-between items-center">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-4 font-bold hover:text-green-300"
          >
            ×
          </button>
        </div>
      )}

      {isLoggedIn && (
        <div className="mb-4">
          <button
            onClick={() => setShowMyComments(!showMyComments)}
            className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600"
          >
            {showMyComments ? "Show All Comments" : "Show My Comments"}
          </button>
        </div>
      )}

      {/* ---- Comment Form ---- */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className={styles.commentForm}>
          <input
            type="text"
            value={userName || ""}
            readOnly
            className="w-full p-2 rounded bg-gray-700 text-white mb-2"
            placeholder="Your name"
          />

          <textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
            className="w-full p-2 rounded bg-gray-800 text-white mb-2"
            rows={4}
          />

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setMediaFiles(e.target.files ? Array.from(e.target.files) : [])}
            className="text-gray-400 mb-4"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
          >
            {loading ? "Posting..." : "Post Comment"}
          </button>
        </form>
      ) : (
        <p className="text-gray-400 italic mb-4">
          You must{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-blue-500 underline"
          >
            login
          </button>{" "}
          to post a comment.
        </p>
      )}

      {/* ---- Comment List ---- */}
      <div className={styles.commentList}>
        {displayedThreadedComments.length === 0 ? (
          <p className="text-gray-400 italic">No comments yet.</p>
        ) : (
          displayedThreadedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              canDelete={comment.customer_id === customerId}
              onDelete={handleDelete}
              onReply={handleReply}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              allCommentsMap={new Map(comments.map((c) => [c.id, c]))}
              customerId={customerId}
            />
          ))
        )}
      </div>
    </div>
  );
}
