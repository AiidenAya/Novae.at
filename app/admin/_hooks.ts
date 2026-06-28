"use client";

import { useState } from "react";

export function useDeleteUser(onDeleted: (id: string) => void) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteUser(id: string, label: string) {
    if (!confirm(`Supprimer ${label} ?`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) onDeleted(id);
    setDeletingId(null);
  }

  return { deleteUser, deletingId };
}
