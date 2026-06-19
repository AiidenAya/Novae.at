"use client";

import { useState } from "react";
import { Card, SectionTitle, Avatar, viewAllStyle } from "../_shared";
import type { Profile, CommentData } from "../_mock-data";

type Friend = Profile["featuredFriends"][number];

const FRIEND_SIZE = 120;

function Comment({ comment }: { comment: CommentData }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)" }}>
      <div style={{ display: "flex", gap: "var(--novae-space-md)", alignItems: "flex-start" }}>
        <Avatar src={comment.avatar} size={40} name={comment.username} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--novae-space-xs)" }}>
          <div style={{ display: "flex", gap: "var(--novae-space-sm)", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)" }}>{comment.username}</span>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{comment.date}</span>
          </div>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500, color: "var(--novae-text-primary)", lineHeight: "18px", margin: 0 }}>
            {comment.text}
          </p>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)", textAlign: "left", padding: 0 }}>
            Reply
          </button>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginLeft: 52, display: "flex", flexDirection: "column", gap: "var(--novae-space-lg)" }}>
          {comment.replies.map((reply) => (
            <div key={reply.id} style={{ backgroundColor: "rgba(105,61,169,0.08)", borderRadius: "var(--novae-radius-md)", padding: "var(--novae-space-lg)" }}>
              <Comment comment={reply} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SocialTab({
  profile, featuredFriends, isEditing, onRemoveFriend, onAddFriend,
}: {
  profile: Profile;
  featuredFriends: Friend[];
  isEditing: boolean;
  onRemoveFriend: (i: number) => void;
  onAddFriend: (f: Friend) => void;
}) {
  const [commentText, setCommentText] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [newFriendName, setNewFriendName] = useState("");

  function submitFriend() {
    const name = newFriendName.trim();
    if (!name) return;
    onAddFriend({ username: name, avatar: null });
    setNewFriendName("");
    setAddingFriend(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-lg)" }}>
      <Card>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <SectionTitle>Featured Friends</SectionTitle>
          {!isEditing && <button style={viewAllStyle}>View all</button>}
        </div>

        {/* 8-per-row grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 12 }}>
          {featuredFriends.map((friend, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)", alignItems: "center", position: "relative" }}>
              <div style={{ width: FRIEND_SIZE, height: FRIEND_SIZE, borderRadius: "var(--novae-radius-md)", backgroundColor: "rgba(105,61,169,0.1)", backgroundImage: "repeating-conic-gradient(rgba(136,136,136,0.15) 0% 25%, transparent 0% 50%)", backgroundSize: "12px 12px", overflow: "hidden" }}>
                {friend.avatar && <img src={friend.avatar} alt={friend.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 500, color: "var(--novae-text-primary)", textAlign: "center" }}>{friend.username}</span>
              {isEditing && (
                <button
                  onClick={() => onRemoveFriend(i)}
                  style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "var(--novae-btn-primary)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, lineHeight: 1, zIndex: 2 }}
                >×</button>
              )}
            </div>
          ))}

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

        {!isEditing && (
          <button style={{ alignSelf: "center", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 24px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
            View more ›
          </button>
        )}
      </Card>

      <Card>
        <SectionTitle>Comments</SectionTitle>
        <div style={{ border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", overflow: "hidden" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 12px", borderBottom: "1px solid var(--novae-outline-all)", backgroundColor: "rgba(25,32,46,0.5)" }}>
            {["B", "I", "U", "S"].map((f) => (
              <button key={f} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: 13, width: 28, height: 28, borderRadius: 4 }}>{f}</button>
            ))}
          </div>
          <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." rows={3}
            style={{ width: "100%", background: "transparent", border: "none", outline: "none", padding: "12px 16px", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", resize: "vertical", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button style={{ backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-btn)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "10px 24px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500 }}>Post</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-3xl)" }}>
          {profile.comments.map((comment) => <Comment key={comment.id} comment={comment} />)}
        </div>
        <button style={{ alignSelf: "center", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 24px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
          View more ›
        </button>
      </Card>
    </div>
  );
}
