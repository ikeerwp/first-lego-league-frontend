"use client";

import { useEffect, useMemo, useState } from "react";
import { TeamsService } from "@/api/teamApi";
import { clientAuthProvider } from "@/lib/authProvider";
import ConfirmDestructiveDialog from "@/app/components/confirm-destructive-dialog";
import { Button } from "@/app/components/button";

interface Floater {
    id: number;
    name?: string;
    studentCode?: string;
}

interface Props {
    teamId: string;
    isAdmin: boolean;
}

export default function TeamFloatersSection({ teamId, isAdmin }: Props) {
    const service = useMemo(
        () => new TeamsService(clientAuthProvider),
        []
    );

    const [floaters, setFloaters] = useState<Floater[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFloater, setSelectedFloater] = useState<Floater | null>(null);
    const [removing, setRemoving] = useState(false);

    async function loadFloaters() {
        try {
            setLoading(true);
            setError(null);

            const data = await service.getTeamFloaters(teamId);
            setFloaters(data ?? []);
        } catch {
            setError("Could not load floaters");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadFloaters();
    }, [teamId]);

    async function handleRemove() {
        if (!selectedFloater) return;

        try {
            setRemoving(true);
            await service.removeFloater(selectedFloater.id);
            setSelectedFloater(null);
            await loadFloaters();
        } catch {
            setError("Failed to remove floater");
        } finally {
            setRemoving(false);
        }
    }

    return (
        <section className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">Floaters</h2>

            {loading && (
                <p className="text-sm text-muted-foreground">Loading...</p>
            )}

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {!loading && floaters.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No floaters assigned
                </p>
            )}

            <ul className="space-y-2">
                {floaters.map((floater) => (
                    <li
                        key={floater.id}
                        className="flex items-center justify-between border p-3 rounded-md"
                    >
                        <div>
                            <p className="font-medium">
                                {floater.name ?? "Unnamed floater"}
                            </p>
                            {floater.studentCode && (
                                <p className="text-sm text-muted-foreground">
                                    {floater.studentCode}
                                </p>
                            )}
                        </div>

                        {isAdmin && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setSelectedFloater(floater)}
                            >
                                Remove
                            </Button>
                        )}
                    </li>
                ))}
            </ul>

            {selectedFloater && (
                <ConfirmDestructiveDialog
                    title="Remove floater"
                    description={`Are you sure you want to remove ${selectedFloater.name ?? "this floater"}?`}
                    confirmLabel={removing ? "Removing..." : "Remove"}
                    pendingLabel="Removing..."
                    onConfirm={handleRemove}
                    onCancel={() => setSelectedFloater(null)}
                />
            )}
        </section>
    );
}