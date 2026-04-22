import type { AuthStrategy } from "@/lib/authProvider";
import type { HalPage } from "@/types/pagination";
import { ScientificProject } from "@/types/scientificProject";
import { deleteHal, fetchHalPagedCollection, fetchHalResource, getHal, mergeHal, mergeHalArray, postHal } from "./halClient";

export class ScientificProjectsService {
    constructor(private readonly authStrategy: AuthStrategy) { }

    async getScientificProjects(): Promise<ScientificProject[]> {
        const resource = await getHal('/scientificProjects', this.authStrategy);
        const embedded = resource.embeddedArray('scientificProjects') || [];
        return mergeHalArray<ScientificProject>(embedded);
    }

    async getScientificProjectsPaged(page: number, size: number): Promise<HalPage<ScientificProject>> {
        return fetchHalPagedCollection<ScientificProject>(
            '/scientificProjects', this.authStrategy, 'scientificProjects', page, size
        );
    }

    async getScientificProjectsByEdition(editionId: string): Promise<ScientificProject[]> {
        const encodedId = encodeURIComponent(editionId);
        const resource = await getHal(`/scientificProjects/search/findByEditionId?editionId=${encodedId}`, this.authStrategy);
        const embedded = resource.embeddedArray('scientificProjects') || [];
        return mergeHalArray<ScientificProject>(embedded);
    }

    async getScientificProjectById(id: string): Promise<ScientificProject> {
        const projectId = encodeURIComponent(id);
        return fetchHalResource<ScientificProject>(`/scientificProjects/${projectId}`, this.authStrategy);
    }

    async createScientificProject(project: ScientificProject): Promise<ScientificProject> {
        const resource = await postHal('/scientificProjects', project, this.authStrategy);
        if (!resource) throw new Error('Failed to create scientific project');
        return mergeHal<ScientificProject>(resource);
    }

    async deleteScientificProject(id: string): Promise<void> {
        const projectId = encodeURIComponent(id);
        await deleteHal(`/scientificProjects/${projectId}`, this.authStrategy);
    }
}
