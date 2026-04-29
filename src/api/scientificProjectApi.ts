import type { AuthStrategy } from "@/lib/authProvider";
import type { HalPage } from "@/types/pagination";
import { ScientificProject } from "@/types/scientificProject";
import { deleteHal, fetchHalCollection, fetchHalPagedCollection, fetchHalResource, getHal, mergeHal, mergeHalArray, patchHal, postHal } from "./halClient";

export class ScientificProjectsService {
    constructor(private readonly authStrategy: AuthStrategy) { }

    async getScientificProjects(): Promise<ScientificProject[]> {
        const resource = await getHal('/scientificProjects', this.authStrategy);
        const embedded = resource.embeddedArray('scientificProjects') || [];
        return mergeHalArray<ScientificProject>(embedded);
    }

    async getScientificProjectsPaged(page: number, size: number): Promise<HalPage<ScientificProject>> {
        return fetchHalPagedCollection<ScientificProject>(
            "/scientificProjects",
            this.authStrategy,
            "scientificProjects",
            page,
            size
        );
    }

    async getScientificProjectsByTeamName(teamName: string): Promise<ScientificProject[]> {
        const encodedTeamName = encodeURIComponent(teamName);
        return fetchHalCollection<ScientificProject>(
            `/scientificProjects/search/findByTeamName?teamName=${encodedTeamName}`,
            this.authStrategy,
            "scientificProjects"
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

    private async patchScientificProject(
        id: string,
        data: Record<string, unknown>
    ): Promise<ScientificProject | null> {
        const projectId = encodeURIComponent(id);
        const resource = await patchHal(`/scientificProjects/${projectId}`, data, this.authStrategy);
        return resource ? mergeHal<ScientificProject>(resource) : null;
    }

    async editScientificProjectInfo(
        id: string,
        data: { comments: string; team: string; edition: string }
    ): Promise<ScientificProject | null> {
        return this.patchScientificProject(id, data);
    }

    async updateScientificProject(
        id: string,
        data: { score: number; comments: string }
    ): Promise<ScientificProject | null> {
        return this.patchScientificProject(id, data);
    }

    async deleteScientificProject(id: string): Promise<void> {
        const projectId = encodeURIComponent(id);
        await deleteHal(`/scientificProjects/${projectId}`, this.authStrategy);
    }
}
