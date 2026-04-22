"use client";

import { useState } from "react";
import { Button } from "@/app/components/button";
import DeleteScientificProjectDialog from "./delete-scientific-project-dialog";

interface ScientificProjectDeleteSectionProps {
  readonly projectId: string;
}

export default function ScientificProjectDeleteSection({ projectId }: ScientificProjectDeleteSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
      >
        Delete scientific project
      </Button>

      {isDialogOpen && (
        <DeleteScientificProjectDialog
          projectId={projectId}
          onCancel={() => setIsDialogOpen(false)}
        />
      )}
    </>
  );
}
