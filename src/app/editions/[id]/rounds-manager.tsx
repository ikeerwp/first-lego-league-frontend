"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import ConfirmDestructiveDialog from "@/app/components/confirm-destructive-dialog";
import { RoundsService } from "@/api/roundsApi";
import { clientAuthProvider } from "@/lib/authProvider";
import { ConflictError, parseErrorMessage } from "@/types/errors";

interface RoundItem {
    uri?: string;
    number?: number;
}

interface RoundsManagerProps {
    readonly initialRounds: RoundItem[];
    readonly isAdmin: boolean;
}

export default function RoundsManager({ initialRounds, isAdmin }: RoundsManagerProps) {
    const router = useRouter();

    const [rounds, setRounds] = useState<RoundItem[]>(initialRounds);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [roundNumber, setRoundNumber] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [roundToDelete, setRoundToDelete] = useState<RoundItem | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !isCreating) {
                setIsCreateOpen(false);
            }
        }
        if (isCreateOpen) {
            globalThis.addEventListener("keydown", handleKeyDown);
            return () => globalThis.removeEventListener("keydown", handleKeyDown);
        }
    }, [isCreateOpen, isCreating]);

    function openCreate() {
        setRoundNumber("");
        setCreateError(null);
        setIsCreateOpen(true);
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setCreateError(null);
        const num = parseInt(roundNumber, 10);
        if (!roundNumber || isNaN(num) || num < 1) {
            setCreateError("Please enter a valid round number (minimum 1).");
            return;
        }
        setIsCreating(true);
        try {
            const service = new RoundsService(clientAuthProvider);
            const newRound = await service.createRound({ number: num });
            const plainRound: RoundItem = { uri: newRound.uri, number: newRound.number };
            setRounds((prev) =>
                [...prev, plainRound].sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
            );
            setIsCreateOpen(false);
            router.refresh();
        } catch (e) {
            setCreateError(parseErrorMessage(e));
        } finally {
            setIsCreating(false);
        }
    }

    async function handleDelete() {
        if (!roundToDelete) return;
        setDeleteError(null);
        const rawId = roundToDelete.uri?.split("/").filter(Boolean).at(-1);
        if (!rawId) return;
        try {
            const service = new RoundsService(clientAuthProvider);
            await service.deleteRound(rawId);
            setRounds((prev) => prev.filter((r) => r.uri !== roundToDelete.uri));
            setRoundToDelete(null);
            router.refresh();
        } catch (e) {
            if (e instanceof ConflictError) {
                setDeleteError(
                    "This round cannot be deleted because it contains scheduled matches.",
                );
            } else {
                setDeleteError(parseErrorMessage(e));
            }
        }
    }

    return (
        <div>
            {isAdmin && (
                <div className="mb-4">
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Round
                    </Button>
                </div>
            )}

            {rounds.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No rounds have been created yet.
                </p>
            )}

            {rounds.length > 0 && (
                <ul className="space-y-2">
                    {rounds.map((round) => (
                        <li
                            key={round.uri}
                            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                        >
                            <span className="font-medium text-foreground">
                                Round {round.number}
                            </span>
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDeleteError(null);
                                        setRoundToDelete(round);
                                    }}
                                    className="text-muted-foreground transition-colors hover:text-destructive"
                                    aria-label={`Delete round ${round.number}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {isCreateOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !isCreating) {
                            setIsCreateOpen(false);
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="create-round-title"
                        className="w-full max-w-sm border border-border bg-card p-6 shadow-xl"
                    >
                        <h2 id="create-round-title" className="mb-4 text-lg font-semibold">
                            Create Round
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            {createError && (
                                <p className="text-sm text-destructive" role="alert">
                                    {createError}
                                </p>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="round-number">Round number</Label>
                                <Input
                                    id="round-number"
                                    type="number"
                                    min={1}
                                    value={roundNumber}
                                    onChange={(e) => setRoundNumber(e.target.value)}
                                    placeholder="e.g. 1"
                                    disabled={isCreating}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating ? "Creating..." : "Create"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    disabled={isCreating}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {roundToDelete && (
                <ConfirmDestructiveDialog
                    title={`Delete Round ${roundToDelete.number}?`}
                    description={
                        <div>
                            <p>This action cannot be undone.</p>
                            {deleteError && (
                                <p className="mt-2 font-medium text-destructive">
                                    {deleteError}
                                </p>
                            )}
                        </div>
                    }
                    confirmLabel="Delete"
                    pendingLabel="Deleting..."
                    onConfirm={handleDelete}
                    onCancel={() => {
                        setRoundToDelete(null);
                        setDeleteError(null);
                    }}
                />
            )}
        </div>
    );
}