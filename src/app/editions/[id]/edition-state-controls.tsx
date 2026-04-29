"use client";

import { useMemo, useState } from "react";
import { EditionsService } from "@/api/editionApi";
import { useAuth } from "@/app/components/authentication";
import { Button } from "@/app/components/button";
import ConfirmDestructiveDialog from "@/app/components/confirm-destructive-dialog";
import ErrorAlert from "@/app/components/error-alert";
import { clientAuthProvider } from "@/lib/authProvider";
import { isAdmin as userIsAdmin } from "@/lib/authz";

interface EditionStateControlsProps {
    readonly editionId: string;
    readonly state?: string;
    readonly isAdmin: boolean;
}

const STATE_ORDER = ["DRAFT", "ACTIVE", "FINISHED"] as const;

type EditionState = (typeof STATE_ORDER)[number];

function normalizeState(state?: string): EditionState | null {
    if (state === "DRAFT" || state === "ACTIVE" || state === "FINISHED") {
        return state;
    }

    return null;
}

function getNextState(state?: string): EditionState | null {
    const normalizedState = normalizeState(state);

    if (!normalizedState) return null;
    if (normalizedState === "DRAFT") return "ACTIVE";
    if (normalizedState === "ACTIVE") return "FINISHED";

    return null;
}

function getStateBadgeClassName(state?: string): string {
    switch (normalizeState(state)) {
        case "DRAFT":
            return "bg-gray-100 text-gray-700 border-gray-200";
        case "ACTIVE":
            return "bg-green-100 text-green-700 border-green-200";
        case "FINISHED":
            return "bg-zinc-100 text-zinc-700 border-zinc-200";
        default:
            return "bg-muted text-muted-foreground border-border";
    }
}

export default function EditionStateControls({
    editionId,
    state,
    isAdmin,
}: EditionStateControlsProps) {
    const { user } = useAuth();
    const service = useMemo(() => new EditionsService(clientAuthProvider), []);

    const [currentState, setCurrentState] = useState(state ?? "UNKNOWN");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const nextState = getNextState(currentState);
    const canAdvanceState = isAdmin || userIsAdmin(user);

    async function handleConfirmTransition() {
        if (!nextState) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await service.updateEditionState(editionId, nextState);

            setCurrentState(nextState);
            setIsDialogOpen(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update edition state.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
                <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${getStateBadgeClassName(currentState)}`}
                >
                    {currentState}
                </span>

                {canAdvanceState && nextState && (
                    <Button
                        type="button"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => setIsDialogOpen(true)}
                    >
                        {isSubmitting ? "Updating..." : `Advance to ${nextState}`}
                    </Button>
                )}
            </div>

            {error && <ErrorAlert message={error} />}

            {isDialogOpen && nextState && (
                <ConfirmDestructiveDialog
                    title="Advance edition state"
                    description={
                        <p>
                            Are you sure you want to change the edition state from{" "}
                            <span className="font-semibold text-foreground">
                                {currentState}
                            </span>{" "}
                            to{" "}
                            <span className="font-semibold text-foreground">
                                {nextState}
                            </span>
                            ?
                        </p>
                    }
                    confirmLabel={`Advance to ${nextState}`}
                    pendingLabel="Updating..."
                    onConfirm={handleConfirmTransition}
                    onCancel={() => {
                        if (!isSubmitting) {
                            setIsDialogOpen(false);
                        }
                    }}
                />
            )}
        </div>
    );
}
