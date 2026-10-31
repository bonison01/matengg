"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "../PlaceDetail.module.css";

interface Comment {
  id: string;
  place_id?: string;
  parent_id?: string | null;
  content: string;
  media_url?: string;
  author?: string;
  created_at: string;
}

interface CommentsSectionProps {
  placeId: string;
}

function buildThreadedComments(comments: Comment[]): (Comment & { replies?: Comment[] })[] {
  const map = new Map<string, Comment & { replies?: Comment[] }>();
  const roots: (Comment & { replies?: Comment[] })[] = [];

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

interface CommentItemProps {
  comment: Comment & { replies?: Comment[] };
}

function CommentItem({ comment }: CommentItemProps) {
  let mediaUrls: string[] = [];
  if (comment.media_url) {
    try {
      mediaUrls = JSON.parse(comment.media_url);
    } catch {
      mediaUrls = [comment.media_url];
    }
  }

  return (
    <div className={styles.commentContainer}>
      <div className={styles.commentHeader}>
        <span>{comment.author || "Anonymous"}</span>
        <span>{new Date(comment.created_at).toLocaleString()}</span>
      </div>

      <p className={styles.commentText}>{comment.content}</p>

      {mediaUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mediaUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt="Comment Media"
              className={styles.commentMediaSmall}
              onClick={() => window.open(url, "_blank")}
              style={{ cursor: "pointer", maxWidth: "100px", maxHeight: "100px", borderRadius: "4px" }}
            />
          ))}
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.commentThread}>
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentsSection({ placeId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [threadedComments, setThreadedComments] = useState<(Comment & { replies?: Comment[] })[]>([]);
  const [newComment, setNewComment] = useState("");
  const [author, setAuthor] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      const { data: commentData } = await supabase
        .from("comments")
        .select("*")
        .eq("place_id", placeId)
        .order("created_at", { ascending: true });

      setComments(commentData || []);
    };

    fetchComments();
  }, [placeId]);

  useEffect(() => {
    setThreadedComments(buildThreadedComments(comments));
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);

    let media_urls: string[] = [];

    try {
      for (const file of mediaFiles) {
        const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;

        const { error: storageError } = await supabase.storage
          .from("comment_media")
          .upload(fileName, file);

        if (storageError) {
          console.error("Media upload error:", storageError.message);
          setLoading(false);
          return;
        }

        const publicUrl = supabase.storage
          .from("comment_media")
          .getPublicUrl(fileName).data.publicUrl;

        if (publicUrl) media_urls.push(publicUrl);
      }

      const { error: insertError } = await supabase.from("comments").insert([
        {
          place_id: placeId,
          author,
          content: newComment,
          media_url: media_urls.length > 0 ? JSON.stringify(media_urls) : null,
          parent_id: null,
        },
      ]);

      if (insertError) {
        console.error("Comment submission error:", insertError.message);
      } else {
        setNewComment("");
        setAuthor("");
        setMediaFiles([]);
        setSuccessMessage("Comment posted successfully!");

        const { data: updatedComments } = await supabase
          .from("comments")
          .select("*")
          .eq("place_id", placeId)
          .order("created_at", { ascending: true });

        setComments(updatedComments || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }

    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Comments</h2>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-600 rounded text-white flex justify-between items-center">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-4 font-bold hover:text-green-300"
            aria-label="Close success message"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.commentForm}>
        <input
          type="text"
          placeholder="Your name (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white mb-2"
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
          onChange={(e) => {
            if (e.target.files) {
              setMediaFiles(Array.from(e.target.files));
            } else {
              setMediaFiles([]);
            }
          }}
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

      <div className={styles.commentList}>
        {threadedComments.length === 0 ? (
          <p className="text-gray-400 italic">No comments yet.</p>
        ) : (
          threadedComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}
