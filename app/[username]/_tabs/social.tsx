"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, SectionTitle, Avatar, viewAllStyle } from "../_shared";
import type { Profile } from "../_mock-data";

type Friend = Profile["featuredFriends"][number];

type DbComment = {
  id: string;
  text: string;
  createdAt: string;
  author: { username: string | null; avatar: string | null };
  replies?: DbComment[];
};

const FRIEND_SIZE = 120;

function ReplyEditor({ onPost, onCancel }: { onPost: (html: string) => void; onCancel: () => void }) {
  const editorRef = useRef<HTMLDivElement>(null);

  function applyFormat(cmd: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false);
  }

  function submit() {
    const html = editorRef.current?.innerHTML ?? "";
    const text = editorRef.current?.innerText?.trim() ?? "";
    if (!text) return;
    onPost(html);
    if (editorRef.current) editorRef.current.innerHTML = "";
  }

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 4, padding: "6px 10px", borderBottom: "1px solid var(--novae-outline-all)", backgroundColor: "rgba(25,32,46,0.5)" }}>
          {FORMAT_BUTTONS.map(({ label, cmd, style }) => (
            <button key={label} onMouseDown={(e) => { e.preventDefault(); applyFormat(cmd); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: 13, width: 28, height: 28, borderRadius: 4, ...style }}>
              {label}
            </button>
          ))}
        </div>
        <div ref={editorRef} contentEditable suppressContentEditableWarning data-placeholder="Write a reply..."
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } }}
          style={{ minHeight: 60, padding: "10px 14px", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", outline: "none", lineHeight: "1.5" }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "6px 16px", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}>Cancel</button>
        <button onClick={submit} style={{ backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-btn)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "6px 16px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 500 }}>Post</button>
      </div>
    </div>
  );
}

function Comment({ comment, canDelete, onDelete, onReply }: { comment: DbComment; canDelete?: boolean; onDelete?: () => void; onReply?: (html: string) => void }) {
  const [replying, setReplying] = useState(false);
  const date = new Date(comment.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", " ·");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)" }}>
      <div style={{ display: "flex", gap: "var(--novae-space-md)", alignItems: "flex-start" }}>
        <Avatar src={comment.author.avatar} size={40} name={comment.author.username ?? "?"} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--novae-space-xs)" }}>
          <div style={{ display: "flex", gap: "var(--novae-space-sm)", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "var(--novae-space-sm)", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)" }}>{comment.author.username ?? "?"}</span>
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{date}</span>
            </div>
            {canDelete && (
              <button onClick={onDelete} title="Delete comment"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", padding: "2px 6px", borderRadius: "var(--novae-radius-sm)", lineHeight: 1, fontSize: 16 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500, color: "var(--novae-text-primary)", lineHeight: "18px", margin: 0 }}
            dangerouslySetInnerHTML={{ __html: comment.text }} />
          {onReply && (
            <button onClick={() => setReplying((v) => !v)}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)", textAlign: "left", padding: 0 }}>
              Reply
            </button>
          )}
          {replying && onReply && (
            <ReplyEditor onPost={(html) => { onReply(html); setReplying(false); }} onCancel={() => setReplying(false)} />
          )}
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginLeft: 52, display: "flex", flexDirection: "column", gap: "var(--novae-space-lg)" }}>
          {comment.replies.map((reply) => (
            <div key={reply.id} style={{ backgroundColor: "rgba(105,61,169,0.08)", borderRadius: "var(--novae-radius-md)", padding: "var(--novae-space-lg)" }}>
              <Comment comment={reply} canDelete={canDelete} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const FORMAT_BUTTONS = [
  { label: "B", cmd: "bold",          style: { fontWeight: 700 } },
  { label: "I", cmd: "italic",        style: { fontStyle: "italic" } },
  { label: "U", cmd: "underline",     style: { textDecoration: "underline" } },
  { label: "S", cmd: "strikeThrough", style: { textDecoration: "line-through" } },
];

export default function SocialTab({
  username, featuredFriends, isOwner, isEditing, onRemoveFriend, onAddFriend,
}: {
  username: string;
  featuredFriends: Friend[];
  isOwner: boolean;
  isEditing: boolean;
  onRemoveFriend: (i: number) => void;
  onAddFriend: (f: Friend) => void;
}) {
  const [comments, setComments] = useState<DbComment[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/profile/${username}/comments`);
    const data = await res.json();
    setComments(data.comments ?? []);
  }, [username]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  async function deleteComment(id: string) {
    await fetch(`/api/profile/${username}/comments/${id}`, { method: "DELETE" });
    fetchComments();
  }

  function applyFormat(cmd: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false);
  }

  async function postComment() {
    const html = editorRef.current?.innerHTML ?? "";
    const text = editorRef.current?.innerText?.trim() ?? "";
    if (!text) return;
    await fetch(`/api/profile/${username}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: html }),
    });
    if (editorRef.current) editorRef.current.innerHTML = "";
    fetchComments();
  }

  async function postReply(parentId: string, html: string) {
    await fetch(`/api/profile/${username}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: html, parentId }),
    });
    fetchComments();
  }
  const [addingFriend, setAddingFriend] = useState(false);
  const [newFriendName, setNewFriendName] = useState("");

  function submitFriend() {
    const name = newFriendName.trim();
    if (!name) return;
    onAddFriend({ username: name, avatar: null });
    setNewFriendName("");
    setAddingFriend(false);
  }

  const VISIBLE_LIMIT = 8;
  const [showAllFriends, setShowAllFriends] = useState(false);
  const visibleFriends = !isEditing && !showAllFriends
    ? featuredFriends.slice(0, VISIBLE_LIMIT)
    : featuredFriends;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-lg)" }}>
      <Card>
        <SectionTitle>Featured Friends</SectionTitle>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
          {visibleFriends.map((friend, i) => {
            const inner = (
              <>
                <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: "var(--novae-radius-md)", backgroundColor: "rgba(105,61,169,0.1)", backgroundImage: "repeating-conic-gradient(rgba(136,136,136,0.15) 0% 25%, transparent 0% 50%)", backgroundSize: "12px 12px", overflow: "hidden" }}>
                  {friend.avatar && <img src={friend.avatar} alt={friend.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 500, color: "var(--novae-text-primary)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{friend.username}</span>
              </>
            );
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)", alignItems: "center", position: "relative" }}>
                {isEditing ? inner : (
                  <a href={`/${friend.username}`} style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)", alignItems: "center", width: "100%", textDecoration: "none" }}>{inner}</a>
                )}
                {isEditing && (
                  <button
                    onClick={() => onRemoveFriend(i)}
                    style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "var(--novae-btn-primary)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, lineHeight: 1, zIndex: 2 }}
                  >×</button>
                )}
              </div>
            );
          })}

          {/* Add friend slot */}
          {isEditing && !addingFriend && (
            <button
              onClick={() => setAddingFriend(true)}
              style={{ width: FRIEND_SIZE, height: FRIEND_SIZE, borderRadius: "var(--novae-radius-md)", border: "1px dashed var(--novae-outline-all)", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}
            >
              <span style={{ fontSize: 20 }}>+</span>
              Add
            </button>
          )}
        </div>

        {/* Inline add-friend form */}
        {isEditing && addingFriend && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              autoFocus
              value={newFriendName}
              onChange={(e) => setNewFriendName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitFriend(); if (e.key === "Escape") setAddingFriend(false); }}
              placeholder="Username"
              style={{ flex: 1, background: "rgba(25,32,46,0.6)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", outline: "none", color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", padding: "8px 12px", fontSize: "var(--novae-text-base)" }}
            />
            <button onClick={submitFriend} style={{ backgroundColor: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "8px 16px", cursor: "pointer", color: "var(--novae-text-btn)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500 }}>Add</button>
            <button onClick={() => setAddingFriend(false)} style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 16px", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)" }}>Cancel</button>
          </div>
        )}

        {!isEditing && featuredFriends.length > VISIBLE_LIMIT && (
          <button
            onClick={() => setShowAllFriends((p) => !p)}
            style={{ alignSelf: "center", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 24px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}
          >
            {showAllFriends ? "Show less ›" : `View more (${featuredFriends.length - VISIBLE_LIMIT}) ›`}
          </button>
        )}
      </Card>

      <Card>
        <SectionTitle>Comments</SectionTitle>
        <div style={{ border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", overflow: "hidden" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 12px", borderBottom: "1px solid var(--novae-outline-all)", backgroundColor: "rgba(25,32,46,0.5)" }}>
            {FORMAT_BUTTONS.map(({ label, cmd, style }) => (
              <button
                key={label}
                onMouseDown={(e) => { e.preventDefault(); applyFormat(cmd); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: 13, width: 28, height: 28, borderRadius: 4, ...style }}
              >{label}</button>
            ))}
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Write a comment..."
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); postComment(); } }}
            style={{ minHeight: 80, padding: "12px 16px", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", outline: "none", lineHeight: "1.5" }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={postComment} style={{ backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-btn)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "10px 24px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500 }}>Post</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-3xl)" }}>
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              canDelete={isOwner}
              onDelete={() => deleteComment(comment.id)}
              onReply={(html) => postReply(comment.id, html)}
            />
          ))}
        </div>
        {comments.length > 3 && (
          <button style={{ alignSelf: "center", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 24px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
            View more ›
          </button>
        )}
      </Card>
    </div>
  );
}
