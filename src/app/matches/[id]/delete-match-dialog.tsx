"use client";

import { useRouter } from "next/navigation";
import { MatchesService } from "@/api/matchesApi";
import ConfirmDestructiveDialog from "@/app/components/confirm-destructive-dialog";
import { clientAuthProvider } from "@/lib/authProvider";

interface DeleteMatchDialogProps {
  readonly matchId: string;
  readonly onCancel: () => void;
}

export default function DeleteMatchDialog({ matchId, onCancel }: DeleteMatchDialogProps) {
  const router = useRouter();
  const service = new MatchesService(clientAuthProvider);

  async function handleDelete() {
    await service.deleteMatch(matchId);
    router.push("/matches");
    router.refresh();
  }

  return (
    <ConfirmDestructiveDialog
      title="Delete match"
      description={<p>Are you sure you want to delete this match? This action cannot be undone.</p>}
      confirmLabel="Delete match"
      pendingLabel="Deleting..."
      onConfirm={handleDelete}
      onCancel={onCancel}
    />
  );
}
