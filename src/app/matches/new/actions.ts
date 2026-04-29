"use server";

import { CreateMatchPayload, MatchesService } from "@/api/matchesApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { AuthenticationError, ValidationError } from "@/types/errors";
import { UsersService } from "@/api/userApi";

function normalizeTime(value: string) {
    return value.length === 5 ? `${value}:00` : value;
}

function parseTimeToSeconds(value: string) {
    const match = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.exec(value);

    if (!match) {
        throw new ValidationError("Please provide valid match times.");
    }

    const [, hours, minutes, seconds] = match;
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
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
