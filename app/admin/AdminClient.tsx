"use client";

import { useState, useTransition } from "react";
import { ROLE_ICONS, ROLE_ICON_KEYS, RoleIcon } from "@/lib/role-icons";

type RoleRecord = { id: string; name: string; description: string | null; icon: string | null; createdAt: string };

type RecentUser = {
  id: string; username: string | null; name: string | null;
  email: string; roles: string[]; createdAt: string; inviteCode: string | null;
};

type InviteCode = {
  id: string; code: string; note: string | null;
  createdAt: string; expiresAt: string | null; usedAt: string | null;
  usedBy: { username: string | null } | null;
};

const cell: React.CSSProperties = {
  padding: "14px 20px",
  fontFamily: "var(--font-dm-sans)",
  fontSize: "var(--novae-text-sm)",
  color: "var(--novae-text-primary)",
  borderBottom: "1px solid var(--novae-outline-all)",
};

const th: React.CSSProperties = {
  padding: "11px 20px",
  textAlign: "left",
  fontFamily: "var(--font-dm-sans)",
  fontSize: "var(--novae-text-xs)",
  color: "var(--novae-text-secondary)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  borderBottom: "1px solid var(--novae-outline-all)",
};

function RoleBadge({ role, icon }: { role: string; icon?: string | null }) {
  const isAdmin = role === "admin";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: "var(--novae-radius-sm)",
      fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 600,
      background: isAdmin ? "rgba(164,132,220,0.15)" : "rgba(136,136,136,0.1)",
      color: isAdmin ? "var(--novae-text-tag)" : "var(--novae-text-secondary)",
      border: `0.5px solid ${isAdmin ? "var(--novae-outline-tag)" : "var(--novae-outline-all)"}`,
    }}>
      <RoleIcon name={icon} size={11} color="currentColor" title={role} />
      {role}
    </span>
  );
}

function RolesBadges({ roles, iconMap }: { roles: string[]; iconMap: Record<string, string | null> }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {roles.map(r => <RoleBadge key={r} role={r} icon={iconMap[r]} />)}
    </div>
  );
}

// ── Icon picker ───────────────────────────────────────────────────────────────

function IconPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <button type="button" onClick={() => onChange(null)} title="Aucune"
        style={{
          width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "var(--novae-radius-md)", cursor: "pointer",
          background: value === null ? "rgba(164,132,220,0.15)" : "var(--novae-bg-card)",
          border: `1px solid ${value === null ? "var(--novae-outline-tag)" : "var(--novae-outline-all)"}`,
          color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)",
        }}>
        ✕
      </button>
      {ROLE_ICON_KEYS.map(key => (
        <button type="button" key={key} onClick={() => onChange(key)} title={ROLE_ICONS[key].label}
          style={{
            width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "var(--novae-radius-md)", cursor: "pointer",
            background: value === key ? "rgba(164,132,220,0.15)" : "var(--novae-bg-card)",
            border: `1px solid ${value === key ? "var(--novae-outline-tag)" : "var(--novae-outline-all)"}`,
          }}>
          <RoleIcon name={key} size={18} color="var(--novae-text-primary)" />
        </button>
      ))}
    </div>
  );
}

function codeStatus(code: InviteCode): "used" | "expired" | "available" {
  if (code.usedAt) return "used";
  if (code.expiresAt && new Date(code.expiresAt) < new Date()) return "expired";
  return "available";
}

function CodeStatusBadge({ code }: { code: InviteCode }) {
  const s = codeStatus(code);
  if (s === "used") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: "var(--novae-radius-sm)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 600, background: "rgba(136,136,136,0.1)", color: "var(--novae-text-secondary)", border: "0.5px solid var(--novae-outline-all)" }}>
      Utilisé{code.usedBy?.username ? ` par @${code.usedBy.username}` : ""}
    </span>
  );
  if (s === "expired") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: "var(--novae-radius-sm)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 600, background: "rgba(220,53,69,0.1)", color: "#ff6b7a", border: "0.5px solid rgba(220,53,69,0.3)" }}>
      Expiré
    </span>
  );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: "var(--novae-radius-sm)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 600, background: "rgba(72,199,142,0.12)", color: "#48c78e", border: "0.5px solid rgba(72,199,142,0.3)" }}>
      Disponible
    </span>
  );
}

