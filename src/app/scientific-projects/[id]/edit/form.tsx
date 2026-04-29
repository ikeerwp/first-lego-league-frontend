'use client';

import { Option, ScientificProjectForm, ProjectFormValues } from '@/app/scientific-projects/_project-form-shared';
import { editScientificProject } from './actions';

interface EditScientificProjectFormProps {
    projectId: string;
    defaultValues: ProjectFormValues;
    editionOptions: Option[];
    teamsPerEdition: Record<string, Option[]>;
}

export default function EditScientificProjectForm({
    projectId,
    defaultValues,
    editionOptions,
    teamsPerEdition,
}: Readonly<EditScientificProjectFormProps>) {
    return (
        <ScientificProjectForm
            defaultValues={defaultValues}
            editionOptions={editionOptions}
            teamsPerEdition={teamsPerEdition}
            action={(data) => editScientificProject(projectId, data)}
            successRedirect={`/scientific-projects/${projectId}`}
            submitLabel="Save changes"
            savingLabel="Saving..."
        />
    );
}
