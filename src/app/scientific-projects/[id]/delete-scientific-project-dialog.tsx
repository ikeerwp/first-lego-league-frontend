"use client";

import { useRouter } from "next/navigation";
import { ScientificProjectsService } from "@/api/scientificProjectApi";
import ConfirmDestructiveDialog from "@/app/components/confirm-destructive-dialog";
import { clientAuthProvider } from "@/lib/authProvider";

interface DeleteScientificProjectDialogProps {
  readonly projectId: string;
  readonly onCancel: () => void;
}

export default function DeleteScientificProjectDialog({ projectId, onCancel }: DeleteScientificProjectDialogProps) {
  const router = useRouter();
  const service = new ScientificProjectsService(clientAuthProvider);

  async function handleDelete() {
    await service.deleteScientificProject(projectId);
    router.push("/scientific-projects");
    router.refresh();
  }

  return (
    <ConfirmDestructiveDialog
      title="Delete scientific project"
      description={<p>Are you sure you want to delete this scientific project? This action cannot be undone.</p>}
      confirmLabel="Delete scientific project"
      pendingLabel="Deleting..."
      onConfirm={handleDelete}
      onCancel={onCancel}
    />
  );
}
