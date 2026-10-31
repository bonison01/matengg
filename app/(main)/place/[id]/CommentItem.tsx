
//Users/apple/Documents/GitHub/testmateng1/app/(main)/place/[id]/CommentItem.tsx
import React from "react";

interface Comment {
  id: string;
  author?: string;
  content: string;
  created_at: string;
  replies?: Comment[];
  customer_id?: string;
  media_url?: string;
}

interface Props {
  comment: Comment;
  currentUserId: string | null;
  onReply: (commentId: string) => void;
  onDelete: (commentId: string) => void;
}

export function CommentItem({ comment, currentUserId, onReply, onDelete }: Props) {
  return (
    <div className="mb-4 ml-4 border-l border-gray-700 pl-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-blue-300">
          {comment.author || "Anonymous"}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(comment.created_at).toLocaleString()}
        </span>
      </div>

      <p className="text-sm text-white mb-2">{comment.content}</p>

      {comment.media_url && (
        <div className="mt-2">
          <img
            src={comment.media_url}
            alt="Attached media"
            className="max-w-xs rounded-md"
          />
        </div>
      )}

      <div className="flex gap-4 text-sm text-blue-400 mt-2">
        {currentUserId && (
          <button onClick={() => onReply(comment.id)} className="hover:underline">
            Reply
          </button>
        )}
        {currentUserId === comment.customer_id && (
          <button onClick={() => onDelete(comment.id)} className="text-red-400 hover:underline">
            Delete
          </button>
        )}
      </div>

      {/* Render Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
