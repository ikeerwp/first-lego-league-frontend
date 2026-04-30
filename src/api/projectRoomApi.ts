import type { AuthStrategy } from "@/lib/authProvider";
import type { ProjectRoom } from "@/types/projectRoom";
import { fetchHalCollection, fetchHalResource } from "./halClient";

export class ProjectRoomsService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async getProjectRooms(): Promise<ProjectRoom[]> {
        return fetchHalCollection<ProjectRoom>(
            "/projectRooms",
            this.authStrategy,
            "projectRooms"
        );
    }

    async getProjectRoomById(id: string): Promise<ProjectRoom> {
        const encodedId = encodeURIComponent(id);
        return fetchHalResource<ProjectRoom>(
            `/projectRooms/${encodedId}`,
            this.authStrategy
        );
    }
}