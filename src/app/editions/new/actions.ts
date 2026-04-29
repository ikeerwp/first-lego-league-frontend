"use server";

import { CreateEditionPayload, EditionsService } from "@/api/editionApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { getEncodedResourceId } from "@/lib/halRoute";
import { ApiError, AuthenticationError } from "@/types/errors";
import { UsersService } from "@/api/userApi";

export async function createEdition(data: CreateEditionPayload) {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) {
        throw new AuthenticationError();
    }

    const usersService = new UsersService(serverAuthProvider);
    const currentUser = await usersService.getCurrentUser();

    if (!isAdmin(currentUser)) {
        throw new AuthenticationError("You are not allowed to create editions.", 403);
    }

    const service = new EditionsService(serverAuthProvider);
    const edition = await service.createEdition(data);
    const editionId = getEncodedResourceId(edition.uri ?? edition.link("self")?.href);

    if (!editionId) {
        throw new ApiError("The edition was created, but no identifier was returned.", 500, false);
    }

    return `/editions/${editionId}`;
}
