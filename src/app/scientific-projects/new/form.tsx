"use client";

import { Option, ScientificProjectForm } from "@/app/scientific-projects/_project-form-shared";
import { createScientificProject } from "./actions";

export default function NewScientificProjectForm({
    editionOptions,
    teamsPerEdition,
}: Readonly<{
    editionOptions: Option[];
    teamsPerEdition: Record<string, Option[]>;
}>) {
    return (
        <ScientificProjectForm
            editionOptions={editionOptions}
            teamsPerEdition={teamsPerEdition}
            action={createScientificProject}
            successRedirect="/scientific-projects"
            submitLabel="Create project"
            savingLabel="Creating project..."
        />
    );
}
