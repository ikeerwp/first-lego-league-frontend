import { EditionsService } from '@/api/editionApi';
import { getEncodedResourceId } from '@/lib/halRoute';
import type { AuthStrategy } from '@/lib/authProvider';
import type { Option } from './_project-form-shared';

export interface EditionFormData {
    editionOptions: Option[];
    teamsPerEdition: Record<string, Option[]>;
}

export async function fetchEditionFormData(authProvider: AuthStrategy): Promise<EditionFormData> {
    const editionsService = new EditionsService(authProvider);
    const editions = await editionsService.getEditions();

    const editionOptions: Option[] = editions.map(e => {
        const venuePart = e.venueName ? ` — ${e.venueName}` : '';
        return { label: `${e.year}${venuePart}`, value: e.link('self')?.href ?? '' };
    });

    const teamsPerEditionEntries = await Promise.all(
        editions.map(async (e) => {
            const editionHref = e.link('self')?.href ?? '';
            const encodedEditionId = getEncodedResourceId(editionHref);
            const editionId = encodedEditionId ? decodeURIComponent(encodedEditionId) : '';
            const teams = await editionsService.getEditionTeams(editionId);
            return [editionHref, teams.map(t => ({
                label: t.id ?? t.name ?? '',
                value: t.link('self')?.href ?? '',
            }))] as const;
        })
    );

    return { editionOptions, teamsPerEdition: Object.fromEntries(teamsPerEditionEntries) };
}
