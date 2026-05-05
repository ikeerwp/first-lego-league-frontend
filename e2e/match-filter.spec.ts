import { expect, test } from "@playwright/test";
import { filterMatchesByTeam, matchIncludesTeamQuery, normalizeTeamSearch } from "../src/lib/matchFilter";
import type { Match } from "../src/types/match";

function createMatch(uri: string, teamA = "", teamB = ""): Match {
    return {
        uri,
        id: Number(uri.replace(/\D/g, "")),
        startTime: "",
        endTime: "",
        round: "",
        competitionTable: "",
        teamA,
        teamB,
        referee: "",
        state: "",
        link(rel: string) {
            return rel === "self" ? { href: uri } : undefined;
        },
    } as Match;
}

test("normalizeTeamSearch trims and lowercases deterministically", () => {
    expect(normalizeTeamSearch("  FC Barca  ")).toBe("fc barca");
});

test("matchIncludesTeamQuery matches team labels case-insensitively and partially", () => {
    const match = createMatch("/matches/1");

    expect(matchIncludesTeamQuery(match, { "/matches/1": "Igualada Robotics vs Bit Builders" }, "robot")).toBe(true);
    expect(matchIncludesTeamQuery(match, { "/matches/1": "Igualada Robotics vs Bit Builders" }, "BUILDERS")).toBe(true);
    expect(matchIncludesTeamQuery(match, { "/matches/1": "Igualada Robotics vs Bit Builders" }, "storm")).toBe(false);
});

test("filterMatchesByTeam returns all matches for an empty query", () => {
    const matches = [
        createMatch("/matches/1", "Igualada Robotics", "Bit Builders"),
        createMatch("/matches/2", "Code Club", "Circuit Squad"),
    ];

    expect(filterMatchesByTeam(matches, {}, "   ")).toEqual(matches);
});

test("filterMatchesByTeam falls back to match team fields when labels are missing", () => {
    const matches = [
        createMatch("/matches/1", "Igualada Robotics", "Bit Builders"),
        createMatch("/matches/2", "Code Club", "Circuit Squad"),
    ];

    expect(filterMatchesByTeam(matches, {}, "circuit")).toEqual([matches[1]]);
});