type CodeFilter = "all" | "available" | "used" | "expired";

// ── Create role modal ─────────────────────────────────────────────────────────

function CreateRoleModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (role: RoleRecord) => void;
}) {
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon]               = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: "var(--novae-radius-md)",
    border: "1px solid var(--novae-outline-all)", background: "var(--novae-bg-card)",
    color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)",
    fontSize: "var(--novae-text-sm)", outline: "none", boxSizing: "border-box",
  };

  async function create() {
    if (!name.trim()) { setError("Le nom est requis"); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, icon }),
    });
    if (res.ok) {
      onCreated(await res.json());
      onClose();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Erreur");
    }
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--novae-bg-main)" }} onClick={onClose}>
      <div style={{ background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: 32, width: 420, display: "flex", flexDirection: "column", gap: 20 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>
          Créer un rôle
        </h2>
        {error && <p style={{ color: "#ff6b7a", fontSize: "var(--novae-text-sm)", margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Nom</span>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="ex: beta_tester" style={inputStyle}
              onKeyDown={e => { if (e.key === "Enter") create(); }} />
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
              Sera converti en minuscules sans espaces
            </span>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Description (optionnelle)</span>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="À quoi sert ce rôle ?" style={inputStyle} />
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Icône (affichée sur le profil)</span>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 20px", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}>Annuler</button>
          <button onClick={create} disabled={saving || !name.trim()} style={{ backgroundColor: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "8px 20px", cursor: "pointer", color: "var(--novae-text-btn)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, opacity: saving || !name.trim() ? 0.5 : 1 }}>
            {saving ? "…" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit role modal ───────────────────────────────────────────────────────────

function EditRoleModal({ role, onClose, onSaved }: {
  role: RoleRecord;
  onClose: () => void;
  onSaved: (role: RoleRecord) => void;
}) {
  const [description, setDescription] = useState(role.description ?? "");
  const [icon, setIcon]               = useState<string | null>(role.icon);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: "var(--novae-radius-md)",
    border: "1px solid var(--novae-outline-all)", background: "var(--novae-bg-card)",
    color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)",
    fontSize: "var(--novae-text-sm)", outline: "none", boxSizing: "border-box",
  };

  async function save() {
    setSaving(true); setError(null);
    const res = await fetch("/api/admin/roles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: role.id, description, icon }),
    });
    if (res.ok) {
      onSaved(await res.json());
      onClose();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Erreur");
    }
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div style={{ background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: 32, width: 420, display: "flex", flexDirection: "column", gap: 20 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>
          <RoleIcon name={icon} size={20} color="var(--novae-text-tag)" />
          Modifier « {role.name} »
        </h2>
        {error && <p style={{ color: "#ff6b7a", fontSize: "var(--novae-text-sm)", margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Description (optionnelle)</span>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="À quoi sert ce rôle ?" style={inputStyle} />
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Icône (affichée sur le profil)</span>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 20px", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}>Annuler</button>
          <button onClick={save} disabled={saving} style={{ backgroundColor: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "8px 20px", cursor: "pointer", color: "var(--novae-text-btn)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, opacity: saving ? 0.5 : 1 }}>
            {saving ? "…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit user modal ───────────────────────────────────────────────────────────

function EditUserModal({ user, availableRoles, onClose, onSaved }: {
  user: RecentUser;
  availableRoles: RoleRecord[];
  onClose: () => void;
  onSaved: (updated: RecentUser) => void;
}) {
  const [username, setUsername] = useState(user.username ?? "");
  const [name, setName]         = useState(user.name ?? "");
  const [roles, setRoles]       = useState<string[]>(user.roles);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  function toggleRole(r: string) {
    setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, name, roles }),
    });
    if (res.ok) {
      const updated = await res.json();
      onSaved({ ...user, ...updated });
      onClose();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Erreur");
    }
    setSaving(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: "var(--novae-radius-md)",
    border: "1px solid var(--novae-outline-all)", background: "var(--novae-bg-card)",
    color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)",
    fontSize: "var(--novae-text-sm)", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--novae-bg-main)" }} onClick={onClose}>
      <div style={{ background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: 32, width: 420, display: "flex", flexDirection: "column", gap: 20 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>
          Modifier l'utilisateur
        </h2>
        {error && <p style={{ color: "#ff6b7a", fontSize: "var(--novae-text-sm)", margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Username</span>
            <input value={username} onChange={e => setUsername(e.target.value.toLowerCase())} style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Nom d'affichage</span>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Rôles</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {availableRoles.map(r => (
                <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)" }}>
                  <input type="checkbox" checked={roles.includes(r.name)} onChange={() => toggleRole(r.name)} />
                  {r.name}
                  {r.description && <span style={{ color: "var(--novae-text-secondary)", fontSize: "var(--novae-text-xs)" }}>— {r.description}</span>}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 20px", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}>Annuler</button>
          <button onClick={save} disabled={saving} style={{ backgroundColor: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "8px 20px", cursor: "pointer", color: "var(--novae-text-btn)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
            {saving ? "…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bulk edit modal ───────────────────────────────────────────────────────────

function BulkEditModal({ userIds, availableRoles, onClose, onSaved }: {
  userIds: string[];
  availableRoles: RoleRecord[];
  onClose: () => void;
  onSaved: (ids: string[], addRoles: string[], removeRoles: string[]) => void;
}) {
  const [addRoles, setAddRoles]       = useState<string[]>([]);
  const [removeRoles, setRemoveRoles] = useState<string[]>([]);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  function toggleAdd(r: string) {
    setAddRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
    setRemoveRoles(prev => prev.filter(x => x !== r));
  }
  function toggleRemove(r: string) {
    setRemoveRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
    setAddRoles(prev => prev.filter(x => x !== r));
  }

  async function save() {
    if (addRoles.length === 0 && removeRoles.length === 0) { setError("Aucune modification sélectionnée"); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/admin/users/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: userIds, addRoles, removeRoles }),
    });
    if (res.ok) {
      onSaved(userIds, addRoles, removeRoles);
      onClose();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Erreur");
    }
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div style={{ background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: 32, width: 460, display: "flex", flexDirection: "column", gap: 20 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>
          Modifier {userIds.length} utilisateur{userIds.length > 1 ? "s" : ""}
        </h2>
        {error && <p style={{ color: "#ff6b7a", fontSize: "var(--novae-text-sm)", margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ajouter les rôles</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {availableRoles.map(r => (
                <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", padding: "4px 10px", borderRadius: "var(--novae-radius-sm)", border: `1px solid ${addRoles.includes(r.name) ? "var(--novae-outline-tag)" : "var(--novae-outline-all)"}`, background: addRoles.includes(r.name) ? "rgba(164,132,220,0.1)" : "transparent" }}>
                  <input type="checkbox" checked={addRoles.includes(r.name)} onChange={() => toggleAdd(r.name)} style={{ accentColor: "var(--novae-text-tag)" }} />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Retirer les rôles</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {availableRoles.map(r => (
                <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", padding: "4px 10px", borderRadius: "var(--novae-radius-sm)", border: `1px solid ${removeRoles.includes(r.name) ? "rgba(220,53,69,0.4)" : "var(--novae-outline-all)"}`, background: removeRoles.includes(r.name) ? "rgba(220,53,69,0.08)" : "transparent" }}>
                  <input type="checkbox" checked={removeRoles.includes(r.name)} onChange={() => toggleRemove(r.name)} style={{ accentColor: "#ff6b7a" }} />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 20px", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}>Annuler</button>
          <button onClick={save} disabled={saving} style={{ backgroundColor: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "8px 20px", cursor: "pointer", color: "var(--novae-text-btn)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
            {saving ? "…" : "Appliquer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminClient({ stats, recentUsers: initialUsers, initialCodes, initialRoles }: {
  stats: { totalUsers: number; totalCharacters: number; totalArtworks: number };
  recentUsers: RecentUser[];
  initialCodes: InviteCode[];
  initialRoles: RoleRecord[];
}) {
  const [codes, setCodes]       = useState<InviteCode[]>(initialCodes);
  const [users, setUsers]       = useState<RecentUser[]>(initialUsers);
  const [roles, setRoles]       = useState<RoleRecord[]>(initialRoles);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied]     = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [codeFilter, setCodeFilter] = useState<CodeFilter>("all");
  const [editingUser, setEditingUser] = useState<RecentUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [deletingRole, setDeletingRole] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const roleIconMap = Object.fromEntries(roles.map(r => [r.name, r.icon])) as Record<string, string | null>;
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map(u => u.id)));
    }
  }

  function generate() {
    startTransition(async () => {
      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const created = await res.json();
        setCodes((prev) => [created, ...prev]);
      }
    });
  }

  async function deleteCode(id: string, isUsed: boolean) {
    if (isUsed) return;
    setDeleting(id);
    await fetch("/api/admin/invite-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCodes((prev) => prev.filter((c) => c.id !== id));
    setDeleting(null);
  }

  async function deleteRole(id: string) {
    setDeletingRole(id);
    await fetch("/api/admin/roles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setRoles(prev => prev.filter(r => r.id !== id));
    setDeletingRole(null);
  }

  async function deleteUser(id: string) {
    setDeletingUser(id);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeletingUser(null);
  }

  function copy(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1800);
  }

  function applyBulkEdit(ids: string[], addRoles: string[], removeRoles: string[]) {
    setUsers(prev => prev.map(u => {
      if (!ids.includes(u.id)) return u;
      const next = new Set(u.roles);
      addRoles.forEach(r => next.add(r));
      removeRoles.forEach(r => next.delete(r));
      return { ...u, roles: Array.from(next) };
    }));
    setSelectedIds(new Set());
  }

  const filteredCodes = codes.filter(c => {
    if (codeFilter === "all") return true;
    return codeStatus(c) === codeFilter;
  });

  const card: React.CSSProperties = {
    background: "var(--novae-bg-card)",
    border: "1px solid var(--novae-outline-all)",
    borderRadius: "var(--novae-radius-md)",
    overflow: "hidden",
  };

  const filterBtn = (f: CodeFilter): React.CSSProperties => ({
    fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 600,
    padding: "4px 12px", borderRadius: "var(--novae-radius-sm)", cursor: "pointer", border: "none",
    background: codeFilter === f ? "var(--novae-btn-primary)" : "transparent",
    color: codeFilter === f ? "var(--novae-text-btn)" : "var(--novae-text-secondary)",
  });

  const allSelected = users.length > 0 && selectedIds.size === users.length;
  const someSelected = selectedIds.size > 0;

  return (
    <main style={{ width: "100%", padding: "40px 48px", fontFamily: "var(--font-dm-sans)", boxSizing: "border-box" }}>
      {editingUser && (
        <EditUserModal
          user={editingUser}
          availableRoles={roles}
          onClose={() => setEditingUser(null)}
          onSaved={(updated) => setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))}
        />
      )}
      {showCreateRole && (
        <CreateRoleModal
          onClose={() => setShowCreateRole(false)}
          onCreated={(role) => setRoles(prev => [...prev, role])}
        />
      )}
      {editingRole && (
        <EditRoleModal
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSaved={(updated) => setRoles(prev => prev.map(r => r.id === updated.id ? updated : r))}
        />
      )}
      {showBulkEdit && (
        <BulkEditModal
          userIds={Array.from(selectedIds)}
          availableRoles={roles}
          onClose={() => setShowBulkEdit(false)}
          onSaved={applyBulkEdit}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--novae-text-tag)" stroke="none">
          <path d="M2 4l3 12h14l3-12-6 5-4-5-4 5-6-5z"/>
          <path d="M5 20h14" stroke="var(--novae-text-tag)" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
        <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-3xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>
          Admin Dashboard
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
        {[
          { label: "Total users", value: stats.totalUsers },
          { label: "Personnages", value: stats.totalCharacters },
          { label: "Artworks", value: stats.totalArtworks },
        ].map(({ label, value }) => (
          <div key={label} style={{ ...card, padding: "24px 28px", overflow: "visible" }}>
            <p style={{ fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
            <p style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-5xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Roles — full width above users */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, ...card, padding: "16px 20px" }}>
          <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>
            Rôles
          </h2>
          <button onClick={() => setShowCreateRole(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", padding: "7px 14px", borderRadius: "var(--novae-radius-md)", backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-btn)", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Créer
          </button>
        </div>
        <div style={card}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Nom", "Icône", "Description", ""].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {roles.map(r => {
                const builtin = ["user", "admin"].includes(r.name);
                return (
                  <tr key={r.id}>
                    <td style={{ ...cell, whiteSpace: "nowrap" }}><RoleBadge role={r.name} icon={r.icon} /></td>
                    <td style={{ ...cell, width: 40 }}>
                      <RoleIcon name={r.icon} size={18} color="var(--novae-text-tag)" title={r.icon ?? undefined} />
                    </td>
                    <td style={{ ...cell, color: "var(--novae-text-secondary)", fontSize: "var(--novae-text-xs)" }}>{r.description ?? "—"}</td>
                    <td style={{ ...cell, width: 80 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button onClick={() => setEditingRole(r)} title="Modifier l'icône / description"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", padding: 4, display: "flex", alignItems: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => { if (!builtin && confirm(`Supprimer le rôle "${r.name}" ?`)) deleteRole(r.id); }}
                          disabled={builtin || deletingRole === r.id}
                          title={builtin ? "Rôle intégré" : "Supprimer"}
                          style={{ background: "none", border: "none", cursor: builtin ? "not-allowed" : "pointer", color: "var(--novae-text-secondary)", padding: 4, display: "flex", alignItems: "center", opacity: builtin || deletingRole === r.id ? 0.3 : 1 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users + Invite codes side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>

        {/* Users table */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Bulk action bar */}
          {someSelected && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", background: "rgba(164,132,220,0.1)", border: "1px solid var(--novae-outline-tag)", borderBottom: "none", borderRadius: "var(--novae-radius-md) var(--novae-radius-md) 0 0" }}>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-tag)", fontWeight: 600 }}>
                {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
              </span>
              <button onClick={() => setShowBulkEdit(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: "var(--novae-radius-sm)", backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-btn)", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 600 }}>
                Modifier les rôles
              </button>
              <button onClick={() => setSelectedIds(new Set())}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", padding: "5px 10px" }}>
                Désélectionner
              </button>
            </div>
          )}
          <div style={{ ...card, overflowX: "auto", borderRadius: someSelected ? "0 0 var(--novae-radius-md) var(--novae-radius-md)" : "var(--novae-radius-md)" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--novae-outline-all)" }}>
              <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>Utilisateurs récents</h2>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 40, paddingRight: 8 }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ cursor: "pointer", accentColor: "var(--novae-text-tag)" }} />
                  </th>
                  {["Username", "Email", "Rôle", "Code", "Rejoint", ""].map((h, i) => <th key={i} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ background: selectedIds.has(u.id) ? "rgba(164,132,220,0.05)" : "transparent" }}>
                    <td style={{ ...cell, width: 40, paddingRight: 8 }}>
                      <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} style={{ cursor: "pointer", accentColor: "var(--novae-text-tag)" }} />
                    </td>
                    <td style={{ ...cell, whiteSpace: "nowrap", fontWeight: 600 }}>
                      {u.username
                        ? <a href={`/${u.username}`} style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>@{u.username}</a>
                        : "—"}
                    </td>
                    <td style={{ ...cell, color: "var(--novae-text-secondary)", fontSize: "var(--novae-text-xs)" }}>{u.email}</td>
                    <td style={cell}><RolesBadges roles={u.roles} iconMap={roleIconMap} /></td>
                    <td style={{ ...cell, fontFamily: "monospace", fontSize: "var(--novae-text-xs)", color: u.inviteCode ? "var(--novae-text-tag)" : "var(--novae-text-secondary)", whiteSpace: "nowrap" }}>
                      {u.inviteCode ?? "—"}
                    </td>
                    <td style={{ ...cell, color: "var(--novae-text-secondary)", fontSize: "var(--novae-text-xs)", whiteSpace: "nowrap" }}>
                      {new Date(u.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ ...cell, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button onClick={() => setEditingUser(u)} title="Modifier"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", padding: 4, display: "flex", alignItems: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button onClick={() => { if (confirm(`Supprimer @${u.username ?? u.email} ?`)) deleteUser(u.id); }} title="Supprimer"
                          disabled={deletingUser === u.id}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ff6b7a", padding: 4, display: "flex", alignItems: "center", opacity: deletingUser === u.id ? 0.4 : 1 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite codes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, ...card, padding: "16px 20px" }}>
            <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0, whiteSpace: "nowrap" }}>
              Codes d'invitation
            </h2>
            <button onClick={generate} disabled={isPending}
              style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", padding: "7px 14px", borderRadius: "var(--novae-radius-md)", backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-btn)", border: "none", cursor: isPending ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, opacity: isPending ? 0.6 : 1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {isPending ? "…" : "Générer"}
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 6, padding: "10px 16px", background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)" }}>
            {(["all", "available", "used", "expired"] as CodeFilter[]).map(f => (
              <button key={f} onClick={() => setCodeFilter(f)} style={filterBtn(f)}>
                {f === "all" ? "Tous" : f === "available" ? "Disponible" : f === "used" ? "Utilisé" : "Expiré"}
              </button>
            ))}
          </div>

          <div style={card}>
            {filteredCodes.length === 0 ? (
              <p style={{ padding: "20px", color: "var(--novae-text-secondary)", fontSize: "var(--novae-text-sm)", margin: 0 }}>Aucun code.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>{["Code", "Statut", ""].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredCodes.map(c => {
                    const used = !!c.usedAt;
                    return (
                      <tr key={c.id}>
                        <td style={{ ...cell, fontFamily: "monospace", fontWeight: 700, fontSize: "var(--novae-text-xs)", letterSpacing: "0.03em", color: "var(--novae-text-tag)", whiteSpace: "nowrap" }}>{c.code}</td>
                        <td style={cell}><CodeStatusBadge code={c} /></td>
                        <td style={{ ...cell, width: 70 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {!used && (
                              <button onClick={() => copy(c.code)} title="Copier"
                                style={{ background: "none", border: "none", cursor: "pointer", color: copied === c.code ? "#48c78e" : "var(--novae-text-secondary)", padding: 4, display: "flex", alignItems: "center" }}>
                                {copied === c.code
                                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                }
                              </button>
                            )}
                            <button
                              onClick={() => !used && deleteCode(c.id, used)}
                              title={used ? "Code utilisé — non supprimable" : "Supprimer"}
                              disabled={deleting === c.id || used}
                              style={{ background: "none", border: "none", cursor: used ? "not-allowed" : "pointer", color: "var(--novae-text-secondary)", padding: 4, display: "flex", alignItems: "center", opacity: used || deleting === c.id ? 0.3 : 1 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
