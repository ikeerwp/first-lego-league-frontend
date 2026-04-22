"use server";

import { MatchesService } from "@/api/matchesApi";
import { UsersService } from "@/api/userApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin, isReferee } from "@/lib/authz";
import { RegisterMatchScoreRequest, RegisterMatchScoreResponse } from "@/types/matchResult";
import { parseErrorMessage } from "@/types/errors";

export async function registerMatchResult(
    data: RegisterMatchScoreRequest
): Promise<RegisterMatchScoreResponse> {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) {
        throw new Error("You must be logged in to record match results.");
    }

    const currentUser = await new UsersService(serverAuthProvider).getCurrentUser();

    if (!isAdmin(currentUser) && !isReferee(currentUser)) {
        throw new Error("You are not allowed to record match results.");
    }

    const { teamAScore, teamBScore } = data.score;
    if (!Number.isFinite(teamAScore) || !Number.isFinite(teamBScore) || teamAScore < 0 || teamBScore < 0) {
        throw new Error("Scores must be non-negative whole numbers.");
    }

    try {
        return await new MatchesService(serverAuthProvider).registerMatchResult(data);
    } catch (e) {
        throw new Error(parseErrorMessage(e));
    }
}
