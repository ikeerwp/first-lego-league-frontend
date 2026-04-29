"use client";

import { UsersService } from "@/api/userApi";
import ConfirmDestructiveDialog from "@/app/components/confirm-destructive-dialog";
import { clientAuthProvider } from "@/lib/authProvider";
import { UserEntity } from "@/types/user";

interface DeleteAdministratorDialogProps {
  readonly administrator: UserEntity;
  readonly onSuccess: () => void;
  readonly onCancel: () => void;
}

export default function DeleteAdministratorDialog({
  administrator,
  onSuccess,
  onCancel,
}: DeleteAdministratorDialogProps) {
  const service = new UsersService(clientAuthProvider);

  // Open as a native modal — built-in focus trap, backdrop and accessibility

  // Intercept the native Escape cancel event to block closing while a delete is in progress

  // The shared dialog already handles pending and error states for us.
  async function handleDelete() {
    await service.deleteUser(administrator.username);
    onSuccess();
  }

  return (
    <ConfirmDestructiveDialog
      title="Delete administrator"
      description={
        <p>
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">
            {administrator.username}
          </span>
          {administrator.email && (
            <>
              {" "}
              (<span className="text-foreground">{administrator.email}</span>)
            </>
          )}
          ? This action cannot be undone.
        </p>
      }
      confirmLabel="Delete administrator"
      pendingLabel="Deleting..."
      onConfirm={handleDelete}
      onCancel={onCancel}
    />
  );
}
