"use client";

import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { Textarea } from "@/app/components/textarea";
import { parseErrorMessage } from "@/types/errors";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { createEdition } from "./actions";

type FormValues = {
    year: number;
    venueName: string;
    description: string;
};

export default function NewEditionForm() {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            year: new Date().getUTCFullYear(),
            venueName: "",
            description: "",
        },
    });

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setSubmitError(null);

        try {
            const editionPath = await createEdition({
                year: Number(data.year),
                venueName: data.venueName.trim(),
                description: data.description.trim(),
            });
            router.push(editionPath);
        } catch (error) {
            setSubmitError(parseErrorMessage(error));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="mx-auto grid max-w-xl gap-5">
            {submitError && (
                <p
                    className="border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
                    role="alert"
                    aria-live="assertive"
                >
                    {submitError}
                </p>
            )}

            <div className="grid gap-2">
                <Label htmlFor="year">Year</Label>
                <Input
                    id="year"
                    type="number"
                    inputMode="numeric"
                    {...register("year", {
                        required: "Year is required",
                        valueAsNumber: true,
                        min: { value: 2000, message: "Year must be 2000 or later" },
                        max: { value: 2100, message: "Year must be 2100 or earlier" },
                    })}
                />
                {errors.year && (
                    <p className="text-sm text-destructive" role="alert">
                        {errors.year.message}
                    </p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="venueName">Venue</Label>
                <Input
                    id="venueName"
                    {...register("venueName", {
                        required: "Venue is required",
                        validate: (value) =>
                            value.trim().length > 0 || "Venue is required",
                    })}
                />
                {errors.venueName && (
                    <p className="text-sm text-destructive" role="alert">
                        {errors.venueName.message}
                    </p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    {...register("description", {
                        required: "Description is required",
                        validate: (value) =>
                            value.trim().length > 0 || "Description is required",
                    })}
                />
                {errors.description && (
                    <p className="text-sm text-destructive" role="alert">
                        {errors.description.message}
                    </p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="state">Initial state</Label>
                <Input
                    id="state"
                    value="DRAFT"
                    readOnly
                    aria-readonly="true"
                />
                <p className="text-sm text-muted-foreground">
                    New editions are created in DRAFT state by the backend.
                </p>
            </div>

            <Button
                type="submit"
                className="mt-2 w-full"
                loading={isSubmitting}
                loadingText="Creating edition..."
            >
                Submit
            </Button>
        </form>
    );
}
