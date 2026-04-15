import type { AuthStrategy } from "@/lib/authProvider";
import { ScientificProject } from "@/types/scientificProject";
import { getHal, mergeHal, mergeHalArray, postHal, fetchHalResource } from "./halClient";

export class ScientificProjectsService {
    constructor(private readonly authStrategy: AuthStrategy) { }

    async getScientificProjects(): Promise<ScientificProject[]> {
        const resource = await getHal('/scientificProjects', this.authStrategy);
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
}