"use client";

import { useState } from "react";
import { Button } from "@/app/components/button";
import ConfirmDestructiveDialog from "@/app/components/confirm-destructive-dialog";
import { deleteAwardAction } from "./_awards-actions";

export interface AwardSnapshot {
  id?: string;
  uri?: string;
  name?: string;
  title?: string;
  category?: string;
  description?: string;
}

interface AwardsSectionProps {
  readonly teamId: string;
  readonly awards: AwardSnapshot[];
  readonly isAdmin: boolean;
}

export default function AwardsSection({ teamId, awards, isAdmin }: Readonly<AwardsSectionProps>) {
  const [awardToDelete, setAwardToDelete] = useState<AwardSnapshot | null>(null);

  if (!awards || awards.length === 0) {
    return null;
  }

  const handleDelete = async () => {
    if (!awardToDelete) return;
    const awardId = awardToDelete.uri ? awardToDelete.uri.split("/").pop()! : String(awardToDelete.id);
    
    const result = await deleteAwardAction(teamId, awardId);
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  return (
    <section aria-labelledby="team-awards-heading" className="mt-8">
      <h2 id="team-awards-heading" className="mb-4 text-xl font-semibold">
        Awards
      </h2>
      <div className="space-y-3">
        {awards.map((award, index) => {
          const awardName = award.name ?? award.title ?? award.category ?? `Award ${index + 1}`;
          
          return (
            <div
              key={award.uri ?? String(award.id ?? index)}
              className="flex items-center justify-between rounded-md border border-border p-4 bg-card"
            >
              <div>
                <p className="font-medium text-foreground">{awardName}</p>
                {award.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {award.description}
                  </p>
                )}
              </div>
              
              {isAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setAwardToDelete(award)}
                >
                  Delete
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {awardToDelete && (
        <ConfirmDestructiveDialog
          title="Delete Award"
          description={
            <>
              Are you sure you want to delete the award{" "}
              <strong>{awardToDelete.name ?? awardToDelete.title ?? awardToDelete.category ?? "this award"}</strong>? 
              This action cannot be undone.
            </>
          }
          confirmLabel="Delete Award"
          pendingLabel="Deleting..."
          onConfirm={handleDelete}
          onCancel={() => setAwardToDelete(null)}
        />
      )}
    </section>
  );
}