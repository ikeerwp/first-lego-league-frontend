"use client";

import { useState } from "react";
import { Button } from "@/app/components/button";
import DeleteMatchDialog from "./delete-match-dialog";

interface MatchDeleteSectionProps {
  readonly matchId: string;
}

export default function MatchDeleteSection({ matchId }: MatchDeleteSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
      >
        Delete match
      </Button>

      {isDialogOpen && (
        <DeleteMatchDialog
          matchId={matchId}
          onCancel={() => setIsDialogOpen(false)}
        />
      )}
    </>
  );
}
