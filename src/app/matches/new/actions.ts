"use server";

import { CreateMatchPayload, MatchesService } from "@/api/matchesApi";
import { UsersService } from "@/api/userApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { AuthenticationError, ValidationError } from "@/types/errors";

function normalizeTime(value: string) {
    // If value is a local datetime without seconds (e.g. 2026-05-05T14:30), add seconds
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
        return `${value}:00`;
    }
    return value;
}

function parseTimeToSeconds(value: string) {
    // Expect an ISO local datetime (e.g. 2026-05-05T14:30:00 or 2026-05-05T14:30)
    const timestamp = Date.parse(value);

    if (Number.isNaN(timestamp)) {
        throw new ValidationError("Please provide valid match datetimes.");
    }

    return Math.floor(timestamp / 1000);
}

function validateMatchPayload(data: CreateMatchPayload) {
    if (
        !data.startTime ||
        !data.endTime ||
        !data.round ||
        !data.competitionTable ||
        !data.teamA ||
        !data.teamB ||
        !data.referee
    ) {
        throw new ValidationError("Please complete all required match fields.");
    }

    if (data.teamA === data.teamB) {
        throw new ValidationError("Please select two different teams.");
    }

    const normalizedStartTime = normalizeTime(data.startTime);
    const normalizedEndTime = normalizeTime(data.endTime);

    if (parseTimeToSeconds(normalizedStartTime) >= parseTimeToSeconds(normalizedEndTime)) {
        throw new ValidationError("End time must be later than start time.");
    }

    return {
        ...data,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
    };
}

export async function createMatch(data: CreateMatchPayload) {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) {
        throw new AuthenticationError();
    }

    const currentUser = await new UsersService(serverAuthProvider).getCurrentUser();

    if (!isAdmin(currentUser)) {
        throw new AuthenticationError("You are not allowed to create matches.", 403);
    }

    const service = new MatchesService(serverAuthProvider);
    await service.createMatch(validateMatchPayload(data));

    return "/matches";
}
