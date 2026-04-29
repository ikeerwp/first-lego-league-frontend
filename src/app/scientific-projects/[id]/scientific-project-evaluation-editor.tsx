"use client";

import { ScientificProjectsService } from "@/api/scientificProjectApi";
import { Button } from "@/app/components/button";
import ErrorAlert from "@/app/components/error-alert";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { Textarea } from "@/app/components/textarea";
import { clientAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";
import { CheckCircle, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type FormValues = {
    score: string;
    comments: string;
};

type ScientificProjectEvaluationEditorProps = {
    readonly projectId: string;
    readonly currentScore?: number | null;
    readonly currentComments?: string | null;
    readonly canEdit: boolean;
};

export default function ScientificProjectEvaluationEditor({
    projectId,
    currentScore,
    currentComments,
    canEdit,
}: Readonly<ScientificProjectEvaluationEditorProps>) {
    const service = new ScientificProjectsService(clientAuthProvider);
    const router = useRouter();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const currentScoreValue = currentScore === undefined || currentScore === null ? "" : String(currentScore);
    const currentCommentsValue = currentComments ?? "";

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            score: currentScoreValue,
            comments: currentCommentsValue,
        },
    });

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        reset({
            score: currentScoreValue,
            comments: currentCommentsValue,
        });
    }, [currentCommentsValue, currentScoreValue, isOpen, reset]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen && !dialog.open) {
            dialog.showModal();
        }

        if (!isOpen && dialog.open) {
            dialog.close();
        }
    }, [isOpen]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        function handleCancel(event: Event) {
            event.preventDefault();
            if (isSubmitting) return;

            setIsOpen(false);
            setErrorMessage(null);
        }

        dialog.addEventListener("cancel", handleCancel);
        return () => dialog.removeEventListener("cancel", handleCancel);
    }, [isSubmitting]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setErrorMessage(null);
        setSuccessMessage(null);

        const scoreValue = data.score.trim();
        const commentsValue = data.comments.trim();
        const nextScore = Number(scoreValue);
        const currentScoreNumber = currentScore === undefined || currentScore === null ? null : Number(currentScore);

        if (currentScoreNumber !== null && nextScore === currentScoreNumber && commentsValue === currentCommentsValue.trim()) {
            setErrorMessage("No changes to save.");
            return;
        }

        try {
            await service.updateScientificProject(projectId, {
                score: nextScore,
                comments: commentsValue,
            });

            setSuccessMessage("Scientific project evaluation updated successfully.");
            setIsOpen(false);
            router.refresh();
        } catch (error) {
            setErrorMessage(parseErrorMessage(error));
        }
    };

    if (!canEdit) {
        return (
            <div className="mt-5 rounded-lg border border-dashed border-border bg-background/60 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                    Only judges and administrators can update this evaluation.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-5 space-y-4">
            {successMessage && (
                <div
                    className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3"
                    role="status"
                >
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        {successMessage}
                    </p>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        setSuccessMessage(null);
                        setErrorMessage(null);
                        setIsOpen(true);
                    }}
                >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit evaluation
                </Button>
                <p className="text-sm text-muted-foreground">
                    Update the score and judge comments from this page.
                </p>
            </div>

            {isOpen && (
                <dialog
                    ref={dialogRef}
                    aria-labelledby={titleId}
                    className="m-auto w-full max-w-lg border border-border bg-card px-6 py-6 shadow-lg backdrop:bg-black/50 sm:px-8 sm:py-8"
                >
                    <div className="space-y-1">
                        <h2 id={titleId} className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                            Edit scientific project evaluation
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Review the current values and submit the updated evaluation.
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="mt-4">
                            <ErrorAlert message={errorMessage} />
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="scientific-project-score">Score</Label>
                            <Input
                                id="scientific-project-score"
                                type="text"
                                inputMode="decimal"
                                placeholder="Enter the numeric score"
                                aria-invalid={!!errors.score}
                                {...register("score", {
                                    required: "Score is required",
                                    validate: (value) => {
                                        const trimmed = value.trim();
                                        if (!trimmed) {
                                            return "Score is required";
                                        }

                                        if (!Number.isFinite(Number(trimmed))) {
                                            return "Score must be a valid number";
                                        }

                                        return true;
                                    },
                                })}
                            />
                            {errors.score && (
                                <p className="text-sm text-destructive">{errors.score.message}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="scientific-project-comments">Comments</Label>
                            <Textarea
                                id="scientific-project-comments"
                                rows={6}
                                placeholder="Write the evaluation comments"
                                aria-invalid={!!errors.comments}
                                {...register("comments", {
                                    required: "Comments are required",
                                    validate: (value) =>
                                        value.trim().length > 0 || "Comments are required",
                                })}
                            />
                            {errors.comments && (
                                <p className="text-sm text-destructive">{errors.comments.message}</p>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsOpen(false);
                                    setErrorMessage(null);
                                }}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save evaluation"}
                            </Button>
                        </div>
                    </form>
                </dialog>
            )}
        </div>
    );
}
