"use client";

import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { Textarea } from "@/app/components/textarea";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { createScientificProject } from "./actions";

type Option = { label: string; value: string };

type FormValues = {
    name: string;
    description: string;
    edition: string;
    team: string;
};

const selectClassName =
    "border-input h-11 w-full border bg-card px-4 py-2 text-base outline-none " +
    "focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] " +
    "aria-invalid:border-destructive md:text-sm disabled:pointer-events-none disabled:opacity-50";

export default function NewScientificProjectForm({
    editionOptions,
    teamsPerEdition,
}: Readonly<{
    editionOptions: Option[];
    teamsPerEdition: Record<string, Option[]>;
}>) {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>();
    const router = useRouter();

    const watchedEdition = watch("edition");
    const visibleTeams = teamsPerEdition[watchedEdition] ?? [];

    useEffect(() => {
        setValue("team", "");
    }, [watchedEdition, setValue]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setSubmitError(null);
        try {
            await createScientificProject({
                comments: `${data.name}\n\n${data.description}`,
                team: data.team,
                edition: data.edition,
            });
            router.push("/scientific-projects");
        } catch {
            setSubmitError("Failed to create scientific project. Please try again.");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="mx-auto grid max-w-xl gap-5">
            {submitError && (
                <p className="border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    {submitError}
                </p>
            )}

            <div className="grid gap-2">
                <Label htmlFor="name">Project name</Label>
                <Input
                    id="name"
                    {...register("name", {
                        required: "Project name is required",
                        maxLength: { value: 100, message: "Max 100 characters" }
                    })}
                />
                {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    {...register("description", {
                        required: "Description is required",
                        maxLength: { value: 400, message: "Max 400 characters" }
                    })}
                />
                {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="edition">Edition</Label>
                <select
                    id="edition"
                    className={selectClassName}
                    {...register("edition", { required: "Edition is required" })}
                >
                    <option value="">Select an edition...</option>
                    {editionOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                {errors.edition && (
                    <p className="text-sm text-destructive">{errors.edition.message}</p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="team">Team</Label>
                <select
                    id="team"
                    className={selectClassName}
                    disabled={!watchedEdition}
                    {...register("team", { required: "Team is required" })}
                >
                    <option value="">
                        {watchedEdition ? "Select a team..." : "Select an edition first..."}
                    </option>
                    {visibleTeams.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                {errors.team && (
                    <p className="text-sm text-destructive">{errors.team.message}</p>
                )}
            </div>

            <Button
                type="submit"
                className="mt-2 w-full"
                loading={isSubmitting}
                loadingText="Creating project..."
            >
                Create project
            </Button>
        </form>
    );
}
